// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

interface GelatoVRFConsumer {
    function fullfillRandomness(uint256 round, uint256 randomness) external;
}
