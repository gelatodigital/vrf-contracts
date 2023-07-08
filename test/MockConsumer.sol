// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {GelatoVRFConsumer} from "src/Consumer.sol";
import "forge-std/Test.sol";

contract MockConsumer is GelatoVRFConsumer, Test {
  function onRandomnessAvailable(uint256, /* round */ uint256[] calldata randomWords) external view {
    console.log("round %d, random: %d ", randomWords[0]);
  }
}
