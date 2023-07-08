// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "src/Oracle.sol";
import "src/RandomNumberGenerator.sol";

/** Provides a simple interface to manage a contract-internal PRNG and pull
 * random numbers from it.
 */
abstract contract RandomnessConsumerBase is RandomNumberGenerator {
	/** seed the internal PRNG within the function using a VRF oracle.
	 */
	modifier withDrandSeed(GelatoVRFOracle oracle, uint roundNumber)  {
		_setSeed(keccak256(abi.encode(this,oracle.beaconOf(roundNumber))));
		_;
		_resetSeed();
	}
}
