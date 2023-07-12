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

  before(async function () {
    await deployments.fixture();
    [deployer, user] = await ethers.getSigners();

    // Web 3 Functions
    vrf = w3f.get("vrf");

    // Solidity contracts
    inboxFactory = await ethers.getContractFactory("GelatoVRFInbox");
    mockConsumerFactory = await ethers.getContractFactory("MockVRFConsumer");
  });

  this.beforeEach(async () => {
    inbox = (await inboxFactory.connect(deployer).deploy()) as GelatoVRFInbox;
    mockConsumer = (await mockConsumerFactory
      .connect(deployer)
      .deploy()) as MockVRFConsumer;
    userArgs = { inbox: inbox.address };
  });

  it("Stores the latest round in the mock cosumer", async () => {
    await inbox.connect(user).requestRandomness(1234, mockConsumer.address)

    const exec = await vrf.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);

    const calldata = res.callData[0];
    await deployer.sendTransaction({ to: calldata.to, data: calldata.data });

    expect(await mockConsumer.latestRound()).to.equal(1234)
    expect(await mockConsumer.beaconOf(mockConsumer.latestRound())).to.equal(123456789)
  });

  it("Doesn't exectue if no event was emitted")
});
