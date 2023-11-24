// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {VRFCoordinatorV2Adapter} from "./VRFCoordinatorV2Adapter.sol";

/// @title VRFCoordinatorV2AdapterFactory
/// @dev Factory contract for creating instances of VRFCoordinatorV2Adapter.
contract VRFCoordinatorV2AdapterFactory {
    /// @notice Event emitted when a new VRFCoordinatorV2Adapter is created.
    /// @param creator The address that created the adapter.
    /// @param adapter The address of the created adapter.
    event AdapterCreated(address indexed creator, address adapter);

    /// Mapping to keep track of which deployer created which adapter.
    mapping(address => address) public adapterRegistry;

    /// @notice Create a new instance of VRFCoordinatorV2Adapter.
    /// @dev Creates a new VRFCoordinatorV2Adapter contract with the provided operator address.
    /// @param operator The address of the operator that will interact with the adapter.
    /// @param requesters The addresses that are able to request for randomness.
    /// @return adapter The newly created VRFCoordinatorV2Adapter instance.
    function make(
        address operator,
        address[] memory requesters
    ) external returns (VRFCoordinatorV2Adapter adapter) {
        if (adapterRegistry[msg.sender] != address(0))
            return VRFCoordinatorV2Adapter(adapterRegistry[msg.sender]);
        adapter = new VRFCoordinatorV2Adapter(msg.sender, operator, requesters);
        adapterRegistry[msg.sender] = address(adapter);
        emit AdapterCreated(msg.sender, address(adapter));
    }
}
