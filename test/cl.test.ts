import hre from "hardhat";
import { assert, expect } from "chai";
import { before } from "mocha";
import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  VRFCoordinatorV2Adapter,
  MockChainlinkVRFConsumer,
} from "../typechain";
import { Web3FunctionUserArgs } from "@gelatonetwork/automate-sdk";
import { Web3FunctionResultV2 } from "@gelatonetwork/web3-functions-sdk/*";
const { deployments, w3f, ethers } = hre;
import {
  ChainOptions,
  fetchBeacon,
  HttpCachingChain,
  HttpChainClient,
} from "drand-client";

// drand constants
const CHAIN_HASH =
  "dbd506d6ef76e5f386f41c651dcb808c5bcbd75471cc4eafa3f4df7ad4e4c493"; // fastnet hash
const PUBLIC_KEY =
  "a0b862a7527fee3a731bcb59280ab6abd62d5c0b6ea03dc4ddf6612fdfc9d01f01c31542541771903475eb1ec6615f8d0df0b8b6dce385811d6dcf8cbefb8759e5e616a3dfd054c928940766d9a5b9db91e3b697e5d70a975181e007f87fca5e";

const DRAND_OPTIONS: ChainOptions = {
  disableBeaconVerification: false,
  noCache: false,
  chainVerificationParams: { chainHash: CHAIN_HASH, publicKey: PUBLIC_KEY },
};

describe("Adapter Test Suite", function () {
  // Signers
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;

  // Web 3 Functions
  let vrf: Web3FunctionHardhat;
  let userArgs: Web3FunctionUserArgs;

  // Factories
  let adapterFactory: ContractFactory;
  let mockConsumerFactory: ContractFactory;

  // Contracts
  let adapter: VRFCoordinatorV2Adapter;
  let mockConsumer: MockChainlinkVRFConsumer;

  // Drand testing client
  let chain: HttpCachingChain;
  let client: HttpChainClient;

  before(async function () {
    await deployments.fixture();
    [deployer, user] = await ethers.getSigners();

    // Web 3 Functions
    vrf = w3f.get("adapter_fulfill_requests");

    // Solidity contracts
    adapterFactory = await ethers.getContractFactory("VRFCoordinatorV2Adapter");
    mockConsumerFactory = await ethers.getContractFactory(
      "MockChainlinkVRFConsumer"
    );

    // Drand testing client
    chain = new HttpCachingChain(
      `https://api.drand.sh/${CHAIN_HASH}`,
      DRAND_OPTIONS
    );
    client = new HttpChainClient(chain, DRAND_OPTIONS);
  });

  this.beforeEach(async () => {
    const operator = deployer.address;
    adapter = (await adapterFactory
      .connect(deployer)
      .deploy(operator)) as VRFCoordinatorV2Adapter;
    mockConsumer = (await mockConsumerFactory
      .connect(deployer)
      .deploy(adapter.address)) as MockChainlinkVRFConsumer;
    userArgs = { adapter: adapter.address, allowedSenders: [] };
  });

  it("Stores the latest round in the mock consumer", async () => {
    const requestedRound = 0x06782e;
    const numWords = 3;

    (userArgs.allowedSenders as string[]).push(mockConsumer.address);

    await mockConsumer.connect(user).doRequest(numWords);
    const requestId = await mockConsumer.requestId();

    const exec = await vrf.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);

    expect(res.callData).to.have.lengthOf(1);
    const calldata = res.callData[0];
    await deployer.sendTransaction({ to: calldata.to, data: calldata.data });

    const { randomness } = await fetchBeacon(client, requestedRound);

    const abi = ethers.utils.defaultAbiCoder;
    const seed = ethers.utils.keccak256(
      abi.encode(["uint256", "uint32"], [`0x${randomness}`, requestId])
    );
    for (let i = 0; i < numWords; i++) {
      const expected = ethers.utils.keccak256(
        abi.encode(["bytes32", "uint32"], [seed, i])
      );
      const actual = await mockConsumer.randomWordsOf(requestId, i);
      expect(actual._hex).to.equal(expected);
    }
  });

  it("Doesn't execute if no event was emitted", async () => {
    const exec = await vrf.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);
    expect(res.callData).to.have.lengthOf(0);
  });
});
