// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.20;

import {Ownable} from "openzeppelin/access/Ownable.sol";

contract GelatoVRFProxy is Ownable {
  address public implementation;

  event ImplementationChanged(address oldImplementation, address newImplementation);

  constructor(address initialImplementation) {
    implementation = initialImplementation;
  }

  function setImplementation(address _implementation) external {
    emit ImplementationChanged(implementation, _implementation);
    implementation = _implementation;
  }
}
