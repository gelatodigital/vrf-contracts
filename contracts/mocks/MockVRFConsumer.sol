// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {IGelatoVRFConsumer} from "../IGelatoVRFConsumer.sol";

contract MockVRFConsumer is IGelatoVRFConsumer {
    uint256 public latestRandomness;
    address public dedicatedMsgSender;

    constructor(address _dedicatedMsgSender) {
        dedicatedMsgSender = _dedicatedMsgSender;
    }

    function requestRandomness() external {
        emit RequestedRandomness("");
    }

    function fulfillRandomness(uint256 randomness, bytes calldata) external {
        require(msg.sender == dedicatedMsgSender, "Only Gelato");
        latestRandomness = randomness;
    }
}
