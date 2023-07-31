// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "./Inbox.sol";
import "./Consumer.sol";

contract MockVRFConsumer is GelatoVRFConsumer {
    mapping(uint256 => uint256) public beaconOf;
    uint256 public latestRound;
    GelatoVRFInbox public inbox;

    constructor(GelatoVRFInbox _inbox) {
        inbox = _inbox;
    }

    function requestRandomness(uint256 round) external {
        inbox.requestRandomness(round, this);
    }

    function fullfillRandomness(uint256 _round, uint256 _randomness) external {
        beaconOf[_round] = _randomness;
        latestRound = _round;
    }
}
