// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract MockVRFConsumer {
    uint256 public latestRandomness;
    address public dedicatedMsgSender;

    constructor(address _dedicatedMsgSender) {
        dedicatedMsgSender = _dedicatedMsgSender;
    }

    function fullfillRandomness(uint256 randomness, bytes calldata) external {
        latestRandomness = randomness;
    }
}
