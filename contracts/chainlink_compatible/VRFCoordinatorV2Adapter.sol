// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {VRFCoordinatorV2Stub} from "./internal/VRFCoordinatorV2Stub.sol";
import {GelatoVRFConsumerBase} from "contracts/GelatoVRFConsumerBase.sol";
import {
    VRFConsumerBaseV2
} from "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

/// @title VRFCoordinatorV2Adapter
/// @dev This contract acts as an adapter between Gelato and Chainlink VRF.
/// It allows Gelato to make VRF randomness requests using Chainlink's VRF Coordinator V2 contract.
contract VRFCoordinatorV2Adapter is
    VRFCoordinatorV2Stub,
    GelatoVRFConsumerBase
{
    /// @dev Emitted when msg.sender is not deployer.
    error OnlyDeployer();
    /// @dev Emitted when msg.sender is not authorized requester.
    error UnauthorizedRequester();
    /// @dev Emitted when an attempt is made to request randomness with zero minimum confirmations.
    error ZeroConfirmationsRequested();

    /// @notice Event emitted when the permissions for requesters are updated.
    /// @param requesters Array of addresses whose permissions for request creation were updated.
    /// @param canRequest New permission state; true allows, false disallows request creation.
    event RequesterPermissionsUpdated(address[] requesters, bool canRequest);

    address private immutable _deployer;
    address private immutable _operatorAddr;

    mapping(address => bool) public canRequest;

    modifier onlyDeployer() {
        if (msg.sender != _deployer) {
            revert OnlyDeployer();
        }
        _;
    }

    modifier onlyAuthorizedRequester() {
        if (!canRequest[msg.sender]) {
            revert UnauthorizedRequester();
        }
        _;
    }

    constructor(
        address deployer,
        address operator,
        address[] memory requesters
    ) {
        _deployer = deployer;
        _operatorAddr = operator;
        _updateRequesterPermissions(requesters, true);
    }

    function _operator() internal view override returns (address) {
        return _operatorAddr;
    }

    /// @notice Request VRF randomness using Chainlink's VRF Coordinator V2.
    /// @param minimumRequestConfirmations Minimum confirmations required for the request.
    /// @param numWords Number of random words to generate.
    /// @return requestId The unique identifier for the request.
    function requestRandomWords(
        bytes32 /*keyHash*/,
        uint64 /*subId*/,
        uint16 minimumRequestConfirmations,
        uint32 /*callbackGasLimit*/,
        uint32 numWords
    ) external override onlyAuthorizedRequester returns (uint256 requestId) {
        return
            _requestRandomWords(
                minimumRequestConfirmations,
                numWords,
                VRFConsumerBaseV2(msg.sender)
            );
    }

    /// @notice Request VRF randomness for a specific consumer.
    /// @param minimumRequestConfirmations Minimum confirmations required for the request.
    /// @param numWords Number of random words to generate.
    /// @param consumer The VRFConsumerBaseV2 contract to receive the randomness callback.
    /// @return requestId The unique identifier for the request.
    function requestRandomWordsForConsumer(
        bytes32 /*keyHash*/,
        uint64 /*subId*/,
        uint16 minimumRequestConfirmations,
        uint32 /*callbackGasLimit*/,
        uint32 numWords,
        VRFConsumerBaseV2 consumer
    ) external onlyAuthorizedRequester returns (uint256 requestId) {
        return
            _requestRandomWords(
                minimumRequestConfirmations,
                numWords,
                consumer
            );
    }

    /// @notice External function to add or remove addresses that can create requests.
    /// @param requesters Array of addresses whose permissions for request creation will be updated.
    /// @param newCanRequest True to allow, false to disallow request creation for the addresses.
    function updateRequesterPermissions(
        address[] memory requesters,
        bool newCanRequest
    ) external onlyDeployer {
        _updateRequesterPermissions(requesters, newCanRequest);
    }

    /// @notice Internal function to request VRF randomness and emit the request event.
    /// @dev This function is used to handle randomness requests and emit the appropriate event.
    /// @param minimumRequestConfirmations Minimum confirmations required for the request.
    /// @param numWords Number of random words to generate.
    /// @param consumer The VRFConsumerBaseV2 contract to receive the randomness callback.
    /// @return requestId The unique identifier for the request.
    function _requestRandomWords(
        uint16 minimumRequestConfirmations,
        uint32 numWords,
        VRFConsumerBaseV2 consumer
    ) private returns (uint256 requestId) {
        // Ensure minimum request confirmations is not zero
        if (minimumRequestConfirmations == 0) {
            revert ZeroConfirmationsRequested();
        }

        // Increment the requestId counter and emit the randomness request event
        return _requestRandomness(abi.encode(numWords, consumer));
    }

    /// @notice Callback function used by Gelato VRF to return the random number.
    /// @param randomness The random number generated by Gelato VRF.
    /// @param data Additional data provided by Gelato VRF, typically containing request details.
    function _fulfillRandomness(
        uint256 randomness,
        uint256 requestId,
        bytes memory data
    ) internal override {
        (uint32 numWords, VRFConsumerBaseV2 consumer) = abi.decode(
            data,
            (uint32, VRFConsumerBaseV2)
        );
        uint[] memory words = new uint[](numWords);
        for (uint32 i = 0; i < numWords; i++) {
            words[i] = uint(keccak256(abi.encode(randomness, i)));
        }

        // solhint-disable-next-line no-empty-blocks
        try consumer.rawFulfillRandomWords(requestId, words) {} catch {}
    }

    /// @notice Internal function to add or remove addresses that can create requests.
    /// @param requesters Array of addresses whose permissions for request creation will be updated.
    /// @param newCanRequest True to allow, false to disallow request creation for the addresses.
    function _updateRequesterPermissions(
        address[] memory requesters,
        bool newCanRequest
    ) private {
        if (requesters.length > 0) {
            for (uint256 i; i < requesters.length; i++) {
                canRequest[requesters[i]] = newCanRequest;
            }

            emit RequesterPermissionsUpdated(requesters, newCanRequest);
        }
    }
}
