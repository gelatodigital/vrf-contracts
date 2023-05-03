// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

/** RNGLib rovides a simple interface to manage a contract-internal PRNG and
 * pull random numbers from it.
 */
library RNGLib {
    struct RNGState {
        bytes32 seed;
        uint256 counter;
    }

    /** seed a new RNG based on a value from a public randomness beacon.
     * @notice in order to ensure domain separation, at least one of
     * randomness, chain id, current contract address, or the domain string
     * must be different between two different RNGs.
     */
    function makeRNG(
        uint256 randomness,
        string memory domain
    ) internal view returns (RNGState memory st) {
        st.seed = keccak256(
            abi.encodePacked(randomness, block.chainid, address(this), domain)
        );
        st.counter = 0;
    }

    /** return a distinct, uniformly ditributed number, and advance the RNG.
     */
    function randomUint256(
        RNGState memory st
    ) internal pure returns (uint256 random) {
        random = uint256(keccak256(abi.encodePacked(st.seed, st.counter)));
        unchecked {
            // It's not possible to call random enough times to overflow
            st.counter++;
        }
    }

    /** return a distinct, uniformly ditributed number less than max, and advance the RNG.
    @notice max is limited to uint224 to ensure modulo bias probability is negligible.
     */
    function randomUintLessThan(
        RNGState memory st,
        uint224 max
    ) internal pure returns (uint224) {
        return uint224(randomUint256(st)) % max;
    }
}
