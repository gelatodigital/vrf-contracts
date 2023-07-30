import * as ethers from "ethers";
import shuffle from "lodash/shuffle";
import { Log } from "@ethersproject/providers";
import { Contract } from "ethers";

import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

import {
  fetchBeacon,
  HttpChainClient,
  HttpCachingChain,
  ChainOptions,
} from "drand-client";
import { hexZeroPad } from "ethers/lib/utils";

// contract abis
const INBOX_ABI = [
  "event RequestedRandomness(uint256 round, address callback, address indexed sender)",
];
const CALLBACK_ABI = [
  "function fullfillRandomness(uint256 round, uint256 randomness) external",
];

// w3f constants
const MAX_DEPTH = 700;
const MAX_RANGE = 100; // limit range of events to comply with rpc providers
const MAX_REQUESTS = 100; // limit number of requests on every execution to avoid hitting timeout

import { fastnet } from "../../src/drand_info";

const DRAND_OPTIONS: ChainOptions = {
  disableBeaconVerification: false,
  noCache: false,
  chainVerificationParams: {
    chainHash: fastnet.hash,
    publicKey: fastnet.public_key,
  },
};

async function fetchDrandResponse(round?: number) {
  // sequentially try different endpoints, in shuffled order for load-balancing
  const urls = shuffle([
    // Protocol labs endpoints
    "https://api.drand.sh",
    "https://api2.drand.sh",
    "https://api3.drand.sh",
    // Cloudflare
    "https://drand.cloudflare.com",
    // Storswift
    // Does not serve the fastnet/quicknet Drand feeds as of 2023-07-18 (only the 30 seconds feed)
    // Uncomment if this changes
    // "https://api.drand.secureweb3.com:6875",
  ]);

  console.log("Fetching randomness");
  const errors: Error[] = [];
  for (const url of urls) {
    console.log(`Trying ${url}...`);
    const chain = new HttpCachingChain(`${url}/${fastnet.hash}`, DRAND_OPTIONS);
    const client = new HttpChainClient(chain, DRAND_OPTIONS);
    try {
      return await fetchBeacon(client, round);
    } catch (err) {
      errors.push(err as Error);
    }
  }
  throw errors.pop();
}

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, multiChainProvider } = context;

  const provider = multiChainProvider.default();

  const allowedSenders = userArgs.allowedSenders as string[];
  const inboxAddress = userArgs.inbox as string;
  const inbox = new Contract(inboxAddress, INBOX_ABI, provider);

  const currentBlock = await provider.getBlockNumber();
  const lastBlockStr = await storage.get("lastBlockNumber");
  let lastBlock = lastBlockStr
    ? parseInt(lastBlockStr)
    : currentBlock - MAX_DEPTH;

  const topics = [
    ethers.utils.id("RequestedRandomness(uint256,address,address)"),
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
  for (const log of logs) {
    const event = inbox.interface.parseLog(log);
    const [roundRequested, callbackAddress, sender] = event.args;
    console.log(sender);
    const callback = new Contract(callbackAddress, CALLBACK_ABI, provider);
    const { round: roundReceived, randomness } = await fetchDrandResponse(
      roundRequested || undefined
    );
    const encodedRandomness = ethers.BigNumber.from(`0x${randomness}`);
    callData.push({
      to: callbackAddress,
      data: callback.interface.encodeFunctionData("fullfillRandomness", [
        roundReceived,
        encodedRandomness,
      ]),
    });
  }

  return {
    canExec: true,
    callData,
  };
});
