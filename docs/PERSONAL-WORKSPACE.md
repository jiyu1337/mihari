# MIHARI personal workspace

This document explains the private profile, automatic wallet scanning, the Asset Manager, Exposure and every user-facing position status.

## Watchlist and wallet holdings are different

MIHARI keeps two independent scopes:

| Scope | Where it appears | Meaning |
| --- | --- | --- |
| Watchlist | Assets | Stock Tokens the user selected for ongoing corporate-action monitoring |
| Wallet holdings | Exposure | Official Robinhood Stock Tokens automatically found at non-zero balances in verified wallets |

Selecting an asset does not create a wallet position. Removing an asset from the watchlist does not hide a real wallet position. Exposure scans every verified wallet for every official Robinhood Stock Token contract in the live Robinhood asset catalog.

## Data flow

1. The user verifies an EVM wallet with a free message signature.
2. MIHARI reads the wallet's token balances from Robinhood Chain Blockscout.
3. Contract addresses are matched against live Robinhood asset metadata.
4. Unknown tokens are ignored by the Stock Token mapper.
5. Every recognized non-zero Stock Token balance becomes an Exposure position.
6. MIHARI requests Robinhood market prices and corporate actions for the symbols found.
7. The bid and ask midpoint provides an indicative value.
8. Corporate-action symbols are matched to the wallet positions.

## Workspace sections

### Overview

The personal control room summarizes monitored assets, verified wallets, Stock Token positions and positions with event matches.

### Assets

The private Asset Manager contains the complete live Robinhood Stock Token catalog.

| Label | Meaning |
| --- | --- |
| Monitored | Saved in the user's watchlist |
| Not monitored | Available in the catalog but not selected |
| Contract / Chain 4663 | Official deployment used for Robinhood Chain matching |
| Select all | Adds the entire current catalog to the pending selection |
| Clear all | Removes the entire pending selection |
| Save scope | Persists the pending selection to the private profile |

Each contract can be copied or opened in Robinhood Chain Blockscout. Contract data comes from Robinhood asset metadata and is not hardcoded in the interface.

### Wallets

The identity graph lists addresses that proved ownership through a message signature. Verification does not request gas, token approval, a transaction, a private key or a seed phrase.

### Exposure

Exposure is an automatic inventory of recognized Stock Tokens found in all verified wallets. It is not limited to the watchlist.

| Field | Meaning |
| --- | --- |
| Asset | Robinhood symbol and company name recognized by official contract address |
| Balance | Onchain token balance from Blockscout |
| Indicative value | Balance multiplied by the midpoint between Robinhood bid and ask |
| Event status | Result of matching the position against the current Robinhood corporate-action response |

The indicative value is informational. It is not an executable quote and does not include slippage, fees, liquidity or every multiplier-related interpretation.

## Exposure statuses

### No Event Match

The Stock Token exists in the wallet, but no corporate-action record for that position appears in the current Robinhood source response.

It means:

- the position was found successfully;
- the token contract was recognized;
- MIHARI found no current corporate-action match;
- monitoring continues.

It does not mean the asset has no market, liquidity, issuer, smart-contract or future corporate-action risk.

### Event Match

An official Robinhood corporate-action record has the same symbol as a Stock Token position found in the wallet. The user should open View Risk and review the personal risk file.

## Personal risk file

| Label | Meaning |
| --- | --- |
| Position | Token amount found in the verified wallet |
| Event | Corporate-action type reported by Robinhood |
| Source status | Robinhood's processing state for the event |
| Risk | MIHARI's operational severity classification |
| What happened | Plain-language summary of the source evidence |
| Possible impact | Potential consequences for quotes, NAV, vaults, lending or agents |
| Recommended response | Advisory bounded response for an operator |
| Analysis | AI, Rule Based or Source Summary |
| Confidence | Evidence completeness and consistency, not probability of loss |
| Affected systems | Potential system categories, not proof that the user holds a protocol position |

### Analysis modes

| Mode | Meaning |
| --- | --- |
| AI | OpenAI analyzed a server-verified Robinhood event |
| Rule Based | Deterministic MIHARI rules were used because AI or persistence was unavailable or limited |
| Source Summary | Official source-derived text is visible while deeper analysis is pending or unavailable |

### Risk levels

| Risk | Meaning |
| --- | --- |
| Low | Resolved or limited immediate operational impact, with normal monitoring still required |
| Medium | Accounting or operational review may be required |
| High | Valuation, quoting or connected protocol accounting may be materially affected |
| Critical | An in-progress event or mismatch requires immediate operator attention |

### Source statuses

| Status | Meaning |
| --- | --- |
| In Progress | Robinhood reports that the corporate action is being processed |
| Completed | Robinhood reports that processing is complete; downstream reconciliation may still be required |
| Pending | A completed state or effective timing is not available yet |

## Current boundary

MIHARI currently maps wallet-held Stock Tokens and their corporate-action matches. It does not yet discover the user's vault shares, lending collateral, borrowed positions or agent-managed positions. Affected Systems describes where an event could propagate, not confirmed personal protocol exposure. Protocol-level discovery is the next Map phase.

MIHARI operates in Observe mode. It analyzes and recommends but does not move funds or execute a response.
