# MIHARI personal workspace

This document explains the private profile, automatic wallet scanning, the Asset Manager, direct Exposure, DeFi Exposure and every user-facing position status.

## Watchlist and wallet holdings are different

MIHARI keeps two independent scopes:

| Scope | Where it appears | Meaning |
| --- | --- | --- |
| Watchlist | Assets and Events | Up to 20 Stock Tokens selected for ongoing corporate-action monitoring |
| Wallet holdings | Exposure | Official Robinhood Stock Tokens automatically found at non-zero balances in verified wallets |

Selecting an asset does not create a wallet position. Removing an asset from the watchlist does not hide a real wallet position. Exposure scans every verified wallet for every official Robinhood Stock Token contract in the live Robinhood asset catalog.

## Live data sources

- Robinhood APIs provide the official asset catalog, prices, multipliers and corporate actions.
- Robinhood Chain Blockscout provides onchain token balances for verified wallets.
- Morpho provides read-only lending market and vault positions for verified wallets on chain ID 4663.
- OpenAI analyzes only events that the MIHARI server verifies against Robinhood.
- Neon stores accounts, watchlists, wallet links and cached incident analysis.

The public event console can use clearly labelled simulated data if Robinhood is unavailable. Private personal risk analysis requires an official event and does not treat simulated records as wallet evidence.

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
| Select 20 | Adds the first 20 assets in the current filtered catalog to the pending selection |
| Clear all | Removes the entire pending selection |
| Save scope | Persists the pending selection to the private profile |

Each contract can be copied or opened in Robinhood Chain Blockscout. Contract data comes from Robinhood asset metadata and is not hardcoded in the interface.

The 20-asset limit applies to the saved monitoring scope only. Automatic wallet scanning still checks every official Robinhood Stock Token contract in the live catalog.

### Events

The private Event Register reads the saved watchlist and refreshes official Robinhood corporate-action records every 60 seconds while the view is open. It shows only monitored assets that have a current matching event.

| Label | Meaning |
| --- | --- |
| Held in wallet | The event symbol also appears among Stock Token positions found in a verified wallet |
| Watchlist only | The asset is monitored but no current wallet position was found |
| Incident File | Source status, risk, AI or rule-based analysis, confidence, affected systems and recommended response |
| No current event matches | Monitoring is active but the current source response has no event for the saved scope |

### $MHR status and profile access

For every verified wallet, MIHARI checks the official `$MHR` contract `0x92150e06BAc43011cBe099b2830D947Ee3099809` through the same Blockscout balance response used for Stock Token discovery.

| Status | Meaning |
| --- | --- |
| Holder | The verified address has a non-zero `$MHR` balance |
| Not Held | The scan completed and found no non-zero `$MHR` balance |
| Unavailable | Blockscout did not return a usable balance response, so MIHARI does not assume zero |

A wallet-first profile shows **Link Email Access** in Wallets and Profile. Email access opens the same MIHARI workspace and does not replace or unlink the verified wallet.

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

### DeFi Exposure

DeFi Exposure is separate from direct wallet Exposure. It checks supported protocols for Stock Tokens that may be supplied, borrowed, posted as collateral or deposited into a vault.

The first adapter covers Morpho on Robinhood Chain:

| Position | Meaning |
| --- | --- |
| Lending Supply | A Stock Token is supplied as the loan asset in a Morpho market |
| Collateral | A Stock Token secures a Morpho borrowing position |
| Borrow | A Stock Token is borrowed in a Morpho market |
| Vault Deposit | A Morpho vault position uses an official Stock Token as its underlying asset |

Every result must match an official Robinhood Stock Token contract. Unknown protocol assets are excluded from MIHARI Stock Token exposure.

| Scan status | Meaning |
| --- | --- |
| Live | Every verified wallet request completed successfully |
| Partial | At least one wallet completed while another protocol request failed |
| Unavailable | No usable protocol result was returned, so MIHARI does not assume zero exposure |
| Waiting for Wallet | The profile has no verified address to scan |

**No supported position found** means the Morpho scan completed without finding an official Stock Token position. It does not mean that the wallet has no DeFi activity in unsupported protocols.

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

MIHARI maps direct wallet-held Stock Tokens and Morpho positions involving Stock Tokens. It does not yet claim coverage of every Robinhood Chain vault, lending market, DEX LP or agent-managed position. Affected Systems may still describe categories beyond the adapters currently supported.

MIHARI operates in Observe mode. It analyzes and recommends but does not move funds or execute a response.
