import * as ethers from "ethers";
import { Contract } from "ethers";

import {
  Web3Function,
  Web3FunctionEventContext,
} from "@gelatonetwork/web3-functions-sdk";
import { getNextRandomness } from "../../src/drand_util";

// contract abis
const CONSUMER_ABI = [
  "event RequestedRandomness(uint256 round, bytes data)",
  "function fulfillRandomness(uint256 randomness, bytes calldata data) external",
];

Web3Function.onRun(async (context: Web3FunctionEventContext) => {
  const { userArgs, multiChainProvider, log } = context;

  const provider = multiChainProvider.default();

  const consumerAddress = userArgs.consumerAddress as string;
  const consumer = new Contract(consumerAddress, CONSUMER_ABI, provider);

  const event = consumer.interface.parseLog(log);
  const [round, consumerData] = event.args;

  const { randomness } = await getNextRandomness(parseInt(round));
  const encodedRandomness = ethers.BigNumber.from(`0x${randomness}`);

  const consumerDataWithRound = ethers.utils.defaultAbiCoder.encode(
    ["uint256", "bytes"],
    [round, consumerData]
  );

  const data = consumer.interface.encodeFunctionData("fulfillRandomness", [
    encodedRandomness,
    consumerDataWithRound,
  ]);

  return {
    canExec: true,
    callData: [{ to: consumerAddress, data }],
  };
});
