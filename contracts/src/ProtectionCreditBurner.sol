// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MihariToken} from "./MihariToken.sol";

/// @title Protection Credit Burner
/// @notice Converts MHR into verifiable one-way service consumption receipts.
contract ProtectionCreditBurner {
    MihariToken public immutable token;

    error InvalidCreditUse();

    event ProtectionCreditConsumed(
        address indexed payer,
        bytes32 indexed integrationId,
        bytes32 indexed serviceId,
        uint256 amount
    );

    constructor(MihariToken token_) {
        if (address(token_) == address(0)) revert InvalidCreditUse();
        token = token_;
    }

    function consume(bytes32 integrationId, bytes32 serviceId, uint256 amount) external {
        if (integrationId == bytes32(0) || serviceId == bytes32(0) || amount == 0) {
            revert InvalidCreditUse();
        }

        token.burnFrom(msg.sender, amount);
        emit ProtectionCreditConsumed(msg.sender, integrationId, serviceId, amount);
    }
}
