// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./Inbox.sol";
import "./Consumer.sol";

contract MockVRFConsumer is GelatoVRFConsumer {
    uint256 public latestRandomness;
    GelatoVRFInbox public inbox;
    address public dedicatedMsgSender;

    constructor(GelatoVRFInbox _inbox, address _dedicatedMsgSender) {
        inbox = _inbox;
        dedicatedMsgSender = _dedicatedMsgSender;
    }

    function requestRandomness() external {
        inbox.requestRandomness(this, "");
    }

    function fullfillRandomness(uint256 randomness, bytes calldata) external {
        latestRandomness = randomness;
    }
}
