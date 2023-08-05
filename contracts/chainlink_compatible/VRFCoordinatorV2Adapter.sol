// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {VRFCoordinatorV2Stub} from "./internal/VRFCoordinatorV2Stub.sol";
import {GelatoVRFConsumer} from "contracts/Consumer.sol";
import {
    VRFConsumerBaseV2
} from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract VRFCoordinatorV2Adapter is VRFCoordinatorV2Stub, GelatoVRFConsumer {
    event RequestedRandomness(
        GelatoVRFConsumer callback,
        address indexed sender,
        bytes data
    );
    uint256 private _requestIdCounter = 1;

    address private immutable _operator;

    constructor(address operator) {
        _operator = operator;
    }

    function requestRandomWords(
        bytes32 /*keyHash*/,
        uint64 /*subId*/,
        uint16 minimumRequestConfirmations,
        uint32 /*callbackGasLimit*/,
        uint32 numWords
    ) external override returns (uint256 requestId) {
        return
            _requestRandomWords(
                minimumRequestConfirmations,
                numWords,
                VRFConsumerBaseV2(msg.sender)
            );
    }

    function requestRandomWordsForConsumer(
        bytes32 /*keyHash*/,
        uint64 /*subId*/,
        uint16 minimumRequestConfirmations,
        uint32 /*callbackGasLimit*/,
        uint32 numWords,
        VRFConsumerBaseV2 consumer
    ) external returns (uint256 requestId) {
        return
            _requestRandomWords(
                minimumRequestConfirmations,
                numWords,
                consumer
            );
    }

    function _requestRandomWords(
        uint16 minimumRequestConfirmations,
        uint32 numWords,
        VRFConsumerBaseV2 consumer
    ) private returns (uint256 requestId) {
        require(minimumRequestConfirmations != 0);
        requestId = _requestIdCounter++;
        emit RequestedRandomness(
            this,
            msg.sender,
            abi.encode(numWords, requestId, consumer)
        );
        return requestId;
    }

    function fullfillRandomness(
        uint256 randomness,
        bytes calldata data
    ) external {
        require(msg.sender == _operator);
        (uint32 numWords, uint256 requestId, VRFConsumerBaseV2 consumer) = abi
            .decode(data, (uint32, uint256, VRFConsumerBaseV2));
        bytes32 seed = keccak256(abi.encode(randomness, requestId));
        uint[] memory words = new uint[](numWords);
        for (uint32 i = 0; i < numWords; i++) {
            words[i] = uint(keccak256(abi.encode(seed, i)));
        }
        consumer.rawFulfillRandomWords(requestId, words);
    }
}
