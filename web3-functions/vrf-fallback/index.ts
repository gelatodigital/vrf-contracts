import { Log } from "@ethersproject/providers";
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { BigNumber, Contract, utils } from "ethers";
import { getNextRandomness } from "../../src/drand_util";
import GelatoVRFConsumerBaseAbi from "./abis/GelatoVRFConsumerBase.json";
import Multicall3Abi from "./abis/Multicall3.json";

const MAX_FILTER_RANGE = 100; // Limit range of events to comply with rpc providers.
const MAX_FILTER_REQUESTS = 5; // Limit number of requests on every execution to avoid hitting timeout.

const REQUEST_AGE = 60; // 1 minute. (Triggers fallback if request not fulfilled after time.)

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, gelatoArgs, multiChainProvider, storage } = context;

  const provider = multiChainProvider.default();

  const consumerAddress = userArgs.consumerAddress as string;
  const consumer = new Contract(
    consumerAddress,
    GelatoVRFConsumerBaseAbi,
    provider
  );

  const multicall3Address =
    gelatoArgs.chainId === 324 // zksync
      ? "0xF9cda624FBC7e059355ce98a31693d299FACd963"
      : "0xcA11bde05977b3631167028862bE2a173976CA11";
  const multicall = new Contract(multicall3Address, Multicall3Abi, provider);

  const currentBlock = await provider.getBlockNumber();

  const logs: Log[] = [];
  let lastBlock = Number((await storage.get("lastBlock")) ?? currentBlock);
  let nbRequests = 0;

  while (lastBlock < currentBlock && nbRequests < MAX_FILTER_REQUESTS) {
    nbRequests++;

    const fromBlock = lastBlock + 1;
    const toBlock = Math.min(lastBlock + MAX_FILTER_RANGE, currentBlock);
    const topics = [consumer.interface.getEventTopic("RequestedRandomness")];

    try {
      const eventFilter = {
        address: consumer.address,
        topics,
        fromBlock,
        toBlock,
      };

      const result = await provider.getLogs(eventFilter);
      console.log(
        `Found ${result.length} request within blocks ${fromBlock}-${toBlock}`
      );

      logs.push(...result);
      lastBlock = toBlock;
    } catch (error) {
      return {
        canExec: false,
        message: `Fail to getLogs ${fromBlock}-${toBlock}: ${
          (error as Error).message
        }`,
      };
    }
  }

  // h: blockHash, t: timestamp, i: index
  const requests: { h: string; t: number; i: number }[] = JSON.parse(
    (await storage.get("requests")) ?? "[]"
  );

  // Collect all requests made by consumer.
  for (const log of logs) {
    // Todo: reduce rpc call here
    const timestamp = (await provider.getBlock(log.blockNumber)).timestamp;

    requests.push({
      h: log.blockHash,
      t: timestamp,
      i: log.logIndex,
    });
  }

  const overdueRequests: {
    round: BigNumber;
    consumerData: string;
    pos: number; // index in requests array
  }[] = [];

  // Check if requests are over the REQUEST_AGE.
  for (const [index, req] of requests.entries()) {
    const now = Math.floor(Date.now() / 1000);

    if (now > req.t + REQUEST_AGE) {
      const logs = await provider.getLogs({
        address: consumerAddress,
        blockHash: req.h,
      });

      if (logs.length == 0) continue;

      const logInPending = logs.filter((log) => {
        return log.logIndex == req.i;
      });

      if (logInPending.length == 0) continue;

      const [round, consumerData] = consumer.interface.decodeEventLog(
        "RequestedRandomness",
        logInPending[0].data
      ) as [BigNumber, string];

      overdueRequests.push({ round, consumerData, pos: index });
    }
  }

  console.log(`Processing ${overdueRequests.length} overdue requests`);

  // Check if requests are already fulfilled by event trigger w3f.
  const multicallData = overdueRequests.map(({ consumerData }) => {
    const decoded = utils.defaultAbiCoder.decode(
      ["uint256", "bytes"],
      consumerData
    );
    const requestId: BigNumber = decoded[0];

    const callData = consumer.interface.encodeFunctionData("requestPending", [
      requestId,
    ]);

    return { target: consumer.address, callData };
  });

  const { returnData } = (await multicall.callStatic.aggregate(
    multicallData
  )) as { blockNumber: BigNumber; returnData: string[] };

  const callDatas = [];
  let nrFulfilledOverdueRequests = 0;
  for (const [index, data] of returnData.entries()) {
    const isRequestPending = !!parseInt(data);

    const { round, consumerData, pos } = overdueRequests[index];

    if (isRequestPending) {
      const { randomness } = await getNextRandomness(round.toNumber());
      const encodedRandomness = BigNumber.from(`0x${randomness}`);

      const consumerDataWithRound = utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [round, consumerData]
      );

      callDatas.push({
        to: consumerAddress,
        data: consumer.interface.encodeFunctionData("fulfillRandomness", [
          encodedRandomness,
          consumerDataWithRound,
        ]),
      });
    } else {
      nrFulfilledOverdueRequests++;

      // Remove request from requests array.
      // Request that is being fulfilled by fallback will be removed on the next run.
      requests.splice(pos, 1);
    }
  }

  console.log(`${callDatas.length} unfulfilled overdue requests`);
  console.log(`${nrFulfilledOverdueRequests} fulfilled overdue requests`);

  await storage.set("requests", JSON.stringify(requests));
  await storage.set("lastBlock", lastBlock.toString());

  if (callDatas.length > 0) {
    // Execute a random unfulfilled overdue request.
    const callData = callDatas[Math.floor(Math.random() * callDatas.length)];

    return {
      canExec: true,
      callData: [callData],
    };
  } else {
    return {
      canExec: false,
      message: `All vrf requests before block ${lastBlock} were fulfilled`,
    };
  }
});
