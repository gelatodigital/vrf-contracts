// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import {Errors} from "./Errors.sol";

contract GelatoVRFOracle {
  mapping(uint256 => uint256) public beaconOf;
  uint256 public latestRound;

  mapping(address => bool) operators;

  event RequestBeacon(uint256 indexed round, address callbackReceiver) anonymous;
  event NewBeacon(uint256 indexed round, uint256 beacon);

  function addOperator(address _operator) external {
    operators[_operator] = true;
  }

  function removeOperator(address _operator) external {
    operators[_operator] = false;
  }

  function addBeacon(uint256 round, uint256 beacon) external {
    if (!operators[msg.sender]) revert Errors.NotOperator();

    beaconOf[round] = beacon;
    latestRound = round;

    emit NewBeacon(round, beacon);
  }

  function requestBeacon(uint256 round) external {
    emit RequestBeacon(round, address(0));
  }

  function requestBeaconCallback(uint256 round) external {
    emit RequestBeacon(round, msg.sender);
  }
}
