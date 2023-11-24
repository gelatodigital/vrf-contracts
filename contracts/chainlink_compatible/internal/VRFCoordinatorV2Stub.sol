// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    VRFCoordinatorV2Interface
} from "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";

/** @dev Partial implementation of `VRFCoordinatorV2Interface` with no-ops and dummy values for the methods GelatoVRF does not need.
 */
abstract contract VRFCoordinatorV2Stub is VRFCoordinatorV2Interface {
    bytes32 private constant _dummyKeyHash = "Gelato VRF";

    /**
     * @notice Simulate Chainlink configuration parameters
     * @return minimumRequestConfirmations global min for request confirmations
     * @return maxGasLimit global max for request gas limit
     * @return provingKeyHashes list containing the dummy key hash
     */
    function getRequestConfig()
        external
        pure
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
    ) external pure override {
        return;
    }

    function addConsumer(
        uint64 /*subId*/,
        address /*consumer*/
    ) external pure override {
        return;
    }

    function cancelSubscription(
        uint64 /*subId*/,
        address /*to*/
    ) external pure override {
        return;
    }

    function createSubscription()
        external
        pure
        override
        returns (uint64 subId)
    {
        subId = 1;
    }

    function getSubscription(
        uint64 /*subId*/
    )
        external
        pure
        override
        returns (
            uint96 balance,
            uint64 reqCount,
            address owner,
            address[] memory consumers
        )
    {
        balance = type(uint96).max - 1;
        reqCount = 1;
        owner = address(0);
        consumers = new address[](0);
    }

    function pendingRequestExists(
        uint64 /*subId*/
    ) external pure override returns (bool) {
        return true;
    }

    function removeConsumer(
        uint64 /*subId*/,
        address /*consumer*/
    ) external pure override {
        return;
    }

    function requestSubscriptionOwnerTransfer(
        uint64 /*subId*/,
        address /*newOwner*/
    ) external pure override {
        return;
    }
}
