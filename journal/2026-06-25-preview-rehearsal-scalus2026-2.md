# Preview rehearsal — Scalus 2026 resubmission (scalus2026-2)

**Network:** preview (testnet) — rehearsal only, NOT a mainnet operation.
**Date:** 2026-06-25
**Purpose:** End-to-end validation of the reduced ₳2,991,667 / 9-month
resubmission pipeline (fresh deployment, T_max 2027-07-01) before mainnet.

## Fresh deployment (reused admin + board keys)

| Item | Value |
|---|---|
| Registry policy | `af546b2a8e59d3d7b696d67198782079bd3a13597db68a7405276611` |
| Treasury script hash | `690e2c946e47f21048908418cf89ec28ad49145c738061d16d234a46` |
| Vendor script hash | `d54b29a8685a82ee1bc57cf7ad2f638bfa04058b06c0d124b648f8c6` |
| Treasury reward acct | `stake_test17p5suty5derlyyzgjzzp3nufas526jg5t3ecqcw3d53553sjhu95v` |
| Vendor reward acct | `stake_test17r25k2dgdpdg9msmc4700tf0vw9l5pq93vrvp5fykey033shqe5p6` |
| Admin reward acct | `stake_test1uzlvah74gljhkhehgh5u5dywmuljtm2v068nh7prgpp4uxcw7f8f4` (already registered — cert skipped) |

## Transactions

| Step | Action | Tx hash |
|---|---|---|
| init | mint registry NFT + publish datum | `9ebf59c0a0f750a94d316cba62ffe27e7164f2e2fb1b46dc97cad87b9b4bf2d4` |
| register | register treasury + vendor (vote-deleg AlwaysAbstain) | `85fbeaf94ee768129fbca3975d6815102c657d7faef129932b2437d38624b037` |
| gov | TreasuryWithdrawals gov action | `c7f699822e3f581eb7c3e10af4000da0f7a3798321aef86c8a1529eca089029a` |

## Gov action

- **Type:** TreasuryWithdrawals
- **Amount:** 2,991,667,000,000 lovelace (₳2,991,667) → treasury reward acct
- **Anchor:** `ipfs://QmSJzmG6P9FZUiNVTMMceoVH5xpCrbSUYLrmyJ6RbX5x2M`
- **Anchor data hash:** `00fde272fa68f405f6d1ea9c40a65e946c5b8e7582388120f3f9308c6f8d0ac6`
- **Deposit:** 1,000 tADA (preview `gov_action_deposit`)
- **Koios verification:** `meta_json.body.title` = "Scalus 2026: Maintenance,
  Dijkstra Readiness & Application Runtime" — offchain anchor fetched + parsed
  successfully.

## Notes / placeholders

- Annex/proposal references reuse the prior cycle's IPFS PDFs (content-matched
  placeholders) — must be replaced with real scalus2026-2 PDF exports before
  any mainnet submission.
- `deployment/preview.json` (machine-written, gitignored) holds the live
  state; the prior-cycle file was backed up to
  `deployment/preview.json.scalus2026-1.bak`.
