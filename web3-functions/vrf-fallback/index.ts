import { Log } from "@ethersproject/providers";
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { BigNumber, Contract, utils } from "ethers";
import { getNextRandomness } from "../../src/drand_util";
import Multicall3Abi from "./Multicall3Abi.json";

// contract abis
const CONSUMER_ABI = [
  "event RequestedRandomness(uint256 round, bytes data)",
  "function fulfillRandomness(uint256 randomness, bytes calldata data) external",
  "function requestPending(uint256 index) external view returns(bool)",
];

const MAX_FILTER_RANGE = 100; // limit range of events to comply with rpc providers
const MAX_FILTER_REQUESTS = 5; // limit number of requests on every execution to avoid hitting timeout

const REQUEST_AGE = 60; // 1 minute. (Triggers fallback if request not fulfilled after time)

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, gelatoArgs, multiChainProvider, storage } = context;

  const provider = multiChainProvider.default();

  const consumerAddress = userArgs.consumerAddress as string;
  const consumer = new Contract(consumerAddress, CONSUMER_ABI, provider);

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
      logs.push(...result);
      lastBlock = toBlock;
    } catch (error) {
      return {
        canExec: false,
        message: `Rpc call failed: ${(error as Error).message}`,
      };
    }
  }

  console.log(`logs length: ${logs.length}`);

  // h: blockHash, t: timestamp, i: index
  const pendingRequests: { h: string; t: number; i: number }[] = JSON.parse(
    (await storage.get("pendingRequests")) ?? "[]"
  );

  for (const log of logs) {
    // Todo: reduce rpc call here
    const timestamp = (await provider.getBlock(log.blockNumber)).timestamp;

    pendingRequests.push({
      h: log.blockHash,
      t: timestamp,
      i: log.logIndex,
    });
  }

  const pendingRoundAndDatas: { round: BigNumber; consumerData: string }[] = [];

  for (const req of pendingRequests) {
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

      console.log("logInPending: ", JSON.stringify(logInPending));

      if (logInPending.length == 0) continue;

      const [round, consumerData] = consumer.interface.decodeEventLog(
        "RequestedRandomness",
        logInPending[0].data
      ) as [BigNumber, string];

      pendingRoundAndDatas.push({ round, consumerData });
    }
  }

  const multicallData = pendingRoundAndDatas.map(({ consumerData }) => {
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

  const callData = [];
  for (const [index, data] of returnData.entries()) {
    const isRequestPending = !!parseInt(data);
    console.log(`isRequestPending: ${isRequestPending}`);

    if (isRequestPending) {
      const { round, consumerData } = pendingRoundAndDatas[index];

      const { randomness } = await getNextRandomness(round.toNumber());
      const encodedRandomness = BigNumber.from(`0x${randomness}`);

      const consumerDataWithRound = utils.defaultAbiCoder.encode(
        ["uint256", "bytes"],
        [round, consumerData]
      );

      callData.push({
        to: consumerAddress,
        data: consumer.interface.encodeFunctionData("fulfillRandomness", [
          encodedRandomness,
          consumerDataWithRound,
        ]),
      });
    }
  }

  // Todo: update lastBlock

  if (callData.length > 0) {
    return {
      canExec: true,
      callData,
    };
  } else {
    return {
      canExec: false,
      message: `All vrf request fulfilled at ${lastBlock}`,
    };
  }
});
