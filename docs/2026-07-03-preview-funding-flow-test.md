# Preview funding-flow test — full run (2026-07-03)

End-to-end live test of the Bifrost treasury **funding-execution** flow on
Cardano **preview**, driven entirely by the primary scalus pipeline
(`treasury-publish/`). Spec: `docs/superpowers/specs/2026-07-03-preview-funding-flow-test-design.md`.

**Result: all 11 scenarios pass.** Every treasury/vendor spend phase-2 evaluated
on-chain; multi-key witness assembly (the CLAUDE.md "not wired yet" gap) works.

## Test rig

Two isolated deployments on the preview network, real K_op operator
(`keys/admin.*`) + throwaway stand-in signers (`keys/test/*`) so every multisig
path is signable:

- FluidTokens (stand-in) `bc00dfa6e47e726ce1fc5f1a8867352d584ceee3b5d383ae5f24f474`
- board1 `25249f04490da3aacb7957a19025914f2a44f8512724947b86c7483e`
- board2 `01af8ae80f7216323397201e46198919aeed40f133537d1b5368e01f`
- board3 `48429d3937af58892bbeeac0a7b5fe8e7805a076a38ea867218a967a`

**`preview-test`** (far T_max) — treasury `4cebca1462a4778b09692331eee4fd1481300786319437210a56aa6b`,
vendor `91189527766146afeb7933ab925a31d6519f954a9f168b5d05b9068b`,
registry policy `17138e8f0470fb40e6aec3e1fff1570a5bd9d5510dc09c67b4818c77`.

**`preview-test-sweep`** (T_max 2026-07-03T11:40:00Z, grace 0) — treasury
`96d1ca179a7a8eb67c9bad2712934dc96f1628d2335856e7e2cfd526`, vendor
`201823179a70418dc407d82b43c805a8857183da92724bf8814b63cf`, registry
`1d2c114e8381ff3802ac076d5bf6226a8ba12cb735abb89139c1757b`.

Treasury funded by direct payment to the script address (Void datum) — simulates
a ratified Cardano-treasury withdrawal, which preview never ratifies.
`treasury.ak` ignores the input datum, so the spends succeed regardless.

## Scenarios (all live on preview)

`preview-test`:

| # | Scenario | Multisig | Tx |
|---|----------|----------|----|
| — | init registry | K_op | `bc39908b…` |
| 0 | seed 5000 | K_op pay | `6409f1a8…` |
| 1 | reorganize 2500+2500 | K_op alone | `078fca82…` |
| 2 | disburse 1500 | AllOf[Lantr, FluidTokens, 1-of-3 board] | `7dfcc76a…` |
| 3 | fund vendor (M0 800 + M1 700) | 2-of-3 board + vendor consent | `ed3eacce…` |
| 4 | vendor-withdraw matured M0 | AllOf[Lantr, FluidTokens] | `6019e049…` |
| 5 | **immature withdraw → REJECTED** (`--force-all`) | — | phase-2 eval failure (no tx) |
| 6a | pause | board 1-of-3 | `8911562a…` |
| 6b | resume | board 2-of-3 | `d1f89cd1…` |
| 7 | modify (700→500, 200→treasury) | 2-of-3 board + vendor | `48b324dd…` |
| 8 | vendor-withdraw M1' (500) | AllOf[Lantr, FluidTokens] | `e19b6e1d…` |
| 10 | **treasury sweep → Cardano Treasury** (donate 1000) | board 1-of-3 (early) | `d1085c78…` |

`preview-test-sweep`:

| # | Scenario | Multisig | Tx |
|---|----------|----------|----|
| — | init registry | K_op | `b2c8bd1b…` |
| 9 | seed 400 + fund (300@2, 80@12) | board2 + vendor | `d139fc4b…` / `f44d6d47…` |
| — | pause the 80 payout | board 1-of-3 | `0f24fa1c…` |
| 11 | **vendor sweep → treasury** (paused 80 reclaimed) | permissionless (after expiry) | `45b0a113…` |

## What this proves for mainnet

- Full money-out path works: withdrawal→treasury (simulated) → disburse to
  arbitrary destination + fund the vendor contract with a milestone schedule →
  vendor claims matured payouts.
- The maturation gate rejects premature vendor claims (#5).
- Board dispute controls (pause/resume) and schedule modification work with the
  real AllOf/AtLeast multisig shapes.
- **Contingency return works both ways**: treasury sweep donates ADA to the
  Cardano Treasury (Conway `treasury_donation`); vendor sweep reclaims
  paused/unmatured funds back to the treasury contract after expiry.

## Lessons (cost real time)

- **scalus `TxBuilder` has no `treasury_donation` step.** Treasury sweep assembles
  the context, injects `donation` onto the body BEFORE `balanceContext` (the sweep
  script asserts `Some(donation)`, evaluated before any diff handler), then
  balances with the standard change handler. See `TreasuryActions.sweepTreasury`.
- **A single-UTxO wallet can't run a script tx** — the one UTxO is consumed as an
  input, leaving nothing for collateral (`NoCollateralInputs`). `splitWallet`
  first. (scalus init never hit this before — prod preview init ran via bun.)
- **`validFrom` must sit at/behind the chain tip**, which lags wall-clock by a
  block — else `OutsideValidityInterval`. Vendor actions use `now − 90s`.
- **`validTo` must stay within the node's slot→time forecast horizon (~7h)** and,
  for before-expiry actions, strictly below the treasury expiration.
- **After-expiry txs need the chain TIP past T_max, not wall-clock** — the tip
  lags ~1 block, so poll the tip slot before submitting sweeps.
- **You can't pause an already-matured active payout** (`adjudicate.ak`): matured
  active funds belong to the vendor. Pause while the payout is still unmatured.
- **Treasury sweep allows EITHER after-expiry OR the sweep multisig** — so it was
  testable early on `preview-test` with board authority, no expiry wait. Vendor
  sweep strictly requires after-expiry.

## Deferred (unchanged)

Real FluidTokens/board keys + proof-of-control (mainnet gate); USDC/OTC swap (no
real stablecoin exists on preview — a self-minted native token would exercise the
same contract paths); mainnet submission.
