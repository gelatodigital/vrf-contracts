// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {IGelatoVRFConsumer} from "contracts/IGelatoVRFConsumer.sol";

/// @title GelatoVRFConsumerBase
/// @dev This contract handles domain separation between consecutive randomness requests
/// The contract has to be implemented by contracts willing to use the gelato VRF system.
/// This base contract enhances the GelatoVRFConsumer by introducing request IDs and
/// ensuring unique random values.
/// for different request IDs by hashing them with the random number provided by drand.
/// For security considerations, refer to the Gelato documentation.
abstract contract GelatoVRFConsumerBase is IGelatoVRFConsumer {
    bool[] public requestPending;
    mapping(uint256 requestId => bytes32 requestHash) public requestedHash;

    /// @notice Returns the address of the dedicated msg.sender.
    /// @dev The operator can be found on the Gelato dashboard after a VRF is deployed.
    /// @return Address of the operator.
    function _operator() internal view virtual returns (address);

    /// @notice Requests randomness from the Gelato VRF.
    /// @dev The extraData parameter allows for additional data to be passed to
    /// the VRF, which is then forwarded to the callback. This is useful for
    /// request tracking purposes if requestId is not enough.
    /// @param extraData Additional data for the randomness request.
    /// @return requestId The ID for the randomness request.
    function _requestRandomness(
        bytes memory extraData
    ) internal returns (uint256 requestId) {
        requestId = uint256(requestPending.length);
        requestPending.push();
        requestPending[requestId] = true;

        bytes memory data = abi.encode(requestId, extraData);
        // solhint-disable-next-line not-rely-on-time
        bytes memory dataWithTimestamp = abi.encode(data, block.timestamp);
        bytes32 requestHash = keccak256(dataWithTimestamp);

        requestedHash[requestId] = requestHash;

        emit RequestedRandomness(data);
    }

    /// @notice User logic to handle the random value received.
    /// @param randomness The random number generated by Gelato VRF.
    /// @param requestId The ID for the randomness request.
    /// @param extraData Additional data from the randomness request.
    function _fulfillRandomness(
        uint256 randomness,
        uint256 requestId,
        bytes memory extraData
    ) internal virtual;

    /// @notice Callback function used by Gelato VRF to return the random number.
    /// The randomness is derived by hashing the provided randomness with the request ID.
    /// @param randomness The random number generated by Gelato VRF.
    /// @param dataWithTimestamp Additional data provided by Gelato VRF containing request details.
    function fulfillRandomness(
        uint256 randomness,
        bytes calldata dataWithTimestamp
    ) external {
        require(msg.sender == _operator(), "only operator");

        (bytes memory data, ) = abi.decode(dataWithTimestamp, (bytes, uint256));
        (uint256 requestId, bytes memory extraData) = abi.decode(
            data,
            (uint256, bytes)
        );

        bytes32 requestHash = keccak256(dataWithTimestamp);
        bool isValidRequestHash = requestHash == requestedHash[requestId];

        if (requestPending[requestId] && isValidRequestHash) {
            randomness = uint(
                keccak256(
                    abi.encode(
                        randomness,
                        address(this),
                        block.chainid,
                        requestId
                    )
                )
            );

            _fulfillRandomness(randomness, requestId, extraData);
            requestPending[requestId] = false;
        }
    }
}
