// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

interface GelatoVRFConsumer {
  function onRandomnessAvailable(uint256 round, uint256[] calldata randomWords) external;
}
