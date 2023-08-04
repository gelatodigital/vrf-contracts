// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract GelatoVRFInbox {
    event RequestedRandomness(
        address callback,
        address indexed sender,
        bytes data
    );

    function requestRandomness(
        address callback,
        bytes calldata data
    ) external {
        emit RequestedRandomness(callback, msg.sender, data);
    }
}
