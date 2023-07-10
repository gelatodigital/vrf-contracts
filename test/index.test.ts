import hre from "hardhat";
import { expect } from "chai";
import { before } from "mocha";
import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
const { deployments, w3f } = hre;

describe("VRF Tests", function () {
  this.timeout(0);

  let vrf: Web3FunctionHardhat;

  before(async function () {
    await deployments.fixture();

    vrf = w3f.get("vrf");
  });

  it("Return canExec: true", async () => {
    const { result } = await vrf.run();

    expect(result.canExec).to.equal(false);
  });
});
