# Mainnet submission plan — Bifrost Phase 1 treasury withdrawal

**Status:** plan (not executed). Mainnet is real ADA + irreversible actions —
every `--submit` is gated on explicit human go/no-go.

Scope: the `init → register → gov` path on **mainnet** (mint registry NFT →
register stake creds → submit the `treasuryWithdrawal` governance action).
Post-ratification funding (`fund`/`disburse`/`vendor-withdraw`) stays deferred.

## What's already settled (verified this session)

- **Config parity**: `Config.mainnet` (scala) ⇄ `params/mainnet.ts` (bun) —
  same board pkhs, FluidTokens pkh `1c471b31…`, K_op key, amount
  **₳12,332,031**, **T_max 2027-07-31**, vendor grace +30d (= 2027-08-30). Only
  the address differs (mainnet header: `addr1qx0dmpg…`, same K_op pkh
  `9edd850b…`). `ParitySuite` asserts mainnet script hashes match the oracle.
- **Board keys** cross-checked byte-identical against `scalus-treasury`
  (Benkort/CF, Gianelloni/Blink, Kilgore/IOG; recorded 2026-05-13).
- **Anchor is network-independent**: `build-anchor` ignores network for the
  body; the mainnet anchor `{@context, body}` is byte-identical to the
  preview one (body hash `22a9ed01…`). ⇒ **Lantr + FluidTokens witnesses from
  the preview anchor are valid on mainnet unchanged — no re-signing, no FT
  round-trip.** Same anchor bytes ⇒ same CID (`QmZwHmFo…`).
- **Proof-of-control (FluidTokens)**: already obtained — their preview witness
  is a real signature from the key behind vendor pkh `1c471b31…`. Satisfies the
  "obtain proof-of-control before the immutable mint" requirement.
- **Rehearsal**: full `init → register → gov` exercised on preview; funding-flow
  (fund/disburse/vendor/sweep) exercised on preview.

## Prerequisites / blockers (clear ALL before any mainnet tx)

1. **Mainnet Blockfrost project id** in `.env` — `BLOCKFROST_PROJECT_ID` must be
   the `mainnet…` key (currently preview-scoped). `Chain.loadBlockfrostKey`
   rejects a network-prefix mismatch, so this fails safe.
2. **K_op mainnet wallet funded** at `addr1qx0dmpg…`:
   - **~100,000 ADA** gov-action deposit (refundable to K_op stake on
     ratification/expiry).
   - + fees + collateral (~a few ADA) + a seed UTxO for `init`.
   - Held as **≥2–3 ada-only UTxOs** (collateral needs a pure-ADA UTxO; the
     preview run needed `splitWallet` for exactly this). No native assets in the
     fee/collateral UTxOs.
3. **Live mainnet gov params** (read at submit, but confirm ahead): 
   `gov_action_deposit == 100,000 ADA`, and note `gov_action_lifetime` (epochs)
   for the voting window.
4. **Mainnet constitution guardrails script hash** verified LIVE
   (`cardano-cli conway query constitution --mainnet`). Plan assumes
   `fa24fb30…` (genesis default) but this MUST be confirmed against the enacted
   mainnet constitution — a wrong hash is a hard ledger reject
   (`InvalidGuardrailsScriptHash`). Update `BuildGovAction.GuardrailsScriptHash`
   if it differs (and mirror in bun `03`).
5. **Go/no-go authority**: who signs off on the ₳12,332,031 ask + 100k deposit
   spend, and confirms all identities/dates one final time.

## Execution sequence

Each step is dry-run first (default), then `--submit` only after go/no-go.

0. **(optional) Preprod dress rehearsal of the 100k-deposit path.** Preprod's
   `gov_action_deposit` is also 100,000 tADA — the one part preview (1,000)
   didn't exercise. A full preprod `init → register → gov` shakes out the
   large-deposit coin-selection + collateral before real ADA is at stake.
1. **Anchor (reuse).** `build-anchor --network mainnet` → copy the two existing
   witnesses from the preview anchor (body hash identical) → verify both with
   `insert-witness` semantics (sig over `22a9ed01…`, FT pkh `1c471b31…`) →
   confirm CID `QmZwHmFo…` (already pinned) is in `gov/pinned.json`.
2. **`init --network mainnet --submit`** — mint the one-shot registry NFT +
   publish registry datum. **IMMUTABLE**: bakes in all pkhs + T_max. Writes
   `deployment/mainnet.json`. Needs K_op sig + a seed UTxO.
3. **`register --network mainnet --submit`** — register treasury + vendor stake
   credentials (vote-delegated AlwaysAbstain per constitution) + K_op's personal
   stake key (so the 100k deposit refund lands in a usable reward account).
4. **`gov --network mainnet`** (dry-run) — verify: anchor url `ipfs://QmZwHmFo…`
   + hash `f95bd746…`, amount ₳12,332,031, withdraw-to = mainnet treasury reward
   account, guardrails hash, deposit == live 100,000 ADA, return address = K_op
   mainnet stake.
5. **`gov --network mainnet --submit`** — broadcast the `treasuryWithdrawal`.
   100k deposit paid from K_op.
6. **Verify on-chain** — Koios/Blockfrost mainnet `proposal_list` (`meta_url` /
   `meta_hash`), anchor retrievable at the gateway, hash matches; capture the
   `gov_action` id and tx hash.
7. **Record in `journal/`** — this is a MAINNET money/authority trail
   (submission, deposit, key usage) → `journal/`, not `docs/`.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Wrong guardrails hash → reject | Query live mainnet constitution before submit (prereq 4). |
| Deposit ≠ 100k → reject | Tool reads deposit live from protocol params; dry-run shows it. |
| No collateral / single UTxO → build fails | Fund as ≥2–3 ada-only UTxOs; `splitWallet` if needed. |
| Immutable mint with a wrong param | Params triple-verified (keys/dates/amount this session); parity tests; dry-run each step. |
| Anchor "invalid metadata" on explorers | Already CIP-100/108 compliant (authors + witnesses + schema); Koios is the source of truth. |
| Submitting too close to T_max 2027-07-31 | Submit with runway for the full voting lifetime + a buffer. |
| Accidental mainnet dispatch | `--network mainnet` is explicit; bun `select.ts` never auto-routes to mainnet. Keep it deliberate. |

## Open decisions (need input)

- **Deposit funding**: is the mainnet K_op wallet funded with ~100k ADA, or does
  that need arranging (and from where)?
- **Preprod rehearsal**: run the 100k-deposit `init→register→gov` on preprod
  first, or go straight to mainnet on the strength of the preview rehearsal?
- **Timing**: target submission date, given T_max 2027-07-31 and the voting
  window?

## Explicitly NOT in this plan

- No contract changes. No config changes (mainnet params already final).
- No funding execution (fund/disburse/vendor-withdraw) — deferred.
- No USDC/OTC conversion — deferred.
