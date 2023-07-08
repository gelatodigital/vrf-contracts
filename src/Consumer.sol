// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

interface GelatoVRFConsumer {
  function onBeaconAvailable(uint256[] calldata beacon) external;
}
