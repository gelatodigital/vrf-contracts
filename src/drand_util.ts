import shuffle from "lodash/shuffle";

import {
  ChainOptions,
  HttpCachingChain,
  HttpChainClient,
  RandomnessBeacon,
  fetchBeacon,
  roundTime,
} from "drand-client";

import { quicknet } from "./drand_info";

const DRAND_OPTIONS: ChainOptions = {
  disableBeaconVerification: false,
  noCache: true,
  chainVerificationParams: {
    chainHash: quicknet.hash,
    publicKey: quicknet.public_key,
  },
};

async function sleep(duration: number) {
  await new Promise((resolve) => setTimeout(resolve, duration));
}

class HttpChainClientCache {
  #chainClients: HttpChainClient[] = [];

  constructor(urls: string[]) {
    urls.forEach((url) => {
      const chain = new HttpCachingChain(
        `${url}/${quicknet.hash}`,
        DRAND_OPTIONS
      );
      const client = new HttpChainClient(chain, DRAND_OPTIONS);
      this.#chainClients.push(client);
    });
  }

  getClients() {
    return shuffle([...this.#chainClients]);
  }
}

const clientCache = new HttpChainClientCache([
  // Protocol labs endpoints
  "https://api.drand.sh",
  "https://api2.drand.sh",
  "https://api3.drand.sh",
  // Cloudflare
  "https://drand.cloudflare.com",
  // Storswift
  "https://api.drand.secureweb3.com:6875",
]);

const randomnessOfRoundCache: Map<number, string> = new Map();

async function fetchDrandResponseWithCaching(round: number) {
  let randomness = randomnessOfRoundCache.get(round);

  if (!randomness) {
    const response = await fetchDrandResponse(round);
    randomness = response.randomness;
    randomnessOfRoundCache.set(response.round, randomness);

    return { round: response.round, randomness };
  }

  return { round, randomness };
}

async function fetchBeaconWithTimeout(
  client: HttpChainClient,
  round: number,
  timeout = 5_000
): Promise<RandomnessBeacon> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(`Timeout`)), timeout);
    fetchBeacon(client, round)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        reject(err);
      });
  });
}

async function fetchDrandResponse(round: number) {
  console.log(`Fetching randomness from round ${round}`);
  const errors = [];

  for (const client of clientCache.getClients()) {
    try {
      return await fetchBeaconWithTimeout(client, round);
    } catch (err) {
      console.error(`Failed to fetch randomness: ${(err as Error).message}`);
      errors.push(err);
    }
  }
  throw errors.pop();
}

export async function getNextRandomness(round: number) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const { randomness } = await fetchDrandResponseWithCaching(round);
      console.log(`Fulfilling from round ${round}`);
      return { randomness };
    } catch (e) {
      console.log("Failed to fetch randomness", e);
      await sleep(500);
    }
  }
}

export function getRoundTime(round: number) {
  return roundTime(quicknet, round);
}
