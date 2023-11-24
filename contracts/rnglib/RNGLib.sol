// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title RNGLib
 * @dev Library providing a simple interface to manage a
 * contract-internal PRNG and pull random numbers from it.
 */
library RNGLib {
    /// @dev Structure to hold the state of the random number generator (RNG).
    struct RNGState {
        bytes32 seed;
        uint256 counter;
    }

    /// @notice Seed a new RNG based on value from a public randomness beacon.
    /// @dev To ensure domain separation, at least one of randomness, chain id, current contract
    /// address, or the domain string must be different between two different RNGs.
    /// @param randomness The value from a public randomness beacon.
    /// @param domain A string that contributes to domain separation.
    /// @return st The initialized RNGState struct.
    function makeRNG(
        uint256 randomness,
        string memory domain
    ) internal view returns (RNGState memory st) {
        st.seed = keccak256(
            abi.encodePacked(randomness, block.chainid, address(this), domain)
        );
        st.counter = 0;
    }

    /// @notice Generate a distinct, uniformly distributed number, and advance the RNG.
    /// @param st The RNGState struct representing the state of the RNG.
    /// @return random A distinct, uniformly distributed number.
    function randomUint256(
        RNGState memory st
    ) internal pure returns (uint256 random) {
        random = uint256(keccak256(abi.encodePacked(st.seed, st.counter)));
        unchecked {
            // It's not possible to call random enough times to overflow
            st.counter++;
        }
    }

    /// @notice Generate a distinct, uniformly distributed number less than max, and advance the RNG
    /// @dev Max is limited to uint224 to ensure modulo bias probability is negligible.
    /// @param st The RNGState struct representing the state of the RNG.
    /// @param max The upper limit for the generated random number (exclusive).
    /// @return A distinct, uniformly distributed number less than max.
    function randomUintLessThan(
        RNGState memory st,
        uint224 max
    ) internal pure returns (uint224) {
        return uint224(randomUint256(st) % max);
    }
}
