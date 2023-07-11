import hre from "hardhat";
import path from "path";
import { expect } from "chai";
import { before } from "mocha";
import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { Web3FunctionLoader } from "@gelatonetwork/web3-functions-sdk/loader";
import { ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { GelatoVRFInbox, MockVRFConsumer } from "../typechain";
import { Web3FunctionUserArgs } from "@gelatonetwork/automate-sdk";
const { deployments, w3f, ethers } = hre;

const w3fName = "vrf";
const w3fRootDir = path.join("web3-functions");
const w3fPath = path.join(w3fRootDir, w3fName, "index.ts");

describe("VRF Tests", function () {
  this.timeout(0)

  // Signers
  let deployer: SignerWithAddress
  let user: SignerWithAddress

  // Web 3 Functions 
  let vrf: Web3FunctionHardhat
  let userArgs: Web3FunctionUserArgs;

  // Factories
  let inboxFactory: ContractFactory 
  let mockConsumerFactory: ContractFactory 

  // Contracts
  let inbox: GelatoVRFInbox
  let mockConsumer: MockVRFConsumer

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
    mockConsumer = (await mockConsumerFactory.connect(deployer).deploy()) as MockVRFConsumer;
    userArgs = {inbox: inbox.address}
  })

  it("Return canExec: true", async () => {
    const randomness = await inbox.connect(user).requestRandomness(1234, mockConsumer.address)
    // console.log("randmoness received: ", randomness)
    const { result } = await vrf.run({userArgs})
    console.log(await mockConsumer.latestRound())
    console.log("vrf result: ", result)
  });
});
