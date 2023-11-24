// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    VRFCoordinatorV2Interface
} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import {
    VRFConsumerBaseV2
} from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract MockCLVRFConsumer is VRFConsumerBaseV2 {
    VRFCoordinatorV2Interface private immutable _coordinator;
    uint256 public requestId;
    mapping(uint256 => uint256[]) public randomWordsOf;

    constructor(address coordinator) VRFConsumerBaseV2(coordinator) {
        _coordinator = VRFCoordinatorV2Interface(coordinator);
    }

    function requestRandomWords(uint32 numWords) external {
        requestId = _coordinator.requestRandomWords("", 0, 3, 0, numWords);
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
