# Mainnet — recover prior gov-action deposit (funds scalus2026-2 submission)

**Network:** mainnet — **executed.**
**Date:** 2026-06-29
**Purpose:** recover the **100,000 ADA** governance-action deposit refunded from
our expired ₳8,503,000 / 12-month proposal (sitting in the admin stake reward
account) to the admin payment address, to fund the upcoming scalus2026-2
treasury-withdrawal submission's deposit. Via
`recover-deposits/recover-deposits.scala --network mainnet`.

## Preconditions (verified read-only)
- Admin stake `stake1uxlvah74gljhkhehgh5u5dywmuljtm2v068nh7prgpp4uxcf5r9dg`:
  `withdrawable_amount` = 100,000.000000 ADA, registered, `drep_id: null`.
- Admin payment `addr1qyhvk2…ztfcct`: ~101 ADA across 2 ada-only UTxOs (fee seed).

## Transactions (Conway: DRep delegation must precede the withdrawal)

| Step | Tx | Block | Fee | Note |
|---|---|---|---|---|
| Tx 1 — delegate | `4353296fd74b82cfcc33b8c645ac0b8bb3543b3ce8e90b3db782bef7c29dd264` | — | 0.171485 ₳ | VoteDelegCert → DRep.AlwaysAbstain (submitted via new `--delegate-only`, confirmed before Tx 2) |
| Tx 2 — withdraw | `5f96a3d85a8bcac74cac6c8c32cb75257d52b11ea2403aab897457ab9943a6c8` | 13612837 | 0.171705 ₳ | withdraw 100,000.000000 ADA → admin payment |

Tx 2 spent Tx 1's 9.525175 ₳ change as fee input; output to admin payment =
100,009.353470 ₳. Both txs witnessed by payment (`2ecb28d3…`) + stake
(`becedfd5…`) keys.

## Result (verified on-chain)
- Admin stake `withdrawable_amount` → **0** (drained); still DRep-delegated AlwaysAbstain.
- Admin payment address → **100,100.94 ADA** (2 UTxOs) — funds the new submission's
  100,000 ADA deposit + ~100 ₳ headroom for fees / NFT min-ADA / stake deposits.

## Tooling
- `recover-deposits.scala` gained a **`--delegate-only`** flag (commit `cc3efa2`):
  submit just the Phase-1 delegation (Tx 1) and stop before the withdrawal, so
  Tx 1 was broadcast + confirmed and Tx 2 reviewed separately before submitting.
- Env note: the restarted nix shell now carries the mainnet `BLOCKFROST_PROJECT_ID`
  from `.env` (earlier a stale preview key was cached by direnv `.direnv/`).

## Next
The off-chain mainnet prep is done (Config.mainnet, mainnet anchor `QmcZPnd…`,
parity assertion — commit `e8dee4e`) and the deposit is funded. The actual
scalus2026-2 mainnet submission (init → register → gov, scalus-submit + bun
parity gate) remains a separate, not-yet-executed step.
