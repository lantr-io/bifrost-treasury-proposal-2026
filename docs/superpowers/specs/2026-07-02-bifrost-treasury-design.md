# Bifrost Bridge treasury — repurposing & funding design

**Date:** 2026-07-02
**Status:** design, pending user review
**Supersedes (as the repo's active effort):** the Scalus 2026 treasury work

## 1. Goal

Repurpose this repo — which drives the audited SundaeSwap `treasury-funds`
contracts — from the Scalus 2026 withdrawal to the **Bifrost Bridge** treasury
withdrawal. No contract code is written or ported; we only parameterize and
operate the upstream contracts.

The Bifrost proposal (HackMD `@lantr/bifrost-bridge-2026`) requests a
Cardano treasury withdrawal to fund Phase 1 (mainnet hardening + audits) of
the Bitcoin↔Cardano bridge, delivered jointly by **Lantr Engineering** and
**FluidTokens**.

## 2. Proposal facts (as of 2026-07-02)

| Field | Value |
|---|---|
| Withdrawal total | **₳12,332,031** (incl. 10% refundable contingency) |
| Contingency (10%) | ₳1,121,093 — stays in ADA, refundable |
| Net committed | ₳11,210,938 (≈ $1,793,750 @ $0.16/ADA) |
| Duration | 9 months, Jul 2026 – Mar 2027 |
| Delivery deadline | Q1 2027 |
| Milestones | M1 (Q3 2026), M2 (Q4 2026), M3 (Q1 2027) |
| Vendors | Lantr Engineering + FluidTokens (joint, no budget split) |

Budget workstreams (net, ex-contingency):

| Workstream | Amount (ADA) | Release mechanism |
|---|---|---|
| Core development | ₳3,937,500 | **vendor contract** (M1/M2/M3 milestones) |
| Security & QA (audits) | ₳3,601,563 | disburse on invoice |
| Product management | ₳984,375 | disburse |
| Ecosystem readiness | ₳1,109,375 | disburse |
| Legal / stewardship / economy | ₳1,578,125 | disburse |
| **Contingency** | ₳1,121,093 | stays at treasury (ADA), swept if unused |

## 3. Release model — hybrid (decided)

Only **Core development (₳3,937,500)** is locked in the SundaeSwap **vendor
contract** as a milestone schedule (M1/M2/M3), because that's the work that
benefits from time-based maturation and a per-milestone board veto. Everything
else is paid via **`Disburse`** on invoice, and the contingency stays in ADA
at the treasury contract.

Rationale (grounded in the audited contracts):

- Funds at the **treasury contract are already escrow** (board-controlled,
  auto-abstain delegated). The vendor contract only *adds* maturation dates +
  per-payout pause — valuable for deliverable-gated dev work, unnecessary for
  invoice-driven third-party costs (auditors, lawyers).
- `disburse.ak`'s own comment states it exists "to support conversion to
  stablecoins, or fiat payments" — the right tool for external fixed costs.
- Forcing auditor/lawyer payments through the 2-of-2 vendor multisig would
  require off-chain pass-through accounting; disburse pays the payee directly.

### Flow

```
Cardano treasury
   │ treasury withdrawal (gov action)  ₳12,332,031
   ▼
treasury contract  ────────────────────────────────────┐
   │ Fund  ₳3,937,500 (core dev)          │ Disburse (on invoice)   │ stays
   ▼                                       ▼                          ▼
vendor contract (4×₳984,375)        vendor / auditor / legal     contingency
  ├ M0 matures at funding ─ withdraw  wallets (fixed chunks)      ₳1,121,093 ADA
  ├ M1 matures 2026-09-30 ─ withdraw                               (Sweep → Cardano
  ├ M2 matures 2026-12-31 ─ withdraw                               treasury if unused)
  └ M3 matures 2027-03-31 ─ withdraw
```

The core-dev ₳3,937,500 is split into **four equal payouts of ₳984,375**:
**M0** (matures at funding — an upfront mobilization advance so vendors can
start M1 work), then **M1/M2/M3** maturing at the ends of Q3 2026 (2026-09-30),
Q4 2026 (2026-12-31), and Q1 2027 (2027-03-31). M0's maturation is set to the
fund-tx date at fund time; M1/M2/M3 are fixed calendar dates. The schedule
lives in the vendor datum (set per Fund call), not in script parameters.
Note: M0 is an internal cashflow construct (an advance), **not** a new proposal
deliverable — the proposal's deliverables remain M1/M2/M3.

### Operational constraints (from the contracts)

- `Fund` and any **ADA** `Disburse` must be **entirely before T_max**
  (treasury `expiration`); after expiration disburse can only move native
  assets. All milestone maturations must be ≤ `payout_upperbound`
  (= treasury expiration).
- Vendor **claims** (`Withdraw`) may happen up to `vendor.expiration`
  (= T_max + 30 days) — that grace window is why maturations can sit at T_max.

## 4. Identities & permission topology

- **Board (3):** reuse the existing production pkhs
  (Benkort / Gianelloni / Kilgore) unchanged.
- **Operator K_op:** **a freshly generated Lantr key** (via `gen-keys`, which
  uses `crypto.getRandomValues` — a CSPRNG). **Do not reuse** the Scalus admin
  key (`addr1qyhvk2…`). The operator submits txs, pays fees, and posts/receives
  the 100k gov-action deposit. Lantr's operator key also serves as Lantr's
  vendor signer.
- **Vendors (2):** Lantr (= K_op) + FluidTokens. Vendor claim multisig =
  `AllOf[Lantr, FluidTokens]` (2-of-2). FluidTokens supplies its pkh before
  deploy.

| Action | Multisig | Notes |
|---|---|---|
| `treasury.reorganize` | operator | no value leaves the script |
| `treasury.sweep` | 1-of-3 board | benign; returns funds to Cardano treasury |
| `treasury.disburse` | `AllOf[Lantr, FluidTokens, 1-of-3 board]` | both vendors + independent oversight |
| `treasury.fund` | 2-of-3 board | `fund.ak` also forces vendor consent |
| `vendor.pause` (adjudicate) | 1-of-3 board | easy to contest a milestone |
| `vendor.resume` | 2-of-3 board | deliberate |
| `vendor.modify` | 2-of-3 board | + vendor consent (contract) |
| vendor claim (`Withdraw`) | `AllOf[Lantr, FluidTokens]` | vendor datum |

**Board threshold rationale:** the proposal specifies disburse = both vendors +
1 board, and fund/modify = board majority. Because Lantr and FluidTokens are
two *independent* organizations that both must sign every disburse, "both
vendors + 1-of-3 board" is a stronger practical control than the Scalus setup
(single operator + 2-of-3 board), while matching the proposal text. 2-of-3
board is reserved for the structural actions (fund/modify/resume).

## 5. USDC / OTC conversion — documented, not built

A USD-denominated 9-month budget carries ADA price risk. Converting the
committed spend to USDC via OTC is sound and the disburse redeemer is designed
for it, but for now the repo stays **ADA-only** and the conversion is captured
as a documented future/manual procedure in `docs/`, including the two hard
constraints discovered in the contracts:

1. **The swap cannot be a single atomic treasury tx.** `disburse` enforces
   `equal_plus_min_ada(input − amount, output)`, which forbids *adding* USDC to
   a treasury output in the same tx that disburses ADA. The real flow is:
   Disburse ADA → ops/escrow wallet → OTC swap at wallet level → pay USDC back
   *into* the treasury script address (a plain output; treasury `spend` ignores
   the datum).
2. **Contingency must stay in ADA.** `sweep.logic` refunds via
   `treasury_donation` (a Conway ADA-only donation) and forces native assets to
   be *retained* at the script — USDC cannot be donated back to the Cardano
   Treasury. So the refundable 10% contingency must remain ADA.

Upside noted for later: once held as USDC, the "ADA only before expiration"
disburse guardrail no longer binds, giving more scheduling slack on fixed-cost
payments.

## 6. Two-pipeline parity (kept)

Both implementations stay and must produce **byte-identical** deterministic
artifacts:

- **Scala / scalus (`treasury-publish/`) — primary execution path.**
- **bun / TypeScript (`scripts/`, `params/`) — cross-check oracle.**

`scripts/compare-parity-preview.sh` runs init→register→gov through both and
asserts identical registry policy, treasury/vendor script hashes, reward
accounts, and gov-action JSON. Both pipelines get the Bifrost parameters and
the new permission topology; parity must stay green.

The permission topology and identities are expressed in two mirrored places
that must agree:

- bun: `params/common.ts` + `params/{preprod,preview,mainnet}.ts`
  (`buildTreasuryConfig`, `buildVendorConfig`, `vendorMultisig`).
- scala: `treasury-publish/Config.scala`.

## 7. Repo changes

### Delete
- `m5-withdraw/` — 2025-Scalus milestone-5 withdrawal, not needed.
- Scalus 2026 **proposal content**: `gov/anchor.*.json`, `gov/pinned.json`,
  `docs/proposal.md`, `docs/proposal-main.md`, `docs/annex-*.md`,
  `journal/2026-*scalus*` entries.

### Keep (repurpose)
- `treasury-publish/` (Scala primary) and `recover-deposits/` (generic).
- The anchor tooling — `build-anchor`, `sign-anchor`, `pin`, the CIP-108
  schema — re-pointed at the Bifrost proposal. A gov action can't be submitted
  without a CIP-108 anchor, so the pipeline stays; only its input changes.

### Modify
- **Config (both pipelines):** replace single-operator model with
  operator + 2 vendor pkhs + 3 board; rewrite the permission builders to §4;
  set Bifrost amounts and T_max.
- **`params/common.ts` `RawConfig`:** add the second vendor (FluidTokens) pkh;
  optionally split `amountLovelace` into total vs. vendor-funded core-dev vs.
  contingency for clarity (core-dev amount is used at fund time).
- **`05-fund-vendor.ts`:** wire the M1/M2/M3 core-dev schedule (currently a
  stub) — vendor datum with 2-of-2 vendor multisig and three payouts.
- **Add a disburse script:** for the fixed-chunk payments (audits/PM/ecosystem/
  legal) — none exists today (only fund/withdraw). Mirror in scala.
- **Docs:** rewrite `CLAUDE.md`, `README.md`, `Plan.md` for Bifrost; drop
  Scalus gotchas that no longer apply, keep the generic Cardano/anchor/SundaeSwap
  gotchas.

## 8. Values to confirm during review

- **T_max (treasury expiration):** **2027-07-31T00:00:00Z** (confirmed) — end
  of Q1 2027 delivery (Mar 31) + a 4-month buffer, so M3 can mature and
  `fund`/final ADA `disburse` complete comfortably before expiration. Vendor
  expiration = T_max + 30d = **2027-08-30**.
- **Core-dev milestone split** (confirmed): four equal payouts of ₳984,375 —
  M0 (upfront advance, matures at funding) + M1/M2/M3 at quarter-ends. The
  proposal itself gives no per-milestone budget (only per-workstream), so this
  split is our operational choice.
- **FluidTokens vendor pkh:** `1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175`
  (28-byte payment key hash, format-validated). Supplied as a bare hash only —
  full pubkey + proof-of-control signature still to be obtained and verified
  *before* the immutable registry mint, since a wrong hash bakes in
  permanently.

## 9. Out of scope

- Any contract logic (Aiken/Scala/otherwise) — raise upstream with SundaeSwap.
- Building the USDC/OTC path into the repo (documented only, §5).
- Multi-key hardware signing wiring for board members (relevant only
  post-ratification, as today).
