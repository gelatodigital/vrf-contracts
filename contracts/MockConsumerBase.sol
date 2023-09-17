// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {GelatoVRFConsumerBase} from "./ConsumerBase.sol";
import {GelatoVRFInbox} from "contracts/Inbox.sol";

contract MockVRFConsumerBase is GelatoVRFConsumerBase {
    bytes32 public latestRandomness;
    uint64 public latestRequestId;
    GelatoVRFInbox private immutable _inboxAddr;
    address private immutable _operatorAddr;

    constructor(GelatoVRFInbox inbox, address operator) {
        _inboxAddr = inbox;
        _operatorAddr = operator;
    }

    function _inbox() internal view override returns (GelatoVRFInbox) {
        return _inboxAddr;
    }

    function _operator() internal view override returns (address) {
        return _operatorAddr;
    }

    function requestRandomness(bytes memory data) external returns (uint64) {
        return _requestRandomness(data);
    }

    function _fulfillRandomness(
        bytes32 randomness,
        uint64 requestId,
        bytes memory
    ) internal override {
        latestRandomness = randomness;
        latestRequestId = requestId;
    }
}
