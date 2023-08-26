import shuffle from "lodash/shuffle";

import {
  fetchBeacon,
  HttpChainClient,
  HttpCachingChain,
  ChainOptions,
  roundAt,
  roundTime,
} from "drand-client";

import { quicknet } from "./drand_info";

const DRAND_OPTIONS: ChainOptions = {
  disableBeaconVerification: false,
  noCache: false,
  chainVerificationParams: {
    chainHash: quicknet.hash,
    publicKey: quicknet.public_key,
  },
};

async function sleep(duration: number) {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

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
    const chain = new HttpCachingChain(
      `${url}/${quicknet.hash}`,
      DRAND_OPTIONS
    );
    const client = new HttpChainClient(chain, DRAND_OPTIONS);
    try {
      return await fetchBeacon(client, round);
    } catch (err) {
      errors.push(err as Error);
    }
  }
  throw errors.pop();
}

export async function getNextRandomness() {
  const now = Date.now();
  const nextRound = roundAt(now, quicknet) + 1;
  await sleep(roundTime(quicknet, nextRound) - now);
  const { round, randomness } = await fetchDrandResponse(nextRound);
  console.log(`Fulfilling from round ${round}`);
  return randomness;
}
