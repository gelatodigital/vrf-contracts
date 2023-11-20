import shuffle from "lodash/shuffle";

import {
  ChainOptions,
  HttpCachingChain,
  HttpChainClient,
  fetchBeacon,
  roundAt,
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

async function fetchDrandResponse(round: number) {
  console.log("Fetching randomness");
  const errors = [];

  for (const client of clientCache.getClients()) {
    try {
      return await fetchBeacon(client, round);
    } catch (err) {
      errors.push(err);
    }
  }
  throw errors.pop();
}

export async function getNextRandomness(requestTimeInSec: number) {
  const nextRound = roundAt(requestTimeInSec * 1000, quicknet) + 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const { round, randomness } = await fetchDrandResponse(nextRound);
      console.log(`Fulfilling from round ${round}`);
      return randomness;
    } catch (e) {
      console.log("Failed to fetch randomness", e);
      await sleep(500);
    }
  }
}
