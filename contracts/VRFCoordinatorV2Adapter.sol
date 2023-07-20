// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {
    VRFCoordinatorV2Interface
} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import {
    VRFConsumerBaseV2
} from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract VRFCoordinatorV2Adapter is VRFCoordinatorV2Interface {
    event RandomnessRequest(
        address indexed sender,
        uint32 numWords,
        uint256 requestId,
        uint64 roundNumber,
        VRFConsumerBaseV2 consumer
    );
    uint private _requestIdCounter = 1;

    bytes32 private immutable _dummyKeyHash = "Gelato VRF";
    // This is the genesis time of Drand's fastnet.
    uint public immutable genesisTime = 1677685200;
    // This is the period of Drand's fastnet.
    uint public immutable period = 3 seconds;
    // as an upper-bound for block time, we assume 12 seconds.
    // This is true on Mainnet, albeit excessive on fast chains.
    uint public immutable blockTime = 12 seconds;

    address private immutable _operator;

    constructor(address operator) {
        _operator = operator;
    }

    /**
     * @notice Simulate Chainlink configuration parameters
     * @return minimumRequestConfirmations global min for request confirmations
     * @return maxGasLimit global max for request gas limit
     * @return provingKeyHashes list containing the dummy key hash
     */
    function getRequestConfig()
        external
        view
        returns (
            uint16 minimumRequestConfirmations,
            uint32 maxGasLimit,
            bytes32[] memory provingKeyHashes
        )
    {
        minimumRequestConfirmations = 1;
        maxGasLimit = type(uint32).max - 1;
        provingKeyHashes = new bytes32[](1);
        provingKeyHashes[0] = _dummyKeyHash;
    }

    function acceptSubscriptionOwnerTransfer(
        uint64 /*subId*/
    ) external override {
        return;
    }

    function addConsumer(
        uint64 /*subId*/,
        address /*consumer*/
    ) external override {
        return;
    }

    function cancelSubscription(
        uint64 /*subId*/,
        address /*to*/
    ) external override {
        return;
    }

    function createSubscription() external override returns (uint64 subId) {
        subId = 1;
    }

    function getSubscription(
        uint64 /*subId*/
    )
        external
        view
        override
        returns (
            uint96 balance,
            uint64 reqCount,
            address owner,
            address[] memory /*consumers*/
        )
    {
        balance = type(uint96).max - 1;
        reqCount = 1;
        owner = msg.sender;
    }

    function pendingRequestExists(
        uint64 /*subId*/
    ) external view override returns (bool) {
        return true;
    }

    function removeConsumer(
        uint64 /*subId*/,
        address /*consumer*/
    ) external override {
        return;
    }

    function requestSubscriptionOwnerTransfer(
        uint64 /*subId*/,
        address /*newOwner*/
    ) external override {
        return;
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
        uint roundNumber = (block.timestamp +
            minimumRequestConfirmations *
            blockTime -
            genesisTime) /
            period +
            1;
        requestId = _requestIdCounter++;
        emit RandomnessRequest(
            msg.sender,
            numWords,
            requestId,
            uint64(roundNumber),
            consumer
        );
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
