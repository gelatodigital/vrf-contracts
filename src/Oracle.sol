// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {Errors} from "./Errors.sol";
import {Ownable} from "openzeppelin/access/Ownable.sol";

contract GelatoVRFOracle is Ownable {
  mapping(uint256 => uint256) public beaconOf;
  uint256 public latestRound;

  mapping(address => bool) operators;
  address admin;

  event RequestBeacon(uint256 indexed round, address callbackReceiver) anonymous;
  event NewBeacon(uint256 indexed round, uint256 beacon);

  function addOperator(address _operator) external onlyOwner {
    if (msg.sender != admin) revert Errors.NotAdmin();
    operators[_operator] = true;
  }

  function removeOperator(address _operator) external onlyOwner {
    if (msg.sender != admin) revert Errors.NotAdmin();
    operators[_operator] = false;
  }

  function addBeacon(uint256 round, uint256 beacon) external {
    if (!operators[msg.sender]) revert Errors.NotOperator();

    beaconOf[round] = beacon;
    latestRound = round;

    emit NewBeacon(round, beacon);
  }

  function getBeacon(uint256 round) external view returns (uint256) {
    return beaconOf[round];
  }

  function requestBeacon(uint256 round) external {
    emit RequestBeacon(round, address(0));
  }

  function requestBeaconCallback(uint256 round) external {
    emit RequestBeacon(round, msg.sender);
  }
}
