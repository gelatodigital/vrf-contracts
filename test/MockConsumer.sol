// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {GelatoVRFConsumer} from "src/Consumer.sol";
import "forge-std/Test.sol";

contract MockConsumer is GelatoVRFConsumer, Test {
  function onBeaconAvailable(uint256[] calldata beacon) external view {
    console.log(beacon[0]);
  }
}
