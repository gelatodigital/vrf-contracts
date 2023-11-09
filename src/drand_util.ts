import shuffle from "lodash/shuffle";

import {
  ChainOptions,
  HttpCachingChain,
  HttpChainClient,
  fetchBeacon,
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
    "https://api.drand.secureweb3.com:6875",
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

export async function getNextRandomness(timestampInSec: number) {
  const requestTime = timestampInSec * 1000;
  const nextRound = roundAt(requestTime, quicknet) + 1;
  if (roundTime(quicknet, nextRound) > requestTime) {
    await sleep(roundTime(quicknet, nextRound) - requestTime);
  }
  const { round, randomness } = await fetchDrandResponse(nextRound);
  console.log(`Fulfilling from round ${round}`);
  return randomness;
}
