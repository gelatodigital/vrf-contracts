import shuffle from "lodash/shuffle";
import { Log } from "@ethersproject/providers";
import { ethers, Contract } from "ethers";

import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

import {
  fetchBeacon,
  HttpChainClient,
  HttpCachingChain,
  ChainOptions,
} from 'drand-client'

const PROXY_ABI = ['function implementation() public view returns (address)'];
const VRF_ABI = ['function addBeacon(uint256 round, uint256 beacon) external'];

// w3f constants
const MAX_DEPTH = 700;
const MAX_RANGE = 100; // limit range of events to comply with rpc providers
const MAX_REQUESTS = 100; // limit number of requests on every execution to avoid hitting timeout
// drand constants
const CHAIN_HASH = 'dbd506d6ef76e5f386f41c651dcb808c5bcbd75471cc4eafa3f4df7ad4e4c493' // fastnet hash
const PUBLIC_KEY = 'a0b862a7527fee3a731bcb59280ab6abd62d5c0b6ea03dc4ddf6612fdfc9d01f01c31542541771903475eb1ec6615f8d0df0b8b6dce385811d6dcf8cbefb8759e5e616a3dfd054c928940766d9a5b9db91e3b697e5d70a975181e007f87fca5e'

async function fetchDrandResponse(options: ChainOptions) {
  // sequentially try different endpoints, in shuffled order for load-balancing
  const urls = shuffle([
    // Protocol labs endpoints
    "https://api.drand.sh",
    "https://api2.drand.sh",
    "https://api3.drand.sh",
    // Cloudflare
    "https://drand.cloudflare.com",
    // Storswift
    "https://api.drand.secureweb3.com:6875",
  ])

  console.log("Fetching randomness");
  const errors: Error[] = [];
  for (const url of urls) {
    console.log(`Trying ${url}...`)
    const chain = new HttpCachingChain(`${url}/${CHAIN_HASH}`, options)
    const client = new HttpChainClient(chain, options)
    try {
      const drandResponse = await fetchBeacon(client);
      console.log(drandResponse);
      return drandResponse;
    } catch (err) {
      errors.push(err as Error)
    }
  }
  throw errors.pop()
}

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, storage, multiChainProvider } = context;
  const proxyAddress = userArgs.proxyAddress as string;

  const provider = multiChainProvider.default();

  console.log(`proxyAddress: ${proxyAddress}`)
  const proxy = new Contract(proxyAddress, PROXY_ABI, provider);
  const vrf = new Contract(await proxy.implementation(), VRF_ABI, provider);

  const currentBlock = await provider.getBlockNumber();
  const lastBlockStr = await storage.get("lastBlockNumber");
  let lastBlock = lastBlockStr ? parseInt(lastBlockStr) : currentBlock - MAX_DEPTH;

  // Fetch recent logs in range of 100 blocks
  const logs: Log[] = [];
  let nbRequests = 0;
  while (lastBlock < currentBlock && nbRequests < MAX_REQUESTS) {
    nbRequests++;
    const fromBlock = lastBlock + 1;
    const toBlock = Math.min(fromBlock + MAX_RANGE, currentBlock);
    console.log(`Fetching log events from blocks ${fromBlock} to ${toBlock}`);
    try {
      const eventFilter = {
        address: vrf.address,
        topics: [],
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
  console.log(logs)

  const options = {
    disableBeaconVerification: false, // `true` disables checking of signatures on beacons - faster but insecure!!!
    noCache: false, // `true` disables caching when retrieving beacons for some providers
    chainVerificationParams: { chainHash: CHAIN_HASH, publicKey: PUBLIC_KEY }  // these are optional, but recommended! They are compared for parity against the `/info` output of a given node
  }

  const { round, randomness } = await fetchDrandResponse(options);
  const randomWord = ethers.BigNumber.from(`0x${randomness}`);

  return {
    canExec: true,
    callData: [{ to: vrf.address, data: vrf.interface.encodeFunctionData("addBeacon", [round, randomWord]) }],
  };
});
