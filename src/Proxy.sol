// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {Owned} from "solmate/auth/Owned.sol";

contract GelatoVRFProxy is Owned {
  address public implementation;

  event ImplementationChanged(address oldImplementation, address newImplementation);

  constructor(address initialImplementation, address proxyOwner) Owned(proxyOwner) {
    implementation = initialImplementation;
  }

  function setImplementation(address _implementation) external {
    emit ImplementationChanged(implementation, _implementation);
    implementation = _implementation;
  }
}
