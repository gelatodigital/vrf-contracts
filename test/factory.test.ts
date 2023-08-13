import hre from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { VRFCoordinatorV2AdapterFactory } from "../typechain";
import { expect } from "chai";
import { HardhatEthersHelpers } from "@nomiclabs/hardhat-ethers/types";
const { deployments, ethers } = hre;

const ADAPTER_ABI = ["function operator() view returns (address)"]

describe("Adapter Factory Test Suite", function () {
  let provider = ethers.provider;

  // Signers
  let deployer: SignerWithAddress;
  let operator: SignerWithAddress;

  // Factories
  let adapterFactoryFactory: ContractFactory;

  // Contracts
  let adapterFactory: VRFCoordinatorV2AdapterFactory;

  before(async function () {
    await deployments.fixture();
    [deployer, operator] = await ethers.getSigners();

    adapterFactoryFactory = await ethers.getContractFactory(
      "VRFCoordinatorV2AdapterFactory"
    );
  });

  beforeEach(async function () {
    adapterFactory = (await adapterFactoryFactory
      .connect(deployer)
      .deploy()) as VRFCoordinatorV2AdapterFactory;
  });

  it("Deploys a new adapter", async function() {
    adapterFactory.on("AdapterCreated", (creator, adapterAddress, _) => {
      console.log("Adapter created by:", creator);
      console.log("Adapter address:", adapterAddress);
    })

    const deploymentTx = await adapterFactory.make(operator.address)
    const deployment = await deploymentTx.wait()
    const [sender, adapterAddress] = deployment.events?.flatMap(e => e.args) as string[]
    const adapter = new Contract(adapterAddress, ADAPTER_ABI, provider);
    expect(operator.address).to.eq(await adapter.operator())
    expect(sender).to.eq(deployer.address)
  }) 
});
