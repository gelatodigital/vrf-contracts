// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.18;

contract MockVRFConsumer {
  mapping(uint256 => uint256) public beaconOf;
  uint256 public latestRound;

  function fullfillRandomness(uint256 _round, uint256 _randomness) external {
    beaconOf[_round] = _randomness;
    latestRound = _round;
  }
}
