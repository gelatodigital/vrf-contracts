import { expect } from "chai";
import hre from "hardhat";
import { RNGLibTestHarness } from "../typechain";
const { ethers, deployments } = hre;

describe("RNGLib", function () {
  // Contracts
  let harness: RNGLibTestHarness;

  const randomness =
    "0x2fa333280d897582a6ee5b6ef8fba2f047ae9b4503f2f50e5f1ab359690ea112";
  const randomness2 =
    "0x1fa333280d897582a6ee5b6ef8fba2f047ae9b4503f2f50e5f1ab359690ea112";

  before(async function () {
    await deployments.fixture();

    // Solidity contracts
    const factory = await ethers.getContractFactory("RNGLibTestHarness");
    harness = (await factory.deploy()) as RNGLibTestHarness;
  });

  it("returns distinct consecutive random numbers", async () => {
    const [r1, r2] = await harness.test1(randomness, "");
    expect(r1).to.not.equal(r2);
  });

  it("returns distinct random numbers from different seeds", async () => {
    const [r1] = await harness.test1(randomness, "");
    const [r2] = await harness.test1(randomness2, "");
    expect(r1).to.not.equal(r2);
  });

  it("returns distinct random numbers for different domains", async () => {
    const [r1] = await harness.test1(randomness, "domain1");
    const [r2] = await harness.test1(randomness, "domain2");
    expect(r1).to.not.equal(r2);
  });
});
