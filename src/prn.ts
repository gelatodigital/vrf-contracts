import { defaultAbiCoder } from "@ethersproject/abi";
import { BigNumber } from "@ethersproject/bignumber";
import { keccak256 } from "@ethersproject/keccak256";
import { Log } from "@ethersproject/providers";

export const generatePRN = (randomness: string, log: Log) => {
  const hash = keccak256(
    defaultAbiCoder.encode(
      ["string", "bytes32", "bytes32", "uint256"],
      [randomness, log.blockHash, log.transactionHash, log.logIndex]
    )
  );

  return BigNumber.from(hash);
};
