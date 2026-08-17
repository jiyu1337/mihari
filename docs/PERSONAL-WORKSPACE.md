# MIHARI personal workspace

This document explains the private profile, automatic wallet scanning, the Asset Manager, direct Exposure, DeFi Exposure and every user-facing position status.

## Watchlist and wallet holdings are different

MIHARI keeps two independent scopes:

| Scope | Where it appears | Meaning |
| --- | --- | --- |
| Watchlist | Assets and Events | Up to 10 assets with Observer access or 30 with MHR Holder access |
| Wallet holdings | Exposure | Official Robinhood Stock Tokens automatically found at non-zero balances in verified wallets |

Selecting an asset does not create a wallet position. Removing an asset from the watchlist does not hide a real wallet position. Exposure scans every verified wallet for every official Robinhood Stock Token contract in the live Robinhood asset catalog.

## Live data sources

- Robinhood APIs provide the official asset catalog, prices, multipliers and corporate actions.
- Robinhood Chain Blockscout provides onchain token balances for verified wallets.
- Morpho provides read-only lending market and vault positions for verified wallets on chain ID 4663.
- Robinhood Chain Blockscout and read-only contract calls provide Uniswap V3 and V4 LP NFT exposure.
- Arcus and Lighter provide public read-only perpetual-position data matched to official Stock Token symbols.
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
| Select 10 or Select 30 | Adds assets from the current filtered catalog up to the profile's access limit |
| Clear all | Removes the entire pending selection |
| Save scope | Persists the pending selection to the private profile |

Each contract can be copied or opened in Robinhood Chain Blockscout. Contract data comes from Robinhood asset metadata and is not hardcoded in the interface.

The access limit applies to the saved monitoring scope only. Automatic wallet scanning still checks every official Robinhood Stock Token contract in the live catalog.

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
| Balance Found | The verified address has a non-zero `$MHR` balance. This does not by itself mean the profile reached the Holder access threshold |
| Not Held | The scan completed and found no non-zero `$MHR` balance |
| Unavailable | Blockscout did not return a usable balance response, so MIHARI does not assume zero |

MIHARI adds the `$MHR` balances across verified wallets. The current beta threshold is 1,000,000 MHR and can be changed through the server environment without changing the token contract. Access is calculated by the server from current onchain balances.

| Access | Watchlist | Verified wallets | New AI analyses per 24 hours | Position mapping |
| --- | ---: | ---: | ---: | --- |
| Observer | 10 | 1 | 1 | Direct holdings, official events, watchlist research and the direct Risk Graph |
| MHR Holder | 30 | 5 | 10 | Multi-wallet direct exposure, personal DeFi scans and protocol paths in the Risk Graph |

Cached AI results do not consume another analysis because MIHARI reuses the existing verified result. If an AI limit is reached, the product still returns a rule-based explanation and monitoring continues.

The interface explains locked features before asking the user to do anything. Verifying holder access is read-only and does not request a token approval or transaction.

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

The DeFi Exposure page is visible to every registered profile and is separate from direct wallet Exposure. Observers can review supported integrations and see an asset research scope that places wallet holdings first, followed by watchlist-only assets. This preview does not query personal protocol positions. A combined verified balance of at least 1,000,000 MHR unlocks read-only protocol scans across up to five verified wallets.

The asset scope uses two explicit labels:

| Scope label | Meaning |
| --- | --- |
| Holding | The Stock Token was found in a verified wallet and can be matched to a personal protocol position |
| Watchlist / Research | The asset was selected for monitoring but is not claimed as a holding or DeFi position |

Holder scans look for Stock Tokens that may be supplied, borrowed, posted as collateral, deposited into a vault, represented inside liquidity or used as the market for a perpetual position.

Five read-only adapters are active for Robinhood Chain exposure:

| Position | Meaning |
| --- | --- |
| Lending Supply | A Stock Token is supplied as the loan asset in a Morpho market |
| Collateral | A Stock Token secures a Morpho borrowing position |
| Borrow | A Stock Token is borrowed in a Morpho market |
| Vault Deposit | A Morpho vault position uses an official Stock Token as its underlying asset |
| DEX Liquidity | An official Stock Token is represented inside a Uniswap V3 or V4 LP NFT |
| Perp Position | An Arcus or Lighter long or short perpetual position matches an official Stock Token symbol |

For a Uniswap position, MIHARI reads its tick range, liquidity and current pool state. It calculates the principal Stock Token amount represented by the position. V3 also includes tokens already reported as owed by the Position Manager. The result is labelled **Active** when the current tick is inside the position range and **Out of Range** when the current tick is outside it.

Onchain protocol assets must match an official Robinhood Stock Token contract. Perpetual markets must match an exact official Stock Token symbol after removing a supported quote suffix such as USD or USDG. Unknown protocol assets and markets are excluded.

| Scan status | Meaning |
| --- | --- |
| Live | Every verified wallet request completed successfully |
| Partial | At least one wallet completed while another protocol request failed |
| Unavailable | No usable protocol result was returned, so MIHARI does not assume zero exposure |
| Waiting for Wallet | The profile has no verified address to scan |

The coverage cards use separate integration stages:

| Integration stage | Meaning |
| --- | --- |
| Live | The adapter is considered stable enough for normal read-only scanning |
| Beta | The adapter is active, but coverage limits and source availability are still being validated |
| Planned | The protocol belongs to the coverage roadmap, but MIHARI is not scanning it yet |

### Reading the DeFi dashboard

| Label | Meaning |
| --- | --- |
| Checked | Active adapters that returned a live or partial scan result |
| Mapped | Every ecosystem source listed in the coverage registry, including planned adapters |
| Protocol Positions | Normalized Stock Token position rows found by active adapters |
| Amount | Stock Token quantity represented by the protocol position |
| Indicative Value | Amount multiplied by the Robinhood bid and ask midpoint when available |
| Active | The current Uniswap tick is inside the LP position range |
| Out of Range | The current Uniswap tick is outside the LP range; this is not a corporate-action rating |
| Long / Short | The direction reported by Arcus or Lighter for a perpetual position |
| Leverage | Position leverage reported by Arcus or derived from Lighter's initial margin fraction |
| Cross / Isolated | The margin mode reported by the perpetual protocol |
| UPNL | Unrealized profit or loss reported by the protocol; it is not a settled balance |
| Event Match | A current official Robinhood corporate action matches the Stock Token inside the position |
| No Event Match | No matching record exists in the current response; monitoring continues |

One Uniswap LP NFT can create two position rows when both sides of the pool are official Robinhood Stock Tokens. MIHARI limits each Uniswap adapter to the first 24 LP NFTs per wallet in the current beta. If the limit is reached or a contract read fails, the adapter reports **Partial** instead of silently treating the missing data as zero.

**No supported position found** means the active Morpho, Uniswap V3, Uniswap V4, Arcus and Lighter scans completed without finding an official Stock Token position. It does not mean that the wallet has no activity in unsupported protocols.

### Unified Risk Graph

Risk Graph is available to every registered profile. It prioritizes verified wallet holdings, then adds watchlist assets as research signals. A watchlist signal is not described as proven exposure. MHR Holder access adds supported protocol positions to the same graph. The graph answers two questions: **which current official corporate action reaches a position MIHARI has mapped, and which event should a user review before buying a watched asset?**

Each active path contains three verified layers:

| Layer | Meaning |
| --- | --- |
| Official Event | A live Robinhood corporate-action record. Simulated fallback records are excluded |
| Stock Token | The official identity shared by the event and the position |
| Proven Exposure | A direct verified-wallet balance or a normalized position from an active protocol adapter |

The graph uses deterministic matching. AI does not invent nodes or edges. Direct wallet paths require an official contract match. Arcus and Lighter paths require an exact official symbol match after a supported quote suffix is removed.

| Graph label | Meaning |
| --- | --- |
| Active Signals | Official corporate actions that match a holding, supported protocol position or watchlist asset |
| Tracked Assets | Unique Stock Token symbols found across holdings, protocol positions and the watchlist |
| Direct Paths | Verified wallet balance rows touched by current events |
| Protocol Paths | Supported protocol position rows touched by current events |
| Watchlist Signal | A monitored asset has an official event, but MIHARI has not found a direct or protocol position for it |
| Live | All active protocol requests completed successfully |
| Partial | Direct paths remain usable, but at least one active protocol source is incomplete or unavailable |
| No Active Path | No current official corporate action matches a mapped position. Monitoring continues |

`No Active Path` is not a claim of zero market, smart-contract, liquidity or future corporate-action risk. It only describes the current official event window and the integrations MIHARI supports today.

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

MIHARI maps direct wallet-held Stock Tokens plus supported Morpho, Uniswap V3, Uniswap V4, Arcus and Lighter positions involving Stock Tokens. Rialto position discovery and Chainlink dependency mapping remain visible in the coverage roadmap but are not scanned yet. MIHARI does not claim coverage of every Robinhood Chain vault, lending market, DEX LP, perpetual position or agent-managed position. Affected Systems may still describe categories beyond the adapters currently supported.

MIHARI operates in Observe mode. It analyzes and recommends but does not move funds or execute a response.

## Policy Recommendations

Policy Recommendations turns an official corporate action into a structured review plan. It is available inside the signed-in workspace for events matched to wallet holdings or watchlist assets.

The page separates three layers:

1. **Detected Event** is the verified Robinhood corporate-action record.
2. **Risk Interpretation** explains the possible operational impact and affected systems.
3. **Recommended Policy** describes a bounded operator review plan.

| Label | Meaning |
| --- | --- |
| Priority | Routine, Review or Urgent. It describes review urgency, not price direction |
| Intent | The goal of the plan, such as monitoring, reviewing accounting, restricting new exposure or pausing sensitive flows |
| Scope | Quotes, NAV, vaults, lending or agents that may require review |
| Required Checks | Concrete evidence and calculations an operator should verify |
| Apply When | Observable condition that makes the recommendation relevant |
| Clear When | Observable condition that indicates reconciliation is complete |
| Operator Decision | No Action, Review Required or Approval Required |
| Advisory Only | The recommendation has not been executed and cannot authorize a transaction |

Observer and Holder profiles can read policy recommendations. Their existing AI limits still apply: one new AI analysis per 24 hours for an Observer and ten for an MHR Holder. Cached results are reused. If AI is unavailable or limited, deterministic MIHARI rules return the same structured policy format.

Policy Recommendations does not request a signature, token approval or transaction.

## Guard Actions

Guard Actions is the approval layer after Policy Recommendations. It is available to MHR Holder profiles only when the selected event matches a Stock Token found in a verified wallet. A watchlist-only asset remains a research signal and cannot create an actionable Guard decision.

The server verifies all three requirements before creating a draft:

1. The corporate action still exists in the live Robinhood source.
2. The Stock Token is held in a verified wallet attached to the current account.
3. The verified wallets hold at least the configured MHR Holder threshold.

The preview contains the intended response, affected systems, operator checks, apply conditions, clear conditions, action steps and fixed safety boundaries. The user sees the complete preview before approval.

| Guard status | Meaning |
| --- | --- |
| Draft | A current official event was verified and a reviewable response was prepared |
| Approved | The user completed every confirmation and a private decision receipt was stored |
| Dismissed | The user closed the draft without approving it |
| Preview Only | No protocol call, token approval or transaction can be submitted |
| Not Submitted | A decision exists, but there is no onchain transaction hash |

Approval requires three safety confirmations and the exact phrase `APPROVE SYMBOL`. Before accepting the decision, the server checks the MHR balance, Stock Token holding and official event again. If the source event changed, the old preview cannot be approved.

An approved decision creates a private SHA-256 receipt that links the account, official source hash, Guard preview, intent and approval time. The receipt is stored in MIHARI for audit history. It is not an onchain proof.

### Current Guard boundary

- No token approval is requested.
- No funds or positions can be moved.
- No protocol transaction is submitted.
- No public onchain receipt is created.
- Automatic execution remains locked until the contracts and protocol adapters are independently audited and deployed.
