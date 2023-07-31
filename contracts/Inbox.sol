// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./Consumer.sol";

contract GelatoVRFInbox {
    event RequestedRandomness(
        uint256 round,
        GelatoVRFConsumer callback,
        address indexed sender
    );

    function requestRandomness(
        uint256 round,
        GelatoVRFConsumer callback
    ) external {
        emit RequestedRandomness(round, callback, msg.sender);
    }
}
