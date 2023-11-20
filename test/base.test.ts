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
  roundAt,
} from "drand-client";
import { ContractFactory } from "ethers";
import hre from "hardhat";
import { quicknet } from "../src/drand_info";
import { MockVRFConsumerBase } from "../typechain";
const { deployments, w3f, ethers } = hre;

import { sleep } from "drand-client/util";
import fetch from "node-fetch";
global.fetch = fetch;

const DRAND_OPTIONS: ChainOptions = {
  disableBeaconVerification: false,
  noCache: true,
  chainVerificationParams: {
    chainHash: quicknet.hash,
    publicKey: quicknet.public_key,
  },
};

describe("ConsumerBase Test Suite", function () {
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
  let mockConsumer: MockVRFConsumerBase;

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
      "contracts/mocks/MockVRFConsumerBase.sol:MockVRFConsumerBase"
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
      .deploy(dedicatedMsgSender.address)) as MockVRFConsumerBase;
    userArgs = { consumerAddress: mockConsumer.address };
  });

  it("Stores the latest round in the mock consumer", async () => {
    for (let i = 0; i < 2; i++) {
      const expectedExtraData = "0x12345678";

      const requestId = i;
      await mockConsumer.connect(user).requestRandomness(expectedExtraData);

      const exec = await vrf.run({ userArgs });
      const res = exec.result as Web3FunctionResultV2;
      const round = roundAt(Date.now(), quicknet);

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

  it("Doesnt store the last round after round elapsed", async () => {
    const roundsToFulfill = 2;
    const expectedExtraData = "0x12345678";

    await mockConsumer.connect(user).requestRandomness(expectedExtraData);
    const lastRequestId = await mockConsumer.latestRequestId();
    const requestDeadline = await mockConsumer.requestDeadline(lastRequestId);

    // catch up to block time (block time is faster than Date.now() in tests)
    const blockTimeNow =
      (await ethers.provider.getBlock("latest")).timestamp * 1000;
    await sleep(blockTimeNow - Date.now());

    const exec = await vrf.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);

    // wait until past deadline
    await sleep((roundsToFulfill + 3) * quicknet.period * 1000);

    const round = roundAt(Date.now(), quicknet);
    expect(round).to.be.gt(requestDeadline);

    const callData = res.callData[0];
    await dedicatedMsgSender.sendTransaction(callData);

    const latestRequestId = await mockConsumer.latestRequestId();

    expect(latestRequestId).to.equal(lastRequestId);
  });

  it("Doesn't execute if no event was emitted", async () => {
    const exec = await vrf.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);
    expect(res.callData).to.have.lengthOf(0);
  });
});
