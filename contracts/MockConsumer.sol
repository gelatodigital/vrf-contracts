// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

contract MockVRFConsumer {
    event RandomnessReceived(uint round, uint randomness);

    mapping(uint256 => uint256) public beaconOf;
    uint256 public latestRound;
    address public dedicatedMsgSender;

    constructor(address _dedicatedMsgSender) {
        dedicatedMsgSender = _dedicatedMsgSender;
    }

    function fullfillRandomness(uint256 _round, uint256 _randomness) external {
        require(msg.sender == dedicatedMsgSender);
        beaconOf[_round] = _randomness;
        latestRound = _round;
        emit RandomnessReceived(_round, _randomness);
    }
}
