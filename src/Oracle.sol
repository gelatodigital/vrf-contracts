// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {Errors} from "./Errors.sol";

contract GelatoVRFOracle {
  mapping(uint256 => uint256) beaconOf;
  uint256 latestRound;
  address operator;

  constructor(address _operator) {
    operator = _operator;
  }

  function addBeacon(uint256 round, uint256 beacon) external {
    if (msg.sender != operator) revert Errors.NotOperator();
    beaconOf[round] = beacon;
  }
}
