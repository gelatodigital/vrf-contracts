// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

/// @title GelatoVRFConsumer
/// @dev Interface for consuming random number provided by Drand.
/// @notice This interface allows contracts to receive a random number provided by Gelato VRF.
interface GelatoVRFConsumer {
    /// @notice Callback function used by Gelato to return the random number.
    /// @dev The random number is fetched from one among many drand endpoints
    /// and passed back to this function like in a Gelato Web3 Function.
    /// @param randomness The random number generated by drand.
    /// @param data Additional data provided by Gelato VRF or the user, typically unused.
    function fulfillRandomness(
        uint256 randomness,
        bytes calldata data
    ) external;
}
