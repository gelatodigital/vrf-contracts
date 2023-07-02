import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

      import { 
      fetchBeacon, 
      HttpChainClient, 
      HttpCachingChain, 
    } from './drand-client'

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { gelatoArgs, multiChainProvider } = context;

    const chainHash = '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce' // (hex encoded)
    const publicKey = '868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31' // (hex encoded)

            const options = {
            disableBeaconVerification: false, // `true` disables checking of signatures on beacons - faster but insecure!!!
            noCache: false, // `true` disables caching when retrieving beacons for some providers
            chainVerificationParams: { chainHash, publicKey }  // these are optional, but recommended! They are compared for parity against the `/info` output of a given node
        }

        // if you want to connect to a single chain to grab the latest beacon you can simply do the following
        const chain = new HttpCachingChain('https://api.drand.sh', options)
        const client = new HttpChainClient(chain, options)
        const theLatestBeacon = await fetchBeacon(client)

	console.log({theLatestBeacon})

  return {
    canExec: true,
    callData: [],
  };
});
