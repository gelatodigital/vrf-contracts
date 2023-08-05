import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  Contract,
  Wallet,
  utils,
  BigNumber,
  BigNumberish,
  Signer,
  PopulatedTransaction,
} from "ethers";
import assert from "assert";

const GELATO_DEDICATED_SENDER = process.env.GELATO_DEDICATED_SENDER;
assert.ok(GELATO_DEDICATED_SENDER, "env.GELATO_DEDICATED_SENDER must be specified");

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deployer } = await getNamedAccounts();
  const { deploy } = deployments;

  await deploy("MockVRFConsumer", {
    from: deployer,
    args: [GELATO_DEDICATED_SENDER],
    log: true,
    deterministicDeployment: true,
  });
};

deploy.tags = ["singleton", "main-suite"];
export default deploy;
