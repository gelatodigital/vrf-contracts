// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {GelatoVRFConsumerBase} from "./ConsumerBase.sol";
import {GelatoVRFInbox} from "contracts/Inbox.sol";

contract MockVRFConsumerBase is GelatoVRFConsumerBase {
    bytes32 public latestRandomness;
    uint64 public latestRequestId;
    GelatoVRFInbox private immutable __inbox;
    address private immutable __operator;

    constructor(GelatoVRFInbox inbox, address operator) {
        __inbox = inbox;
        __operator = operator;
    }

    function _inbox() internal view override returns (GelatoVRFInbox) {
        return __inbox;
    }

    function _operator() internal view override returns (address) {
        return __operator;
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
