import * as ethers from "ethers";
import { Log } from "@ethersproject/providers";
import { Contract } from "ethers";

import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

import { hexZeroPad } from "ethers/lib/utils";

import { getNextRandomness } from "../../src/drand_util";

// contract abis
const INBOX_ABI = [
  "event RequestedRandomness(address callback, address indexed sender, bytes data)",
];
const CALLBACK_ABI = [
  "function fulfillRandomness(uint256 randomness, bytes calldata data) external",
];

// w3f constants
const MAX_RANGE = 100; // limit range of events to comply with rpc providers
const MAX_REQUESTS = 5; // limit number of requests on every execution to avoid hitting timeout
const MAX_DEPTH = MAX_RANGE * MAX_REQUESTS; // How far the VRF should catch up with blocks
const MAX_DISTANCE = 1000; // Helpful to detect if the VRF has been paused not to recover too many blocks 

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, multiChainProvider } = context;

  const provider = multiChainProvider.default();

  const allowedSenders = userArgs.allowedSenders as string[];
  const inboxAddress = userArgs.inbox as string;
  const inbox = new Contract(inboxAddress, INBOX_ABI, provider);

  const currentBlock = await provider.getBlockNumber();
  const lastBlockStr = await storage.get("lastBlockNumber");
  let lastBlock = lastBlockStr ? parseInt(lastBlockStr) : 0;

  if (!lastBlockStr || currentBlock - lastBlock > MAX_DISTANCE) {
    lastBlock = currentBlock - MAX_DEPTH;
  }

  const topics = [
    inbox.interface.getEventTopic("RequestedRandomness"),
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
        address: inbox.address,
        topics: topics,
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
  console.log(`Matched ${logs.length} new events`);
  const randomness = await getNextRandomness();
  const encodedRandomness = ethers.BigNumber.from(`0x${randomness}`);
  for (const log of logs) {
    const event = inbox.interface.parseLog(log);
    const [callbackAddress, , data] = event.args;
    const callback = new Contract(callbackAddress, CALLBACK_ABI, provider);
    callData.push({
      to: callbackAddress,
      data: callback.interface.encodeFunctionData("fulfillRandomness", [
        encodedRandomness,
        data,
      ]),
    });
  }

  await storage.set("lastBlockNumber", `${currentBlock}`);

  return {
    canExec: true,
    callData,
  };
});
