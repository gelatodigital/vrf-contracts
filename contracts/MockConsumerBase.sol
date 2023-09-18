// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {GelatoVRFConsumerBase} from "./ConsumerBase.sol";

contract MockVRFConsumerBase is GelatoVRFConsumerBase {
    bytes32 public latestRandomness;
    uint64 public latestRequestId;
    address private immutable _operatorAddr;

    constructor(address operator) {
        _operatorAddr = operator;
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
