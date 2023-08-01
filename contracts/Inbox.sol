// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./Consumer.sol";
import "./internal/DrandHelpers.sol";

contract GelatoVRFInbox is DrandHelpers {
    event RequestedRandomness(
        uint64 round,
        GelatoVRFConsumer callback,
        address indexed sender
    );

    constructor(uint64 _genesisTime, uint64 _period) DrandHelpers(_genesisTime, _period) {
    }

    function requestRandomness(
        uint64 round,
        GelatoVRFConsumer callback
    ) external {
        emit RequestedRandomness(round, callback, msg.sender);
    }
}
