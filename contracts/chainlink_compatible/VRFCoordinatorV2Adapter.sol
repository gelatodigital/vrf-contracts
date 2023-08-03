// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {VRFCoordinatorV2Stub} from "./internal/VRFCoordinatorV2Stub.sol";
import {
    VRFConsumerBaseV2
} from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract VRFCoordinatorV2Adapter is VRFCoordinatorV2Stub {
    event RandomnessRequest(
        address indexed sender,
        uint32 numWords,
        uint256 requestId,
        VRFConsumerBaseV2 consumer
    );
    uint private _requestIdCounter = 1;

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

    // solhint-disable not-rely-on-time
    // In order to use Drand, users need to have pick a round number found in
    // the future and thus need to rely on a notion of time.
    function _requestRandomWords(
        uint16 minimumRequestConfirmations,
        uint32 numWords,
        VRFConsumerBaseV2 consumer
    ) private returns (uint256 requestId) {
        require(minimumRequestConfirmations != 0);
        requestId = _requestIdCounter++;
        emit RandomnessRequest(msg.sender, numWords, requestId, consumer);
        return requestId;
    }

    function fulfillRandomWords(
        uint32 numWords,
        uint256 requestId,
        uint256 randomness,
        VRFConsumerBaseV2 consumer
    ) external {
        require(msg.sender == _operator);
        bytes32 seed = keccak256(abi.encode(randomness, requestId));
        uint[] memory words = new uint[](numWords);
        for (uint32 i = 0; i < numWords; i++) {
            words[i] = uint(keccak256(abi.encode(seed, i)));
        }
        consumer.rawFulfillRandomWords(requestId, words);
    }
}
