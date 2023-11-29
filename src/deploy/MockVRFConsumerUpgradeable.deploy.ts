import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments } = hre;
  const { deploy } = deployments;

  const [deployer, , dedicatedMsgSender] = await hre.ethers.getSigners();

  await deploy("MockVRFConsumerUpgradeable", {
    from: deployer.address,
    args: [dedicatedMsgSender.address],
    log: true,
    proxy: { owner: deployer.address },
  });
};

deploy.skip = async (hre: HardhatRuntimeEnvironment) => {
  const shouldSkip = hre.network.name !== "hardhat";
  return shouldSkip;
};

deploy.tags = ["MockVRFConsumerUpgradeable"];
export default deploy;
