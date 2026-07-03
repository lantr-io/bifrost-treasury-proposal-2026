# Preview resubmission — two-author anchor (Lantr + FluidTokens)

**Date:** 2026-07-03 (preview rehearsal — testnet, not a mainnet money/authority
event, so this lives in `docs/`, not `journal/`).

Fresh preview submission of the Bifrost Bridge Phase 1 treasury-withdrawal
governance action, reusing the existing registry NFT and adding **FluidTokens**
as a co-author on the CIP-100 anchor.

## What changed vs the previous preview submission

- Proposal text re-synced from HackMD (`@lantr/bifrost-bridge-2026`) — now with
  Annexes (folded into the anchor `rationale`) and updated Supporting links.
- Anchor now has **two authors**, each signing the identical canonicalized
  `{@context, body}` (a CIP-100 witness does not cover the `authors` array):
  - Lantr Engineering — signed with `keys/admin.skey` (`sign-anchor.ts`).
  - FluidTokens — signed **out-of-band** from their mnemonic-derived vendor key,
    returned as `(publicKey, signature)`, inserted + verified by
    `insert-witness.ts`.
- Registry NFT **reused** — no `init`/`register`. `deployment/preview.json`
  untouched (registry policy `22ca5330…`, treasury script `60feb97d…`).

## Tooling added (all in-repo, bun; no third-party signer, no cardano-address)

- `build-anchor.ts` — emit both co-authors (`AUTHOR_NAMES`).
- `sign-anchor.ts` — `--author <name|idx>`, `--print-only`, and **extended-key**
  support (128-hex `fromExtendedHex` alongside 64-hex `fromNormalHex`), so a
  wallet/mnemonic-derived (Ed25519-BIP32) key signs directly.
- `insert-witness.ts` — insert a co-author's `(publicKey, signature)`, refusing
  unless the signature verifies against the recomputed body hash **and**
  `blake2b-224(pubkey) == expected pkh`.
- `mnemonic-to-key.ts` — BIP-39 phrase → CIP-1852 extended payment key hex +
  derived pkh (in-repo via `@blaze-cardano/core`).
- `docs/how-to-sign-anchor-fluidtokens.md` — the co-signer runbook handed to
  FluidTokens.

## Key facts / artifacts

- **Frozen body hash** (what both parties signed):
  `6bca0ed8b5b3b791eb273f49057f26973206d4c34cf02583e2858a727d3a73d8`
- **FluidTokens vendor vkey** (now known): `041a1295ee7145e95a946526320452a779b4d35975a7d0b37b467e21714de037`
  → hashes to vendor pkh `1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175`.
  Their anchor witness therefore **doubles as the vendor proof-of-control** that
  was outstanding before the immutable mint.
- **Anchor CID:** `ipfs://Qmei8uLEwtoZbKu6cKyF92PqNXs1jGt6W7txHPumXzTVwz`
- **Anchor blake2b-256 (on-chain dataHash):** `27344492e5a6595acb50d5d6afba8fe228f3fdfb1cdc4303e564a760cf13e8e6`
- **Gov-action tx:** `862681db9f74f7d35da94c9947368a9dec1a4018675fd477ba804c26053a04dc`
  (block 4436935, slot 116439861; deposit 1000 tADA, fee 0.299778 tADA).
- **gov_action id:** `gov_action1scngrkulwnmaxhdffjv5wd52nhkp5sqcva0agaa6spxzvpf6qnwqqnywvt5`
- Withdrawal: ₳12,332,031 → treasury reward account
  `stake_test17ps0awtaqykpaszrwp44gn42y8quspugz6x5c09xt5k44nqrn0v02`;
  guardrails `fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64`.

## Verification (post-submit)

- IPFS gateway fetch of the anchor → blake2b-256 == on-chain `meta_hash` ✓;
  `authors == [Lantr Engineering, FluidTokens]` ✓.
- Koios `/proposal_list`: `meta_url = ipfs://Qmei8uLE…`, `meta_hash = 27344492…`,
  type `TreasuryWithdrawals` ✓.
- (Blockfrost's off-chain metadata sub-endpoint lagged with nulls at submit time
  — its async fetcher, not a data problem; Koios shows the parsed proposal.)
- Guardrails: `bun run test` (39) + typecheck green throughout; Lantr's
  normal-key witness re-derives byte-identical after the extended-key refactor.
