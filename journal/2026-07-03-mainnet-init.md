# Mainnet — registry init (one-shot NFT mint)

**Date:** 2026-07-03 · **Network:** mainnet · **Operator:** K_op (Lantr,
`9edd850b…`)

First mainnet on-chain action for Bifrost Phase 1: minted the one-shot registry
NFT and published the `ScriptHashRegistry` datum, fixing the treasury/vendor
script hashes for the mainnet deployment. **Immutable** — the seed UTxO
permanently determines the registry policy and all script hashes.

## Transaction

- **initRegistry tx:** `20394e474401de0e66b2822e8b58f7154ba33e6895585bdf2fc415cbf64841a7`
- Confirmed: **block 13630987**, slot 191536207, fee **0.202353 ADA**.
- Registry NFT on-chain: `efc55daed371c4af7d2c0c4e143952993b28c2832e772606429af4fe` +
  asset name `5245474953545259` ("REGISTRY"), quantity 1.

## Baked-in parameters (permanent)

- **Seed UTxO:** `10bb8739bfa8944b78d0b2b586a7bafd85eca2c63580d9d4671e25f122205a2e#0`
  (explicitly pinned via `--seed` so the minted hashes matched the pre-verified
  dry-run exactly).
- **Registry policy:** `efc55daed371c4af7d2c0c4e143952993b28c2832e772606429af4fe`
- **Treasury script hash:** `67b5f219470d4abc5903824e85324b02627a80372aec8159db302581`
- **Vendor script hash:** `a21cbd0dda2ff2371b9e938ea29ce86be78738c668745ba00ca6cb77`
- **Treasury expiration (T_max):** 2027-07-31 (epoch ms 1816992000000);
  vendor expiry = T_max + 30d.
- Board pkhs (Benkort/CF, Gianelloni/Blink, Kilgore/IOG), FluidTokens vendor pkh
  `1c471b31…`, amount ₳12,332,031 — all per the verified mainnet config.

## Verification before the mint

- **bun ⇄ scala parity on the exact seed**: both pipelines produced byte-identical
  registry policy / treasury / vendor hashes (efc55dae / 67b5f219 / a21cbd0d).
- Dry-run built cleanly; mainnet Blockfrost key live; wallet had ≥2 distinct
  ada-only UTxOs for seed + collateral.

## Wallet

- Funded `addr1qx0dmpg…` with 50 ADA (10 + 30 + 10, three ada-only UTxOs).
- Init spent the 10 ADA seed → ~7.8 ADA change; ~2 ADA locked in the registry
  NFT output; fee 0.20 ADA.

## Register — stake creds registered + vote-delegated (2026-07-03)

- **register tx:** `d044c22dc5f5dfae91f6a638835bff1baf60502a2b78323a955b5136c2bc9c9e`
- Confirmed: **block 13630995**, fee 0.812114 ADA, **deposit 6 ADA** (3 × 2 ADA
  stake registrations, refundable).
- Registered + confirmed on-chain:
  - treasury `stake179nmtusegux540zeqwpyapfjfvpxy75qxu4weq2emvcztqgtmwxw2` → **drep_always_abstain** ✓
  - vendor `stake17x3pe0gdmghlydcmn6fcag5uap470pecce58gkaqpjnvkacke4mfr` → **drep_always_abstain** ✓
  - K_op `stake1u8xvfz9ycfyn7uenfnhljpnupqcdxmh6excx6hjrmvfjspsf6q5p8` registered
    (for the gov-deposit refund; no vote delegation needed on the personal key).

## Next (deferred until funded)

- `gov --network mainnet --submit` — the ₳12,332,031 treasury-withdrawal action.
  **Requires ~100,000 ADA gov-action deposit** at `addr1qx0dmpg…` (not yet
  funded). Anchor reused from preview (body-identical, CID `QmZwHmFo…`, hash
  `f95bd746…`). Wallet after init+register: ~41 ADA.
