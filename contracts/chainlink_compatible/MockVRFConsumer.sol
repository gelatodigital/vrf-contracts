// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {
    VRFCoordinatorV2Interface
} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFCoordinatorV2Adapter} from "./VRFCoordinatorV2Adapter.sol";
import {
    VRFConsumerBaseV2
} from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract MockVRFConsumer is VRFConsumerBaseV2 {
    VRFCoordinatorV2Adapter private immutable _coordinator;
    uint256 public requestId;
    mapping(uint256 => uint256[]) public randomWordsOf;

    constructor(address coordinator) VRFConsumerBaseV2(coordinator) {
        _coordinator = VRFCoordinatorV2Adapter(coordinator);
    }

    function requestRandomWords(uint32 numWords, uint16 confirmations) external {
        requestId = _coordinator.requestRandomWords("", 0, confirmations, 0, numWords);
    }

    function requestRandomWordsForConsumer(
        uint32 numWords,
        address consumer
    ) external {
        requestId = _coordinator.requestRandomWordsForConsumer(
            "",
            0,
            3,
            0,
            numWords,
            VRFConsumerBaseV2(consumer)
        );
    }

    // the function name must agree with VRFConsumerBaseV2
    // solhint-disable-next-line private-vars-leading-underscore
    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        randomWordsOf[_requestId] = _randomWords;
    }
}
