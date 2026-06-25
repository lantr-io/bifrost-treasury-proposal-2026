# Scalus Treasury Withdrawal — 2026 Resubmission (Design)

**Date:** 2026-06-25
**Status:** Design — approved decisions captured; awaiting spec review before plan.
**Scope owner:** Alexander Nemish (Lantr Engineering)

## 1. Background

The repo contains the previously submitted **and now expired** Scalus Treasury
Withdrawal proposal (the ₳8,503,000 / 12-month "application platform" proposal).
Its mainnet governance action (`e0900fdd…`) was submitted but the proposal
expired without ratification, so its 100,000-ADA deposit was refunded to the
admin stake account.

Lantr has authored a **reduced resubmission** on HackMD
(`https://hackmd.io/@lantr/scalus2026-2`):

- **Title:** "Scalus 2026: Maintenance, Dijkstra Readiness & Application Runtime"
- **Ask:** **₳2,991,667** (~$448,750 @ $0.15/ADA), **9 months**, **no contingency**
- **Milestones:** M1 (Q3 2026), M2 (Q4 2026), M3 (Q1 2027)
- **Annexes:** 3 (Annex 1 Detailed Scope; Annex 2 Competitive Landscape;
  Annex 3 2025 Retrospective). The prior proposal had 4 annexes.
- **Scope removed vs prior:** standalone L1 node, full L2 integration, broad
  formal verification, third-party (Blaster/L2) critical-path dependencies.

This design covers preparing that resubmission's on-chain artifacts and a
ready-to-run execution runbook. **Mainnet execution is explicitly deferred.**

## 2. Goal & non-goals

**Goal:** Produce repo-ready artifacts for the new proposal — synced & split
proposal text, a valid CIP-108 anchor, updated parameters for a **fresh**
on-chain deployment, and a dry-run gov-action summary — plus a documented
runbook for the testnet rehearsal and the (deferred) mainnet submission.

**Non-goals (this effort):**

- **No mainnet transactions of any kind** (no recover-deposit, init, register,
  or gov-action submission on mainnet).
- No contract code changes (we parameterize SundaeSwap's audited contracts).
- No key generation — reuse existing admin + board keys.
- No milestone funding / vendor withdrawal (post-ratification work).
- No new PDF generation or IPFS re-pinning — reuse already-published PDFs.

## 3. Key decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Deployment | **Fresh** — new registry mint + register scripts (reusing admin + board keys) |
| Treasury expiration (T_max) | **2027-07-01T00:00:00Z**; vendor expiry = T_max + 30d = 2027-07-31 |
| Amount | **2,991,667,000,000 lovelace** (₳2,991,667, from Budget table) |
| Rehearsal | **Preview/preprod first**, then mainnet (mainnet deferred) |
| Signing/submit | **Blaze auto-submit** via existing `01/02/03 --submit` (admin.skey + board keys on disk) |
| 100k deposit funding | **Recover the expired prior deposit first** (mainnet — deferred) |
| Annex/proposal PDFs | **Reuse existing IPFS CIDs** as placeholders "for now" |
| Mainnet | **Deferred** — runbook only, not executed |

## 4. Why a fresh deployment

Treasury/vendor **script hashes are parameterized** by board pkhs +
`treasuryExpirationMs` + grace days (see `params/common.ts` →
`resolveConfig`). The amount is *not* a script parameter. Reusing the existing
mainnet deployment would force keeping the old `2027-10-01` expiration; the
user chose a fresh deployment with the new `2027-07-01` T_max aligned to the
9-month window. Board keys and admin keys are unchanged, so a fresh mint reuses
all existing keys — only `treasuryExpirationISO` (and amount, non-hash) change.

## 5. Pipeline-script fixes

The new proposal's heading structure breaks the current scripts (which are in
fact already stale against the committed `docs/proposal.md`). Required edits:

### 5.1 `scripts/extract-pieces.ts`
- Parent heading: `## Attached documents` → **`## Reference documents (IPFS)`**.
- Supporting-links matcher: `### Supporting links` (L3) → **`## Supporting links`** (L2).
- Annex detection (`### Annex N:`) unchanged — finds the 3 annexes correctly.
- Output: `docs/proposal-main.md` + `docs/annex-{1,2,3}.md`.

### 5.2 `scripts/build-anchor.ts`
- Motivation headings: `"The Gap: The Assembly Problem"` no longer exists.
  Remap `motivationHeadings` to new Motivation subsections — proposed:
  - `"The Application Layer Decides the Next Chapter"`
  - `"What Scalus is today"`
  - `"The next step: protect, deepen, expand"`
  (final selection is a curation choice — confirm in review.)
- Drop `requirePin("annex4")` (only 3 annexes now). Keep requirePin for
  `proposal`, `annex1`, `annex2`, `annex3`.
- `## Rationale` / `## Abstract` / `## Supporting links` matchers unchanged.

### 5.3 `scripts/lib/pinned.ts`
- Roles `proposal, annex1, annex2, annex3, anchor` stay valid. `annex4` becomes
  unused (leave the type member; stop requiring it).

## 6. Params update

### 6.1 `params/mainnet.ts`
```ts
amountLovelace:            2_991_667_000_000n,        // ₳2,991,667 (Budget table)
treasuryExpirationISO:     "2027-07-01T00:00:00Z",    // T_max, 9-month window
vendorExpirationGraceDays: 30,                         // vendor expiry 2027-07-31
// adminAddress + boardPkhs: unchanged (reuse keys)
```
Update `params/mainnet.test.ts` expectations accordingly.

### 6.2 `params/preprod.ts` / `params/preview.ts`
Mirror the new `amountLovelace` + `treasuryExpirationISO` so the rehearsal
exercises the real production values. Update their `*.test.ts` as needed.

## 7. Content / IPFS artifacts (reuse existing CIDs)

No PDF generation, no re-pinning. Reuse the existing CIDs from `gov/pinned.json`,
**content-matched** to the new annex titles:

| New reference | Existing CID | Old role |
|---|---|---|
| Full proposal | `QmcCjBYA8zrx5Khqbh6xraXQ23zrgaZxuzNewr1Ni6fck7` | proposal ⚠️ old 8.5M PDF — rough placeholder |
| Annex 1: Detailed Scope and Workstreams | `QmQ6RiAPBZfuRqSh2bCS1HBBxSUoVoGob55bM43vimHxfJ` | annex1 (title matches; content changed) |
| Annex 2: Competitive Landscape | `QmSEhgYGnfVHmc432P7cZmWq2ocNrS1FhTsz3GqY2zJv84` | annex3 (content-matched) |
| Annex 3: 2025 Retrospective | `QmaVmFXvbFnS5vjVtb9uuQugDU8tbqiWCe2QrZijbMCP6r` | annex4 (content-matched) |

Steps:
1. Sync `docs/proposal.md` from `https://hackmd.io/@lantr/scalus2026-2/download`.
2. Locally patch the `## Supporting links` list: replace the `IPFS, PDF`
   placeholders with `* <label>: https://ipfs.io/ipfs/<cid>` lines using the
   CIDs above. (HackMD is the one-way canonical source; the next sync
   overwrites this — also update HackMD so it stays in sync.)
3. Update `gov/pinned.json` role→CID entries to match the table.
4. `build-anchor` parses those URLs into `body.references[]`; `requirePin()`
   confirms each role is present.

**Placeholder flag:** these PDFs are content-stale (especially the full-proposal
PDF). They MUST be replaced with freshly exported/pinned PDFs of the new
proposal before any mainnet submission. Tracked as an open item.

The **anchor JSON itself** still needs a fresh pin (anchor role) to give the
gov action a resolvable `ipfs://<cid>` URL — but only when we actually run the
testnet rehearsal (requires `PINATA_JWT` and/or `BLOCKFROST_IPFS_PROJECT_ID`).

## 8. Artifact build sequence (no chain writes)

1. `curl … scalus2026-2/download -o docs/proposal.md`
2. Patch Supporting-links URLs (§7); update `gov/pinned.json`.
3. `bun run extract-pieces` → `proposal-main.md` + `annex-{1,2,3}.md`.
4. Apply script fixes (§5) and params (§6); `bun test` + `bun run typecheck`.
5. `bun run build-anchor -- --network preview` (and `--network mainnet` to
   produce `gov/anchor.mainnet.json`) — validates against the CIP-108 schema.
6. `bun run sign-anchor gov/anchor.<net>.json` — fills `authors[].witness`.
7. `NETWORK=mainnet bun run gov` (no `--submit`) → `gov/mainnet-withdrawal.json`
   dry-run summary + the equivalent `cardano-cli` command, anchor hash, amount,
   treasury reward account, deposit-return address.

## 9. Runbook (NOT executed in this effort)

### 9.1 Testnet rehearsal (preview) — optional, allowed
- Fund: recover preview deposits via `recover-deposits --network preview --submit`.
- `bun run init` → `bun run register` → pin anchor → `bun run gov --submit`.
- Verify the action lands and parses (Koios `/proposal_list` `meta_json`).

### 9.2 Mainnet — DEFERRED, do not run yet
1. Replace placeholder PDFs with real exports; re-pin; update URLs + pinned.json.
2. `recover-deposits --network mainnet --submit` (reclaim ~100k ADA; delegates
   to a DRep first if needed).
3. `NETWORK=mainnet bun run init --submit` (mint registry NFT).
4. `NETWORK=mainnet bun run register --submit` (register treasury + vendor +
   admin stake creds; needs board keys for the multisig where applicable).
5. Re-pin the final mainnet anchor; `NETWORK=mainnet bun run gov --submit`.
6. Verify via Koios; record txs in `deployment/mainnet.json` + `journal/`.

## 10. Risks / open items

- **Placeholder PDFs** (§7) are content-stale — must be replaced before mainnet.
  The full-proposal PDF in particular is the old 8.5M document.
- **HackMD ↔ repo drift:** local Supporting-links patch is overwritten on the
  next HackMD sync. Update HackMD with the real URLs to converge.
- **Motivation curation** (§5.2): confirm which Motivation subsections feed the
  anchor's `motivation` field.
- **Anchor pinning creds** needed for the rehearsal anchor pin.
- **Gov-action lifetime** on testnets is short (preprod ~6 epochs); fine for a
  rehearsal that only checks submission/parse, not ratification.
- Mainnet `gov_action_deposit` = 100,000 ADA; verify live before submission.

## 11. Acceptance (this effort)

- New proposal synced, split into `proposal-main.md` + `annex-{1,2,3}.md`.
- Scripts updated; `bun test` + `bun run typecheck` pass.
- `gov/anchor.mainnet.json` builds, schema-validates, and signs.
- `gov/mainnet-withdrawal.json` dry-run shows amount 2,991,667,000,000,
  anchor hash, and the fresh treasury reward account.
- Mainnet runbook documented; **no mainnet tx executed.**
