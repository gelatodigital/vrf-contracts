// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract GelatoVRFOracle {
  mapping(uint256 => uint256) beaconOf;
  uint256 latestRound;

  function addBeacon(uint256 round, uint256 beacon) external {
    beaconOf[round] = beacon;
  }
}
