// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./Consumer.sol";

contract GelatoVRFInbox {
    event RequestedRandomness(
        GelatoVRFConsumer callback,
        address indexed sender,
        bytes data
    );

    function requestRandomness(GelatoVRFConsumer callback, bytes calldata data) external {
        emit RequestedRandomness(callback, msg.sender, data);
    }
}
