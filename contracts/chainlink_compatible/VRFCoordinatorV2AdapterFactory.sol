// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {VRFCoordinatorV2Adapter} from "./VRFCoordinatorV2Adapter.sol";

contract VRFCoordinatorV2AdapterFactory {
    event AdapterCreated(address indexed creator, address adapter);

    function make(
        address operator
    ) external returns (VRFCoordinatorV2Adapter adapter) {
        adapter = new VRFCoordinatorV2Adapter(operator);
        emit AdapterCreated(msg.sender, address(adapter));
    }
}
