// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "forge-std/Script.sol";
import {GelatoVRFOracle} from "src/Oracle.sol";
import {GelatoVRFProxy} from "src/Proxy.sol";

contract DeployMock is Script {
  function run() public {
    // vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
    vm.startBroadcast(vm.envUint("ANVIL_KEY"));
    // GelatoVRFOracle vrf = new GelatoVRFOracle();
    // GelatoVRFProxy proxy = new GelatoVRFProxy(address(vrf));
    // proxy.setImplementation();
    // vrf.requestBeacon();

    vm.stopBroadcast();
  }
}