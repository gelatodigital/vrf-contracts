// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract GelatoVRFInbox {
    event RequestedRandomness(
        address callback,
        address indexed sender,
        bytes extraData
    );

    function requestRandomness(
        address callback,
        bytes calldata extraData
    ) external {
        emit RequestedRandomness(callback, msg.sender, extraData);
    }
}
