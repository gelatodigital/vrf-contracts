// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract MockVRFConsumer {
    uint256 public latestRandomness;

    function fullfillRandomness(uint256 _randomness) external {
        latestRandomness = _randomness;
    }
}
