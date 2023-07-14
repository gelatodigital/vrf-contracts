import hre from "hardhat";
import { assert, expect } from "chai";
import { before } from "mocha";
import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { GelatoVRFInbox, MockVRFConsumer } from "../typechain";
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

describe("VRF Test Suite", function () {
  // Signers
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;

  // Web 3 Functions
  let vrf: Web3FunctionHardhat;
  let userArgs: Web3FunctionUserArgs;

  // Factories
  let inboxFactory: ContractFactory;
  let mockConsumerFactory: ContractFactory;

  // Contracts
  let inbox: GelatoVRFInbox;
  let mockConsumer: MockVRFConsumer;

  // Drand testing client
  let chain: HttpCachingChain;
  let client: HttpChainClient;

  before(async function () {
    await deployments.fixture();
    [deployer, user] = await ethers.getSigners();

    // Web 3 Functions
    vrf = w3f.get("vrf");

    // Solidity contracts
    inboxFactory = await ethers.getContractFactory("GelatoVRFInbox");
    mockConsumerFactory = await ethers.getContractFactory("MockVRFConsumer");

    // Drand testing client
    chain = new HttpCachingChain(
      `https://api.drand.sh/${CHAIN_HASH}`,
      DRAND_OPTIONS
    );
    client = new HttpChainClient(chain, DRAND_OPTIONS);
  });

  this.beforeEach(async () => {
    inbox = (await inboxFactory.connect(deployer).deploy()) as GelatoVRFInbox;
    mockConsumer = (await mockConsumerFactory
      .connect(deployer)
      .deploy()) as MockVRFConsumer;
    userArgs = { inbox: inbox.address };
  });

  it("Stores the latest round in the mock consumer", async () => {
    const requestedRound = 1234;

    await inbox
      .connect(user)
      .requestRandomness(requestedRound, mockConsumer.address);

    const exec = await vrf.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);

    const calldata = res.callData[0];
    await deployer.sendTransaction({ to: calldata.to, data: calldata.data });

    fetchBeacon(client, requestedRound);
    const { round: receivedRound, randomness } = await fetchBeacon(
      client,
      requestedRound
    );

    const latestRound = await mockConsumer.latestRound();
    expect(await mockConsumer.beaconOf(latestRound)).to.equal(
      ethers.BigNumber.from(`0x${randomness}`)
    );
    expect(latestRound).to.equal(requestedRound).and.to.equal(receivedRound);
  });

  it("Doesn't execute if no event was emitted", async () => {
    const exec = await vrf.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);
    expect(res.callData.length).to.equal(0);
  });
});
