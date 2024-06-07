// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/ISablier.sol";
import "./Altar.sol";

contract AltarTreasury {
    uint256 public constant STANDARD_DELAY = 2 minutes;

    IERC20 public kite;
    ISablier public sablier;
    uint256 public streamId;

    constructor(address sablier_, address kite_) {
        kite = IERC20(kite_);
        sablier = ISablier(sablier_);
    }

    // TODO this should be ownable

    function startStream(uint256 periode_, address altarAddress_) public {
        require(streamId == 0, "already started");
        uint deposit = kite.balanceOf(address(this));
        kite.approve(address(sablier), deposit);
        uint256 startTime = block.timestamp + STANDARD_DELAY;
        uint256 stopTime = startTime + periode_;
        streamId = sablier.createStream(
            altarAddress_,
            deposit,
            address(kite),
            startTime,
            stopTime
        );
        Altar(altarAddress_).setStreamId(streamId);
    }
}
