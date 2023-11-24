// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {RNGLib} from "./RNGLib.sol";

contract RNGLibTestHarness {
    function test1(
        uint256 randomness,
        string calldata domain
    ) external view returns (uint256 r1, uint256 r2) {
        RNGLib.RNGState memory rng = RNGLib.makeRNG(randomness, domain);
        r1 = RNGLib.randomUint256(rng);
        r2 = RNGLib.randomUint256(rng);
    }
}
