# Preview funding-flow test — design

**Date:** 2026-07-03
**Status:** approved (brainstorming) → ready for implementation plan
**Scope:** End-to-end test of the Bifrost treasury **funding-execution** flow on
Cardano **preview**, using the audited SundaeSwap `treasury-funds` validators.
The governance-publishing path (`init → register → gov`) is already done and
live on preview; this spec covers everything *below* the gov action that was
previously deferred.

## Goal

Exercise every money-moving endpoint of the treasury/vendor contracts on
preview, with real multisig assembly, so we have concrete on-chain evidence
(tx hashes, datum decodes, and confirmed negative results) before any mainnet
funding. "Does the money actually come out, only for the right signers, only
when it should?"

## Why this is new work

- The **Scala primary pipeline** (`treasury-publish/`) currently implements only
  `init` / `register` / `gov`. There is **no** fund / disburse / vendor-withdraw
  / reorganize / sweep code.
- The bun scripts `04`/`05`/`06` are preprod-targeted stubs (`05-fund-vendor` is
  deliberately non-runnable) and do not point at the live `deployment/preview.json`.
- So the funding-execution endpoints are genuinely unbuilt and must be written.

## Key decisions

1. **Simulate the ratified withdrawal by direct payment.** Preview will never
   ratify the gov action (no DReps vote for a test proposal), so we cannot fund
   the treasury via the real Conway withdrawal. `treasury.ak` ignores the input
   datum (`validators/treasury.ak:32` — "The datum is always ignored"), so we
   seed the treasury by **sending ADA straight to the treasury script address**.
   Reorganize / disburse / fund don't care how the funds arrived. We seed with
   the datum shape a real withdrawal produces, for realism, but it isn't required.

2. **A separate preview *test* deployment with stand-in keys.** The live
   deployment bakes in the *production* topology (real FluidTokens + board pkhs),
   which we cannot sign for. The test deployment mirrors the real permission
   **shape** (`AllOf` / `AtLeast` structure) but uses throwaway keys we hold, so
   every multisig path is actually reachable. This also exercises the multi-key
   witness assembly that CLAUDE.md flags as "not wired yet."

3. **Scala only.** These endpoints are built in the primary scalus pipeline,
   driving the audited validators from `plutus.json` via scalus-cardano-ledger —
   same style as the existing `init`/`register`/`gov` tools. **No bun mirror and
   no parity check** for these endpoints: parity is meaningless for live txs
   whose inputs are UTxOs and wall-clock timestamps (non-deterministic), unlike
   the deterministic gov-publishing artifacts.

4. **Two test deployments** (T_max is a script parameter, so a different T_max is
   a different script hash — two configs is the honest way to get both a relaxed
   window and a reachable expiry):
   - **`preview-test`** — comfortable T_max (≈ +1 year). Runs the operational
     scenarios (reorganize, disburse, fund, vendor-withdraw ×2, pause/resume,
     modify) with no clock pressure.
   - **`preview-test-sweep`** — deliberately short T_max (mint + ≈45 min) **and**
     short vendor grace (≈5 min instead of 30 days). Its only purpose is to reach
     expiry so treasury-sweep and vendor-sweep are testable in one sitting.

5. **Stablecoins are out of scope for this test (explored, deferred).** There is
   no real USDC/USDM on preview — both are mainnet fiat-backed assets whose
   issuers run no preview faucet; DEX testnets (e.g. Minswap) run on preprod with
   no stablecoin liquidity, and Cardano-native USDC (`USDCx`) is a 2026 mainnet
   rollout. A real market swap on preview is therefore not achievable. The
   preview test stays **ADA-only**; the USDC/OTC design remains documented (see
   the CLAUDE.md constraints and the Bifrost design spec) but untested until
   mainnet planning. If revived later, the mechanism is to mint a self-controlled
   `tUSDM` native token (the contracts cannot distinguish it from real USDM) and
   test the two constraint paths: `disburse`'s `equal_plus_min_ada` (no native
   asset retained in the treasury change output) and `sweep`'s ADA-only
   `treasury_donation` (native assets forced to stay at the script).

## Test rig

### Configs
- `Config.previewTest` — Bifrost params with the **stand-in pkhs** and far T_max.
- `Config.previewTestSweep` — same stand-ins, short T_max + short grace.

### Keys (all preview-only, throwaway, gitignored under `keys/test/`)
- **Lantr signer** = the real K_op key (we hold it; it's a preview key with no
  real value). Reused so the "Lantr" leg of every `AllOf` is genuine.
- **FluidTokens stand-in**, **board#1 / board#2 / board#3 stand-ins** — fresh
  ed25519 keys generated for the test.

### Topology (mirrors production shape, test keys)
| Action | Multisig |
|---|---|
| `treasury.reorganize` | K_op alone |
| `treasury.sweep` | 1-of-3 board |
| `treasury.disburse` | AllOf[ Lantr(K_op), FluidTokens*, 1-of-3 board ] |
| `treasury.fund` | 2-of-3 board (+ vendor consent) |
| `vendor.pause` | 1-of-3 board |
| `vendor.resume` | 2-of-3 board |
| `vendor.modify` | 2-of-3 board (+ vendor consent) |
| vendor claim (`withdraw`) | AllOf[ Lantr(K_op), FluidTokens* ] (set at fund time) |

(`*` = stand-in key.)

### Deployment state
- `deployment/preview-test.json`, `deployment/preview-test-sweep.json`
  (gitignored, machine-written, same shape as `deployment/preview.json`).

## New Scala code

A shared plumbing layer plus thin per-endpoint drivers:

- **`TreasuryActions.scala`** — `reorganize`, `disburse`, `fund`, `sweep`. Each:
  load the registry reference UTxO (config datum + NFT), load the treasury
  script, build the correct redeemer (`Reorganize` / `Disburse` / `Fund` /
  `SweepTreasury`), set the validity interval, add required-signers, assemble
  witnesses from the relevant stand-in keys.
- **`VendorActions.scala`** — `withdraw`, `adjudicate` (pause/resume), `modify`,
  `sweep`.
- **`SeedTreasury.scala`** — the direct-payment seeder.
- **`MultiSign.scala`** — the missing piece: accumulate ed25519 witnesses from N
  signers (board subset + vendors) onto one tx.
- CLI wiring so each is a step command, **dry-run by default**, `--submit` to
  broadcast — mirroring the existing tools and the repo convention.

**Research item (do first):** check whether the scalus monorepo
(`/Users/nau/projects/lantr/scalus/`) already ports the SundaeSwap treasury
redeemer/datum types, to reuse rather than hand-roll the Plutus encodings.

**Size note:** this is materially more than init/register/gov — ~4 treasury +
~4 vendor endpoints plus multi-key signing, each needing the correct redeemer
encoding from the blueprint.

## Scenario matrix

Amounts are illustrative and tunable; ADA figures are tADA. Fund the operator
wallet from the preview faucet first (~10k tADA covers seed + fees + refundable
deposits).

### Deployment A — `preview-test` (far T_max)

| # | Scenario | Signers (stand-in) | Action | Expected | Verify |
|---|----------|-------------------|--------|----------|--------|
| 0 | Seed treasury | K_op (own wallet) | Pay **5000** → treasury script addr, 1 UTxO | UTxO at treasury addr | Blockfrost UTxO query |
| 1 | Reorganize | K_op alone | Split 5000 → **2500 + 2500** | 2 treasury UTxOs | 2 UTxOs, sum = 5000 − fee |
| 2 | Disburse | Lantr + FluidTokens + board#1 | Pay **1500** → external test wallet; change → treasury | External +1500; treasury change UTxO | Both addrs; confirms 3-way `AllOf` |
| 3 | Fund vendor | board#1 + board#2 + vendor(Lantr+FT) | Spend a 2500 UTxO → vendor UTxO, schedule **M0=800 @ now, M1=700 @ now+20m**; change 1000 → treasury | Vendor UTxO 1500 w/ 2-entry datum | Vendor addr UTxO + datum decode |
| 4 | Vendor-withdraw (matured) | Lantr + FluidTokens (2-of-2) | Claim **M0=800** → vendor destination; 700 stays | Destination +800; vendor UTxO now 700 | Both; confirms maturation-open path |
| 5 | Vendor-withdraw (immature) ⛔ | Lantr + FluidTokens | Attempt to claim M1=700 **before** now+20m | **Tx rejected on-chain** (maturation gate) | Submit fails / phase-2 script error |
| 6 | Pause → Resume | pause: board#1 · resume: board#1+#2 | Adjudicate vendor UTxO paused, then resumed | Datum flips paused↔active | Datum decode before/after |
| 7 | Modify schedule | board#1 + board#2 + vendor | Change M1 → **500 @ now+5m** | Vendor datum updated | Datum decode; confirms board+vendor combo |
| 8 | Vendor-withdraw M1 (after wait) | Lantr + FluidTokens | After M1 matures, claim it | Destination gets M1 | Closes the vendor happy-path |

### Deployment B — `preview-test-sweep` (short T_max + short grace)

| # | Scenario | Signers | Action | Expected | Verify |
|---|----------|---------|--------|----------|--------|
| 9 | Seed + fund minimal | K_op / board+vendor | Seed ~1500, fund a vendor UTxO with an **unmatured** milestone | State in place before expiry | UTxOs present |
| 10 | Treasury sweep (post-expiry) | board#1 (1-of-3) | After T_max: sweep leftover treasury ADA → Cardano Treasury (`treasury_donation`) | Treasury UTxO consumed, donation in tx | Tx body shows donation; confirms contingency-refund path |
| 11 | Vendor sweep (post-expiry+grace) | board | After T_max + short grace: reclaim unmatured vendor funds | Vendor addr emptied | Vendor addr UTxO gone |

## Verification (cross-cutting)

- Every step is **dry-run by default**; inspect the built tx (CBOR size, in/out,
  redeemer, signers) before `--submit`.
- After each submit: confirm on Blockfrost (tx hash, resulting UTxOs, datum
  decode) and record the hash into the deployment JSON.
- Negative tests (#5) assert the **failure** is the expected phase-2 script
  rejection, not a build-time error.
- A short journal entry captures the whole run (deployment hashes, all tx hashes,
  pass/fail) as the mainnet go/no-go record.

## Out of scope / deferred

- Real FluidTokens/board keys; FluidTokens proof-of-control (mainnet gate).
- Stablecoin / USDC-OTC swap (see decision 5) — documented, untested here.
- Mainnet submission of anything.
- bun mirror or parity for the funding-execution endpoints.
