import { Log } from "@ethersproject/providers";
import * as ethers from "ethers";
import { Contract } from "ethers";

import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";
import { getNextRandomness } from "../../src/drand_util";

// contract abis
const CONSUMER_ABI = [
  "event RequestedRandomness(uint256 round, bytes data)",
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

  const consumerAddress = userArgs.consumerAddress as string;
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
    const toBlock = Math.min(lastBlock + MAX_RANGE, currentBlock);
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

  const callData = [];

  // Parse retrieved events
  console.log(`Matched ${logs.length} new events`);
  for (const log of logs) {
    const event = consumer.interface.parseLog(log);
    const [round, consumerData] = event.args;

    const { randomness } = await getNextRandomness(parseInt(round));
    const encodedRandomness = ethers.BigNumber.from(`0x${randomness}`);

    const consumerDataWithRound = ethers.utils.defaultAbiCoder.encode(
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

  await storage.set("lastBlockNumber", `${currentBlock}`);

  return {
    canExec: true,
    callData,
  };
});
