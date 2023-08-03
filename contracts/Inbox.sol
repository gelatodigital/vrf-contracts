// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract GelatoVRFInbox {
    event RequestedRandomness(address callback, address indexed sender);

    function requestRandomness(address callback) external {
        emit RequestedRandomness(callback, msg.sender);
    }
}
