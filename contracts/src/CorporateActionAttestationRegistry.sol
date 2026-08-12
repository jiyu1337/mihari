// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Corporate Action Attestation Registry
/// @notice Stores immutable hashes of MIHARI source records and analyses on Robinhood Chain.
/// @dev Human-readable payloads stay offchain; hashes make provenance independently verifiable.
contract CorporateActionAttestationRegistry is AccessControl {
    bytes32 public constant ATTESTER_ROLE = keccak256("ATTESTER_ROLE");

    struct Attestation {
        bytes32 sourceHash;
        bytes32 analysisHash;
        uint64 observedAt;
        uint64 effectiveAt;
        bool revoked;
    }

    mapping(bytes32 eventId => Attestation attestation) public attestations;

    error AttestationAlreadyExists(bytes32 eventId);
    error AttestationDoesNotExist(bytes32 eventId);
    error InvalidHash();
    error InvalidObservedAt();

    event CorporateActionAttested(
        bytes32 indexed eventId,
        bytes32 indexed sourceHash,
        bytes32 indexed analysisHash,
        string symbol,
        string actionType,
        uint64 observedAt,
        uint64 effectiveAt,
        address attester
    );

    event AttestationRevoked(bytes32 indexed eventId, bytes32 indexed reasonHash, address indexed revoker);

    constructor(address admin, address initialAttester) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ATTESTER_ROLE, initialAttester);
    }

    function attest(
        bytes32 eventId,
        bytes32 sourceHash,
        bytes32 analysisHash,
        string calldata symbol,
        string calldata actionType,
        uint64 observedAt,
        uint64 effectiveAt
    ) external onlyRole(ATTESTER_ROLE) {
        if (eventId == bytes32(0) || sourceHash == bytes32(0) || analysisHash == bytes32(0)) {
            revert InvalidHash();
        }
        if (attestations[eventId].sourceHash != bytes32(0)) {
            revert AttestationAlreadyExists(eventId);
        }
        if (observedAt == 0 || observedAt > block.timestamp) {
            revert InvalidObservedAt();
        }

        attestations[eventId] = Attestation({
            sourceHash: sourceHash,
            analysisHash: analysisHash,
            observedAt: observedAt,
            effectiveAt: effectiveAt,
            revoked: false
        });

        emit CorporateActionAttested(
            eventId,
            sourceHash,
            analysisHash,
            symbol,
            actionType,
            observedAt,
            effectiveAt,
            msg.sender
        );
    }

    /// @notice Revocation does not erase history; it appends a visible correction signal.
    function revoke(bytes32 eventId, bytes32 reasonHash) external onlyRole(DEFAULT_ADMIN_ROLE) {
        Attestation storage record = attestations[eventId];
        if (record.sourceHash == bytes32(0)) revert AttestationDoesNotExist(eventId);
        if (reasonHash == bytes32(0)) revert InvalidHash();

        record.revoked = true;
        emit AttestationRevoked(eventId, reasonHash, msg.sender);
    }
}
