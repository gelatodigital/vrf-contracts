import { Log } from "@ethersproject/providers";
import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { BigNumber, Contract, utils } from "ethers";
import { getNextRandomness, getRoundTime } from "../../src/drand_util";
import GelatoVRFConsumerBaseAbi from "./abis/GelatoVRFConsumerBase.json";
import Multicall3Abi from "./abis/Multicall3.json";

const MAX_FILTER_RANGE = 500; // Limit range of events to comply with rpc providers.
const MAX_FILTER_REQUESTS = 3; // Limit number of requests on every execution to avoid hitting timeout.

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
        `Found ${result.length} request within blocks ${fromBlock}-${toBlock}.`
      );

      logs.push(...result);
      lastBlock = toBlock;
    } catch (error) {
      return {
        canExec: false,
        message: `Fail to getLogs ${fromBlock}-${toBlock}: ${
          (error as Error).message
        }.`,
      };
    }
  }

  // h: blockHash, t: timestamp, i: index, r: requestId
  let requests: { h: string; t: number; i: number; r: number }[] = JSON.parse(
    (await storage.get("requests")) ?? "[]"
  );
  const logCache: Map<string, Log> = new Map();

  // Collect all requests made by consumer.
  for (const log of logs) {
    const [round, consumerData] = consumer.interface.decodeEventLog(
      "RequestedRandomness",
      log.data
    ) as [BigNumber, string];

    const decoded = utils.defaultAbiCoder.decode(
      ["uint256", "bytes"],
      consumerData
    );
    const requestId: BigNumber = decoded[0];

    const timestamp = Math.floor(getRoundTime(round.toNumber()) / 1000);

    logCache.set(`${log.blockHash}-${log.logIndex}`, log);
    requests.push({
      h: log.blockHash,
      t: timestamp,
      i: log.logIndex,
      r: requestId.toNumber(),
    });
  }

  // Filter out requests that are already fulfilled
  const multicallData = requests.map(({ r }) => {
    return {
      target: consumer.address,
      callData: consumer.interface.encodeFunctionData("requestPending", [r]),
    };
  });

  const { returnData } = (await multicall.callStatic.aggregate(
    multicallData
  )) as { blockNumber: BigNumber; returnData: string[] };

  requests = requests.filter((_, index) => {
    const isRequestPending = !!parseInt(returnData[index]);
    return isRequestPending;
  });

  await storage.set("requests", JSON.stringify(requests));
  await storage.set("lastBlock", lastBlock.toString());

  console.log(`${requests.length} pending requests.`);

  // Filter out requests that are smaller than request age.
  requests = requests.filter((req) => {
    const now = Math.floor(Date.now() / 1000);

    return now > req.t + REQUEST_AGE;
  });
  console.log(`${requests.length} overdue pending requests.`);

  if (requests.length === 0) {
    return {
      canExec: false,
      message: `All VRF requests before block ${lastBlock} were fulfilled.`,
    };
  }

  // Process a random request.
  const randomRequestIndex = Math.floor(Math.random() * requests.length);
  const requestToFulfill = requests[randomRequestIndex];

  const logsToProcess = await provider.getLogs({
    address: consumerAddress,
    blockHash: requestToFulfill.h,
  });

  const logToProcess = logsToProcess.find(
    (l) => l.logIndex == requestToFulfill.i
  );

  if (logsToProcess.length === 0 || !logToProcess) {
    requests.splice(randomRequestIndex, 1);
    await storage.set("requests", JSON.stringify(requests));

    return {
      canExec: false,
      message: `Request no longer valid ${JSON.stringify(requestToFulfill)}.`,
    };
  }

  // Get randomness.
  const [round, consumerData] = consumer.interface.decodeEventLog(
    "RequestedRandomness",
    logToProcess.data
  ) as [BigNumber, string];

  const { randomness } = await getNextRandomness(round.toNumber());
  const encodedRandomness = BigNumber.from(`0x${randomness}`);

  const consumerDataWithRound = utils.defaultAbiCoder.encode(
    ["uint256", "bytes"],
    [round, consumerData]
  );

  return {
    canExec: true,
    callData: [
      {
        to: consumerAddress,
        data: consumer.interface.encodeFunctionData("fulfillRandomness", [
          encodedRandomness,
          consumerDataWithRound,
        ]),
      },
    ],
  };
});
