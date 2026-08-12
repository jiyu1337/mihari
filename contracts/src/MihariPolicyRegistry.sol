// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title MIHARI Policy Registry
/// @notice User-owned protection policies and auditable decision receipts for Robinhood Chain.
/// @dev This registry never gives an AI model custody. Protocol adapters enforce bounded actions.
contract MihariPolicyRegistry is AccessControl, Pausable {
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    enum Mode {
        Observe,
        Guard,
        Automate
    }

    struct Policy {
        bytes32 configurationHash;
        Mode mode;
        uint64 updatedAt;
        bool active;
    }

    mapping(address account => mapping(bytes32 policyId => Policy policy)) public policies;
    mapping(bytes32 actionId => bool recorded) public recordedActions;

    error InvalidConfiguration();
    error PolicyInactive(address account, bytes32 policyId);
    error ActionAlreadyRecorded(bytes32 actionId);

    event PolicyConfigured(
        address indexed account,
        bytes32 indexed policyId,
        bytes32 indexed configurationHash,
        Mode mode,
        bool active
    );

    event DecisionRecorded(
        bytes32 indexed actionId,
        bytes32 indexed eventId,
        address indexed account,
        bytes32 policyId,
        bytes32 decisionHash,
        bytes32 executionReference,
        address executor
    );

    constructor(address admin, address initialExecutor) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, initialExecutor);
    }

    function configurePolicy(
        bytes32 policyId,
        bytes32 configurationHash,
        Mode mode,
        bool active
    ) external whenNotPaused {
        if (policyId == bytes32(0) || configurationHash == bytes32(0)) {
            revert InvalidConfiguration();
        }

        policies[msg.sender][policyId] = Policy({
            configurationHash: configurationHash,
            mode: mode,
            updatedAt: uint64(block.timestamp),
            active: active
        });

        emit PolicyConfigured(msg.sender, policyId, configurationHash, mode, active);
    }

    function deactivatePolicy(bytes32 policyId) external {
        Policy storage policy = policies[msg.sender][policyId];
        if (policy.configurationHash == bytes32(0)) revert InvalidConfiguration();

        policy.active = false;
        policy.updatedAt = uint64(block.timestamp);
        emit PolicyConfigured(msg.sender, policyId, policy.configurationHash, policy.mode, false);
    }

    function recordDecision(
        bytes32 actionId,
        bytes32 eventId,
        address account,
        bytes32 policyId,
        bytes32 decisionHash,
        bytes32 executionReference
    ) external onlyRole(EXECUTOR_ROLE) whenNotPaused {
        if (!policies[account][policyId].active) revert PolicyInactive(account, policyId);
        if (recordedActions[actionId]) revert ActionAlreadyRecorded(actionId);
        if (actionId == bytes32(0) || eventId == bytes32(0) || decisionHash == bytes32(0)) {
            revert InvalidConfiguration();
        }

        recordedActions[actionId] = true;
        emit DecisionRecorded(
            actionId,
            eventId,
            account,
            policyId,
            decisionHash,
            executionReference,
            msg.sender
        );
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
