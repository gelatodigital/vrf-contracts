import * as ethers from "ethers";
import { Log } from "@ethersproject/providers";
import { Contract } from "ethers";

import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

import { hexZeroPad } from "ethers/lib/utils";

import { getNextRandomness } from "../common";

// contract abis
const ADAPTER_ABI = [
  `event RandomnessRequest(
        address indexed sender,
        uint32 numWords,
        uint256 requestId,
        address consumer
    )`,
  `function fulfillRandomWords(
        uint32 numWords,
        uint256 requestId,
        uint256 randomness,
        address consumer
    ) external`,
];

// w3f constants
const MAX_DEPTH = 700;
const MAX_RANGE = 100; // limit range of events to comply with rpc providers
const MAX_REQUESTS = 100; // limit number of requests on every execution to avoid hitting timeout

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, multiChainProvider } = context;

  const provider = multiChainProvider.default();

  const allowedSenders = userArgs.allowedSenders as string[];
  const adapterAddress = userArgs.adapter as string;
  const adapter = new Contract(adapterAddress, ADAPTER_ABI, provider);

  const currentBlock = await provider.getBlockNumber();
  const lastBlockStr = await storage.get("lastBlockNumber");
  let lastBlock = lastBlockStr
    ? parseInt(lastBlockStr)
    : currentBlock - MAX_DEPTH;

  const topics = [
    adapter.interface.getEventTopic("RandomnessRequest"),
    allowedSenders.map((e) => hexZeroPad(e, 32)),
  ];

  // Fetch recent logs in range of 100 blocks
  const logs: Log[] = [];
  let nbRequests = 0;
  while (lastBlock < currentBlock && nbRequests < MAX_REQUESTS) {
    nbRequests++;
    const fromBlock = lastBlock + 1;
    const toBlock = Math.min(fromBlock + MAX_RANGE, currentBlock);
    try {
      const eventFilter = {
        address: adapterAddress,
        topics,
        fromBlock,
        toBlock,
      };
      const result = await provider.getLogs(eventFilter);
      logs.push(...result);
      lastBlock = toBlock;
    } catch (err) {
      return {
        canExec: false,
        message: `Rpc call failed: ${(err as Error).message}`,
      };
    }
  }

  const callData = [];

  // Parse retrieved events
  for (const log of logs) {
    const event = adapter.interface.parseLog(log);
    const [, numWords, requestId, consumer] = event.args;
    const randomness = await getNextRandomness();
    const encodedRandomness = ethers.BigNumber.from(`0x${randomness}`);
    callData.push({
      to: adapterAddress,
      data: adapter.interface.encodeFunctionData("fulfillRandomWords", [
        numWords,
        requestId,
        encodedRandomness,
        consumer,
      ]),
    });
  }

  return {
    canExec: true,
    callData,
  };
});
