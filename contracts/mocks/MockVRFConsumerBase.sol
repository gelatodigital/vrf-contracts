// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {GelatoVRFConsumerBase} from "../GelatoVRFConsumerBase.sol";

contract MockVRFConsumerBase is GelatoVRFConsumerBase {
    uint256 public latestRandomness;
    uint256 public latestRequestId;
    bytes public latestExtraData;
    address private immutable _operatorAddr;

    constructor(address operator) {
        _operatorAddr = operator;
    }

    function _operator() internal view override returns (address) {
        return _operatorAddr;
    }

    function _roundsToFulfill() internal pure override returns (uint256) {
        return 4;
    }

    function requestRandomness(bytes memory data) external returns (uint256) {
        return _requestRandomness(data);
    }

    function _fulfillRandomness(
        uint256 randomness,
        uint256 requestId,
        bytes memory extraData
    ) internal override {
        latestRandomness = randomness;
        latestRequestId = requestId;
        latestExtraData = extraData;
    }
}
