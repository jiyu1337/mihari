// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Capped} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/// @title MIHARI Token
/// @notice Fixed-cap, burnable utility token for protection credits and guardian bonds.
/// @dev No transfer tax, hidden mint, blacklist, rebasing, or upgrade authority.
contract MihariToken is ERC20, ERC20Burnable, ERC20Capped, ERC20Permit {
    error InvalidTreasury();

    constructor(address treasury, uint256 initialSupply, uint256 maximumSupply)
        ERC20("MIHARI", "MHR")
        ERC20Permit("MIHARI")
        ERC20Capped(maximumSupply)
    {
        if (treasury == address(0)) revert InvalidTreasury();
        _mint(treasury, initialSupply);
    }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Capped) {
        super._update(from, to, value);
    }
}
