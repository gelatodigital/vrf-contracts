import * as ethers from "ethers";
import { Log } from "@ethersproject/providers";
import { Contract } from "ethers";

import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

import { getNextRandomness } from "../../src/drand_util";

// contract abis
const CONSUMER_ABI = [
  "event RequestedRandomness(bytes data)",
  "function fulfillRandomness(uint256 randomness, bytes calldata data) external",
];

// w3f constants
const MAX_RANGE = 100; // limit range of events to comply with rpc providers
const MAX_REQUESTS = 5; // limit number of requests on every execution to avoid hitting timeout
const MAX_DEPTH = MAX_RANGE * MAX_REQUESTS; // How far the VRF should catch up with blocks
const MAX_DISTANCE = 1000; // Helpful to detect if the VRF has been paused not to recover too many blocks
const MAX_TRANSACTIONS = 10; // limit number of transactions to avoid failure due to block gas limit

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, multiChainProvider } = context;

  const provider = multiChainProvider.default();

  const consumerAddress = userArgs.consumerAddress as string[];
  const consumer = new Contract(consumerAddress, CONSUMER_ABI, provider);

  const currentBlock = await provider.getBlockNumber();
  const lastBlockStr = await storage.get("lastBlockNumber");
  let lastBlock = lastBlockStr ? parseInt(lastBlockStr) : 0;

  if (!lastBlockStr || currentBlock - lastBlock > MAX_DISTANCE) {
    lastBlock = currentBlock - MAX_DEPTH;
  }

  const topics = [consumer.interface.getEventTopic("RequestedRandomness")];

  // Fetch recent logs in range of 100 blocks
  const logs: Log[] = [];
  let nbRequests = 0;
  while (lastBlock < currentBlock && nbRequests < MAX_REQUESTS) {
    nbRequests++;
    const fromBlock = lastBlock + 1;
    const toBlock = Math.min(fromBlock + MAX_RANGE, currentBlock);
    try {
      const eventFilter = {
        address: consumer.address,
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

  // Parse retrieved events
  console.log(`Matched ${logs.length} new events`);
  const randomness = await getNextRandomness();
  const encodedRandomness = ethers.BigNumber.from(`0x${randomness}`);

  // Prepare calldata and rate limit
  const oldCallDataStr = await storage.get("oldCallData");
  const callData = oldCallDataStr ? JSON.parse(oldCallDataStr) : [];
  const nextCallData = [];
  const remainTx = MAX_TRANSACTIONS - callData.length

  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const event = consumer.interface.parseLog(log);
    const [data] = event.args;
  
    if (i < remainTx) {
      callData.push({
        to: consumerAddress,
        data: consumer.interface.encodeFunctionData("fulfillRandomness", [
          encodedRandomness,
          data,
        ]),
      });
    } else {
      nextCallData.push({
        to: consumerAddress,
        data: consumer.interface.encodeFunctionData("fulfillRandomness", [
          encodedRandomness,
          data,
        ]),
      });
    }
  }

  await storage.set("lastBlockNumber", `${currentBlock}`);
  await storage.set("oldCallData", JSON.stringify(nextCallData));


  return {
    canExec: true,
    callData,
  };
});
