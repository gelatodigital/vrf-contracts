import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

import { 
  fetchBeacon, 
  HttpChainClient, 
  HttpCachingChain, 
} from 'drand-client'

// this is fastnet
const chainHash = 'dbd506d6ef76e5f386f41c651dcb808c5bcbd75471cc4eafa3f4df7ad4e4c493'
const publicKey = 'a0b862a7527fee3a731bcb59280ab6abd62d5c0b6ea03dc4ddf6612fdfc9d01f01c31542541771903475eb1ec6615f8d0df0b8b6dce385811d6dcf8cbefb8759e5e616a3dfd054c928940766d9a5b9db91e3b697e5d70a975181e007f87fca5e'

Web3Function.onRun(async (_: Web3FunctionContext) => {
  // const { gelatoArgs, multiChainProvider } = context;

  const options = {
    disableBeaconVerification: false, // `true` disables checking of signatures on beacons - faster but insecure!!!
    noCache: false, // `true` disables caching when retrieving beacons for some providers
    chainVerificationParams: { chainHash, publicKey }  // these are optional, but recommended! They are compared for parity against the `/info` output of a given node
  }

  // if you want to connect to a single chain to grab the latest beacon you can simply do the following
  const chain = new HttpCachingChain(`https://api.drand.sh/${chainHash}`, options)
  const client = new HttpChainClient(chain, options)
  const theLatestBeacon = await fetchBeacon(client)

	console.log(theLatestBeacon)

  return {
    canExec: true,
    callData: [],
  };
});
