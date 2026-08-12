# MIHARI onchain layer

These contracts are designed for Robinhood Chain (EVM). They are not yet audited and must remain testnet-only until a professional security review is complete.

- `CorporateActionAttestationRegistry`: immutable event/source/analysis hashes with explicit revocation signals.
- `MihariPolicyRegistry`: user-owned policy configuration and executor receipts. It does not give AI custody.
- `MihariToken`: fixed-cap, burnable MHR utility token without taxes, blacklists, rebasing or hidden minting.
- `ProtectionCreditBurner`: burns approved MHR for auditable protection-credit consumption.

Compile from the repository root:

```bash
npm run contracts:compile
```

Deployment addresses will be recorded in `deployments/46630.json` after Robinhood Chain testnet deployment.
