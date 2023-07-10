// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import "forge-std/Script.sol";
import {GelatoVRFOracle} from "contracts/Oracle.sol";
import {GelatoVRFProxy} from "contracts/Proxy.sol";

contract DeployMock is Script {
  function run() public {
    vm.startBroadcast(vm.envUint("ANVIL_KEY"));
    GelatoVRFOracle vrf = new GelatoVRFOracle();
    new GelatoVRFProxy(address(vrf));
    vrf.requestBeacon(1234);

    vm.stopBroadcast();
  }
}
