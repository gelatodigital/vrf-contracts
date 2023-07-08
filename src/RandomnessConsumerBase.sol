// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "src/Oracle.sol";

struct ShuffleState {
	// i iterates from max to 0
	uint8 i;
	// available is set for all the numbers that have not yet been emitted
	uint256 set;
}

/** Provides a simple interface to manage a contract-internal PRNG and pull
 * random numbers from it.
*/
abstract contract RandomnessConsumerBase {
	uint256 private s_seed = 1;
	uint256 private s_randCounter = 1;

	/** seed the internal PRNG with an arbitrary seed.
	 */
	function _setSeed(bytes32 seed) private {
		s_seed = uint256(seed);
		// optimisation: nonzero costs less gas to store
		s_randCounter = 1;
	}
	/** reset the internal PRNG to an unusable state.
	 */
	function _resetSeed() private {
		s_seed = 1;
	}

	/** seed the internal PRNG within the function.
	  */
	modifier withSeed(bytes32 seed) {
		_setSeed(seed);
		_;
		_resetSeed();
	}

	/** seed the internal PRNG within the function using a VRF oracle.
	  */
	modifier withDrandSeed(GelatoVRFOracle oracle, uint roundNumber)  {
		_setSeed(keccak256(abi.encode(this,oracle.beaconOf(roundNumber))));
		_;
		_resetSeed();
	}

	/** ensure the internal PRNG is seeded.
	  */
	function checkSeeded() view internal {
		require(s_seed > 1);
	}

	/** return a distinct, uniformly ditributed 256-bit number, and advance the internal PRNG.
	  * reverts if the PRNG is not seeded.
	  */
	function randomUint256() internal returns (uint256) {
		checkSeeded();
		return unsafeRandomUint256();
	}

	/** return a distinct, uniformly ditributed number less than max, and advance the internal PRNG.
	  * reverts if the PRNG is not seeded.
	  */
	function randomUint224(uint224 max) internal returns (uint224) {
		checkSeeded();
		return unsafeRandomUint224(max);
	}

	/** return a distinct, uniformly ditributed number, and advance the internal PRNG.
	 * Pre-condition: caller must ensure the internal PRNG is seeded
	  */
	function unsafeRandomUint256() internal returns (uint256 random) {
		random = uint256(keccak256(abi.encode(s_seed, s_randCounter)));
		unchecked { // It's not possible to call random enough times
			s_randCounter++;
		}
	}

	/** return a distinct, uniformly ditributed number less than limit, and advance the internal PRNG.
	 * Pre-condition: caller must ensure the internal PRNG is seeded
	  */
	function unsafeRandomUint224(uint224 limit) internal returns (uint224) {
		return uint224(unsafeRandomUint256()) % limit;
	}

	/** prepare to emit all non-negative numbers no greater than max in a random order.
	  */
	function startShuffle(uint8 max) internal returns (ShuffleState memory state) {
		require(max < 256);
		return ShuffleState(max, ~(uint256(-1) << max));
	}
	/** emit a number that was not yet emitted by this shuffle.
	  */
	function shuffle(ShuffleState memory state) internal returns (uint8 k) {
		k = uint8(randomUint224(uint224(state.i)+1));
		for(uint8 j = 0; j < k; j++) {
			while (state.set & (1 << j) == 0) {
			j++;
			k++;
			}
		}
		state.set &= ~(1 << k);
		state.i--;
	}
}