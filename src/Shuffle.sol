
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "src/RandomnessConsumerBase.sol";

struct ShuffleState {
	// i iterates from max to 0
	uint8 i;
	// available is set for all the numbers that have not yet been emitted
	uint256 set;
}

/** Provides a simple interface to manage a contract-internal PRNG and pull
 * random numbers from it.
 */
abstract contract WithShuffle is RandomnessConsumerBase {
	/** prepare to emit all non-negative numbers no greater than max in a random order.
	 */
	function startShuffle(uint8 max) internal returns (ShuffleState memory state) {
		require(max < 256);
		return ShuffleState(max, ~(~uint256(0) << max));
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
