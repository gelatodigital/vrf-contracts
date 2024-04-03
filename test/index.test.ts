import { Web3FunctionUserArgs } from "@gelatonetwork/automate-sdk";
import { Web3FunctionResultV2 } from "@gelatonetwork/web3-functions-sdk";
import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import {
  ChainOptions,
  HttpCachingChain,
  HttpChainClient,
  fetchBeacon,
} from "drand-client";
import { BigNumber, ContractFactory } from "ethers";
import hre from "hardhat";
import { quicknet } from "../src/drand_info";
import { MockVRFConsumer } from "../typechain";
const { deployments, w3f, ethers } = hre;

import { sleep } from "drand-client/util";

import fetch from "node-fetch";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).fetch = fetch;

const DRAND_OPTIONS: ChainOptions = {
  disableBeaconVerification: false,
  noCache: true,
  chainVerificationParams: {
    chainHash: quicknet.hash,
    publicKey: quicknet.public_key,
  },
};

describe("GelatoVRFConsumerBase Test Suite", function () {
  // Signers
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let dedicatedMsgSender: SignerWithAddress;

  // Web 3 Functions
  let vrf: Web3FunctionHardhat;
  let userArgs: Web3FunctionUserArgs;

  // Factories
  let mockConsumerFactory: ContractFactory;

  // Contracts
  let mockConsumer: MockVRFConsumer;

  // Drand testing client
  let chain: HttpCachingChain;
  let client: HttpChainClient;

  before(async function () {
    await deployments.fixture();
    [deployer, user, dedicatedMsgSender] = await ethers.getSigners();

    // Web 3 Functions
    vrf = w3f.get("vrf");

    // Solidity contracts
    mockConsumerFactory = await ethers.getContractFactory(
      "contracts/mocks/MockVRFConsumer.sol:MockVRFConsumer"
    );

    // Drand testing client
    chain = new HttpCachingChain(
      `https://api.drand.sh/${quicknet.hash}`,
      DRAND_OPTIONS
    );
    client = new HttpChainClient(chain, DRAND_OPTIONS);
  });

  this.beforeEach(async () => {
    mockConsumer = (await mockConsumerFactory
      .connect(deployer)
      .deploy(dedicatedMsgSender.address)) as MockVRFConsumer;
    userArgs = { consumerAddress: mockConsumer.address };
  });

  it("Stores the latest round in the mock consumer", async () => {
    for (let i = 0; i < 2; i++) {
      const expectedExtraData = "0x12345678";

      const requestId = i;
      const tx = await mockConsumer
        .connect(user)
        .requestRandomness(expectedExtraData);
      const txReceipt = await tx.wait();
      const [roundBn] = mockConsumer.interface.decodeEventLog(
        "RequestedRandomness",
        txReceipt.logs[0].data
      );
      const round = parseInt(roundBn);

      const timeNowSec = Math.floor(Date.now() / 1000);
      const timeOfRound = round * quicknet.period + quicknet.genesis_time;
      await sleep((timeOfRound - timeNowSec) * 1000);

      const exec = await vrf.run("onRun", { userArgs });
      const res = exec.result as Web3FunctionResultV2;

      if (!res.canExec) assert.fail(res.message);

      res.callData.forEach(
        async (callData) => await dedicatedMsgSender.sendTransaction(callData)
      );

      const { randomness } = await fetchBeacon(client, round);

      const abi = ethers.utils.defaultAbiCoder;
      expect(await mockConsumer.latestRandomness()).to.equal(
        ethers.BigNumber.from(
          ethers.utils.keccak256(
            abi.encode(
              ["uint256", "address", "uint256", "uint256"],
              [
                ethers.BigNumber.from(`0x${randomness}`),
                mockConsumer.address,
                (await ethers.provider.getNetwork()).chainId,
                requestId,
              ]
            )
          )
        )
      );

      expect(await mockConsumer.latestExtraData()).to.equal(expectedExtraData);
    }
  });

  it("Doesn't execute if no event was emitted", async () => {
    const exec = await vrf.run("onRun", { userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);
    expect(res.callData).to.have.lengthOf(0);
  });

  it("Should not fulfill randomness when incorrect data is passed", async () => {
    const expectedExtraData = "0x12345678";

    const tx = await mockConsumer
      .connect(user)
      .requestRandomness(expectedExtraData);
    const txReceipt = await tx.wait();

    const [roundBn] = mockConsumer.interface.decodeEventLog(
      "RequestedRandomness",
      txReceipt.logs[0].data
    );
    const round = parseInt(roundBn);

    const timeNowSec = Math.floor(Date.now() / 1000);
    const timeOfRound = round * quicknet.period + quicknet.genesis_time;
    await sleep((timeOfRound - timeNowSec) * 1000);

    const { randomness } = await fetchBeacon(client, round);
    const encodedRandomness = ethers.BigNumber.from(`0x${randomness}`);

    const requestId = 0;
    const incorrectConsumerData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [requestId, "0x000000"]
    );
    const incorrectDataWithRound = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [round, incorrectConsumerData]
    );

    const data = mockConsumer.interface.encodeFunctionData(
      "fulfillRandomness",
      [encodedRandomness, incorrectDataWithRound]
    );

    await dedicatedMsgSender.sendTransaction({
      to: mockConsumer.address,
      data,
    });

    expect(await mockConsumer.latestRandomness()).to.equal(BigNumber.from("0"));
  });

  it("Should revert when incorrect request id is passed", async () => {
    const expectedExtraData = "0x12345678";

    const tx = await mockConsumer
      .connect(user)
      .requestRandomness(expectedExtraData);
    const txReceipt = await tx.wait();

    const [roundBn] = mockConsumer.interface.decodeEventLog(
      "RequestedRandomness",
      txReceipt.logs[0].data
    );
    const round = parseInt(roundBn);

    const timeNowSec = Math.floor(Date.now() / 1000);
    const timeOfRound = round * quicknet.period + quicknet.genesis_time;
    await sleep((timeOfRound - timeNowSec) * 1000);

    const { randomness } = await fetchBeacon(client, round);
    const encodedRandomness = ethers.BigNumber.from(`0x${randomness}`);

    const incorrectRequestId = 1;
    const incorrectConsumerData = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [incorrectRequestId, expectedExtraData]
    );
    const incorrectDataWithRound = ethers.utils.defaultAbiCoder.encode(
      ["uint256", "bytes"],
      [round, incorrectConsumerData]
    );

    const data = mockConsumer.interface.encodeFunctionData(
      "fulfillRandomness",
      [encodedRandomness, incorrectDataWithRound]
    );

    await expect(
      dedicatedMsgSender.sendTransaction({
        to: mockConsumer.address,
        data,
      })
    ).to.be.reverted;
  });
});
