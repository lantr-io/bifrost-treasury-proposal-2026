# Mainnet SUBMISSION — scalus2026-2 (₳2,464,844), broadcast via the Scalus pipeline

**Network:** mainnet — **submitted on-chain.**
**Date:** 2026-06-29
**Broadcast by:** the Scalus `treasury-publish` tools (`--submit`), each stage
gated by a live bun⇄scalus dry-run diff. Funded by the recovered 100,000 ADA
deposit (see `journal/2026-06-29-mainnet-deposit-recovery.md`).

## Gov action (LIVE)
- **proposal_id:** `gov_action1xg69v73lfzkwyhhuz583x6geyc2ewn3r96sxuqj3wqvrrk0yfpksqqa63yc`
- **Type:** TreasuryWithdrawals · **Amount:** ₳2,464,844 (2,464,844,000,000 lovelace) → treasury reward `857e556d…`
- **Guardrails:** `fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64` (verified == live mainnet constitution, 3 recent withdrawals + 2025 Scalus action)
- **Deposit:** 100,000 ADA (deposit-return → admin stake `stake1uxlvah74…`)
- **Anchor:** `ipfs://QmcZPndRnPR3giqybj1u24VVFx5q4csN9uYHuFCtT38uqD`, dataHash `e6b117c2522a69b1b693dd863181aa42b86d71fc928b5b5d40cc906d43515500` (Koios `meta_hash` matches)
- **Expiration:** epoch 647 (voting window)

## Deploy coordinates (fresh, seed-forced)

| Item | Value |
|---|---|
| Seed UTxO | `b76801c89ec1a55382dfb5232a37c2a0d25ea69231f0a2ebf0da7ea021c93eed#0` |
| Registry policy | `c0bcea0107d8d55d3008f915bf99b738bda15782c156680b81cbea68` |
| Treasury script | `857e556d0fea86c3814ee7124bf342d498ee598459a73905237daf06` |
| Vendor script | `e5ae4591f4411c82f08c2c62adc11b118c63a4b10cb74f176001a823` |
| Treasury reward acct | `stake17xzhu4tdpl4gdsupfmn3yjlngt2f3mjes3v6wwg9yd767ps8k5qvl` |
| Vendor reward acct | `stake178j6u3v373q3eqhs3skx9twprvgcccaykyxtwnchvqq6sgc7e2nhz` |
| Registry NFT @ | `addr1w8qte6spqlvd2hfspru3t0uekuutmg2hstq4v6qts89756qx8cv6w` (inline datum = ScriptHashRegistry) |

## Transactions (all confirmed, each behind a bun⇄scalus dry-run gate)

| Step | Tx | Block | Fee |
|---|---|---|---|
| init | `e2ab7afa834ffff2e6b2e0a9a09b0b8284480acf1e5b07fc23ade068872527c4` | 13612970 | 0.202353 ₳ |
| register | `45f80f3672e9eef272efe673a63e6f9fe082e1d00a176adecf24ff636bb7ef7f` | 13612981 | 0.810002 ₳ |
| gov | `3234567a3f48ace25efc150f1369192615974e232ea06e0251701831d9e4486d` | 13613041 | 0.299954 ₳ |

## Configuration baked into the scripts (verified pre-submit)
- Board: K_1 `7095faf3…` (M. Benkort/CF), K_2 `058a5ab0…` (C. Gianelloni/Blink), K_3 `fe0921cf…` (R. Kilgore/IOG); admin/K_op `2ecb28d3…`.
- Deadlines: treasury.expiration & payout_upperbound = 2027-07-01; vendor.expiration = 2027-07-31 (+30d grace).
- Permissions: reorganize=K_op; sweep=K_op+1board; disburse/fund=K_op+2board; pause=1board; resume=2board; modify=K_op+2board.
- Config lives in the parameterized UPLC (Blockfrost `/scripts/857e556d…` 5873 B, `/scripts/e5ae4591…` 8292 B), committed by hash; registry datum holds the two hashes.

## Requirements gate (post-register, verified on-chain)
Treasury + vendor reward accounts: **registered + drep_always_abstain + no SPO** — PASS. Matches every legitimate enacted mainnet treasury withdrawal.

## Notes
- Supersedes the expired ₳8,503,000 / 12-month proposal `e0900fdd…` (expired epoch 637, dropped 638); its 100k deposit was recovered to fund this.
- Submitted entirely via the **Scalus** submit path (init/register/gov), with bun as the per-stage parity gate. tx CBOR differs by builder (expected).
- **Next:** DRep vote over the lifetime to epoch 647. On ratification → `withdraw` → `fund` vendor (board multisig + milestone schedule, Phase 2). On expiry → deposit refunds to admin stake.
