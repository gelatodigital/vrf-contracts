// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {VRFCoordinatorV2Adapter} from "./VRFCoordinatorV2Adapter.sol";

contract VRFCoordinatorV2AdapterFactory {
    function make(
        address operator
    ) external returns (VRFCoordinatorV2Adapter adapter) {
        return new VRFCoordinatorV2Adapter(operator);
    }
}
