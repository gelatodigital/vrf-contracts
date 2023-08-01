// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

abstract contract DrandHelpers0 {
        uint64 private immutable genesisTime;
        uint64 private immutable period;

	constructor(uint64 _genesisTime, uint64 _period) {
		genesisTime = _genesisTime;
		period = _period;
	}

	/** @dev compute the most recent drand round at time
ported from https://github.com/drand/drand-client/blob/master/lib/util.ts
	  */
    function roundAt(uint64 time) public view returns (uint64 round) {
        require(
            time > genesisTime,
            "Cannot request a round before the genesis time"
        );
        return (time - genesisTime) / period + 1;
    }

	/** @dev compute the time at which the Drand feed reaches round `round`.
 ported from https://github.com/drand/drand-client/blob/master/lib/util.ts
	  */
    function roundTime(
        uint64 round
    ) public view returns (uint64 time) {
        return genesisTime + (round - 1) * period;
    }
}

// solhint-disable not-rely-on-time
abstract contract DrandHelpers is DrandHelpers0 {

	constructor(uint64 _genesisTime, uint64 _period) DrandHelpers0(_genesisTime, _period) {
	}

    /** @dev ensure `round` is strictly in the future relative to the current block.
      @notice this relies on `block.timestamp`
      */
    function requireFutureRound(
        uint64 round
    ) public view {
        require(roundTime(round) > block.timestamp);
    }

    /** @dev return the most recent Drand round at the timestamp of the current block
      @notice this relies on `block.timestamp`
      */
    function currentRound() public view returns (uint64) {
	    return roundTime(uint64(block.timestamp));
    }
}
