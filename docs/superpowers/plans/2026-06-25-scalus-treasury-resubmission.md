# Scalus Treasury Withdrawal 2026 Resubmission — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare repo-ready artifacts (split proposal, fixed pipeline scripts, updated params, built+signed anchor, dry-run gov action) for the reduced ₳2,991,667 / 9-month Scalus 2026 resubmission, and execute a full end-to-end rehearsal on the **preview** testnet — with **no mainnet transactions**.

**Architecture:** This repo parameterizes SundaeSwap's audited `treasury-funds` contracts and drives them with bun/TypeScript scripts. The proposal text (`docs/proposal.md`, synced one-way from HackMD) is split into pinnable pieces, hashed into a CIP-108 anchor, and referenced from a Conway `treasury_withdrawals_action`. We change parameters (amount, expiration), realign three scripts to the new proposal's headings, reuse already-published IPFS PDFs as placeholder references, and rehearse on preview. Treasury/vendor script hashes are parameterized by board pkhs + treasury expiration, so the new expiration forces a fresh testnet deployment (reusing existing keys).

**Tech Stack:** bun, TypeScript, `@blaze-cardano/*`, `@sundaeswap/treasury-funds`, libsodium-wrappers-sumo, jsonld, Blockfrost; scala-cli for `recover-deposits`. Run everything inside `nix develop` (provides bun + secrets from `.env`).

## Global Constraints

- **No mainnet transactions.** Every on-chain action in this effort targets **preview** only. The mainnet runbook (spec §9.2) is documented, not executed.
- **Reuse existing keys** — no `gen-keys`. Admin + board keys already on disk.
- **Amount:** `2_991_667_000_000n` lovelace (₳2,991,667), verbatim from the proposal Budget table.
- **Treasury expiration (T_max):** `"2027-07-01T00:00:00Z"`; `vendorExpirationGraceDays: 30` → vendor expiry 2027-07-31.
- **Motivation anchor field:** sourced from the single section `"The Application Layer Decides the Next Chapter"`.
- **Annex/proposal references:** reuse existing IPFS CIDs (content-matched), placeholders until real PDFs are produced before any mainnet submission.
- **Never hand-edit** `deployment/*.json` or `keys/*` (machine-written). `docs/proposal-main.md` + `docs/annex-*.md` are derived — never hand-edit.
- **Commit style:** conventional (`feat:`/`fix:`/`docs:`/`chore:`). **Never** add a `Co-Authored-By: Claude` trailer.
- Scripts default to dry-run; submission needs explicit `--submit`.

### Content-matched CID reuse (from spec §7)

| New reference (label in Supporting links) | CID | `gov/pinned.json` role |
|---|---|---|
| Full proposal | `QmcCjBYA8zrx5Khqbh6xraXQ23zrgaZxuzNewr1Ni6fck7` | `proposal` (⚠️ old 8.5M PDF — placeholder) |
| Annex 1: Detailed Scope and Workstreams | `QmQ6RiAPBZfuRqSh2bCS1HBBxSUoVoGob55bM43vimHxfJ` | `annex1` |
| Annex 2: Competitive Landscape | `QmSEhgYGnfVHmc432P7cZmWq2ocNrS1FhTsz3GqY2zJv84` | `annex2` |
| Annex 3: 2025 Retrospective | `QmaVmFXvbFnS5vjVtb9uuQugDU8tbqiWCe2QrZijbMCP6r` | `annex3` |

---

## File Structure

- `params/mainnet.ts` — mainnet RawConfig (amount + T_max change). MODIFY.
- `params/mainnet.test.ts` — assertions for the above. MODIFY.
- `params/preprod.ts` — preprod RawConfig (amount + T_max change); `preview.ts` inherits via spread. MODIFY.
- `params/preprod.test.ts` — assertions for the above. MODIFY.
- `scripts/extract-pieces.ts` — heading realignment. MODIFY.
- `scripts/build-anchor.ts` — motivation heading + drop annex4 pin. MODIFY.
- `docs/proposal.md` — synced from HackMD, Supporting-links URLs patched. OVERWRITE (synced).
- `gov/pinned.json` — role→CID reuse. MODIFY.
- `docs/proposal-main.md`, `docs/annex-{1,2,3}.md` — derived by extract-pieces. GENERATED.
- `gov/anchor.preview.json`, `gov/anchor.mainnet.json` — built+signed anchors. GENERATED.
- `gov/preview-withdrawal.json`, `gov/mainnet-withdrawal.json` — dry-run summaries. GENERATED.
- `deployment/preview.json` — rewritten by the preview rehearsal (init/register/gov). GENERATED (do not hand-edit).

---

## Task 1: Update parameters (amount + expiration)

**Files:**
- Modify: `params/mainnet.ts:30-32`
- Modify: `params/mainnet.test.ts:23-29`
- Modify: `params/preprod.ts:50-52` (+ doc comment `params/preprod.ts:8-40`)
- Modify: `params/preprod.test.ts:9-14`

**Interfaces:**
- Consumes: nothing.
- Produces: `mainnetRawConfig()` and `preprodRawConfig`/`previewRawConfig` with `amountLovelace = 2_991_667_000_000n`, `treasuryExpirationISO = "2027-07-01T00:00:00Z"`. Consumed by `resolveConfig` (params/common.ts) and scripts 01/02/03.

- [ ] **Step 1: Update the mainnet-test assertions to the new values (failing test first)**

In `params/mainnet.test.ts`, replace the amount + T_max tests:

```ts
  test("withdrawal amount matches the proposal total (₳2,991,667)", () => {
    expect(raw.amountLovelace).toBe(2_991_667_000_000n);
  });

  test("T_max = 2027-07-01 (9-month delivery July 2026 - Q1 2027, lean buffer, no contingency)", () => {
    expect(raw.treasuryExpirationISO).toBe("2027-07-01T00:00:00Z");
  });
```

- [ ] **Step 2: Update the preprod-test assertions**

In `params/preprod.test.ts`, replace the amount + expiration tests:

```ts
    expect(preprodRawConfig.amountLovelace).toBe(2_991_667_000_000n);
```

```ts
  test("treasury expires 2027-07-01 (9-month delivery July 2026 - Q1 2027)", () => {
    expect(preprodRawConfig.treasuryExpirationISO).toBe("2027-07-01T00:00:00Z");
  });
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `bun test params/mainnet.test.ts params/preprod.test.ts`
Expected: FAIL — `expect(8_503_000_000_000n).toBe(2_991_667_000_000n)` and the date assertions mismatch.

- [ ] **Step 4: Update `params/mainnet.ts`**

Replace the three fields (lines 30-32) with:

```ts
    amountLovelace: 2_991_667_000_000n, // ₳2,991,667 — reduced resubmission, no contingency, per HackMD scalus2026-2 Budget
    treasuryExpirationISO: "2027-07-01T00:00:00Z", // T_max = 9-month delivery (July 2026 — Q1 2027) + lean buffer (covers Q2 2027 audit report)
    vendorExpirationGraceDays: 30, // vendor expiry = T_max + 30d (= 2027-07-31)
```

- [ ] **Step 5: Update `params/preprod.ts`**

Replace the amount + expiration fields (lines 50-51):

```ts
  amountLovelace: 2_991_667_000_000n,
  treasuryExpirationISO: "2027-07-01T00:00:00Z",
```

Update the doc comment block at the top (lines 11-17) so the stated `amount`/`T_max` match (change `₳8,503,000` → `₳2,991,667`, `2027-10-01` → `2027-07-01`, `2027-10-31` → `2027-07-31`, and the "12-month … + 3-month contingency" wording → "9-month delivery (July 2026 — Q1 2027), lean buffer, no contingency").

- [ ] **Step 6: Run tests to verify they pass**

Run: `bun test params/`
Expected: PASS (all params tests, including `common.test.ts` which is unchanged — it uses its own fixture values).

- [ ] **Step 7: Typecheck**

Run: `bun run typecheck`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add params/mainnet.ts params/mainnet.test.ts params/preprod.ts params/preprod.test.ts
git commit -m "feat(params): reduced 2026 resubmission — ₳2,991,667, T_max 2027-07-01"
```

---

## Task 2: Realign `extract-pieces.ts` to the new headings

**Files:**
- Modify: `scripts/extract-pieces.ts:100-109`

**Interfaces:**
- Consumes: `docs/proposal.md` headings `## Reference documents (IPFS)` and `## Supporting links` (L2), `### Annex N:`.
- Produces: writes `docs/proposal-main.md` + `docs/annex-{1,2,3}.md`. No exported symbols.

Context: the current script looks for `## Attached documents` and `### Supporting links` (L3), neither of which exists in the new (or current committed) proposal. The annex detection (`### Annex N:`) already matches.

- [ ] **Step 1: Update the two heading matchers**

In `scripts/extract-pieces.ts`, change the `attachedIdx` and `supportingIdx` lookups (lines 100-109) to:

```ts
  const attachedIdx = findRequiredHeading(
    lines,
    /^## Reference documents \(IPFS\)/,
    '"## Reference documents (IPFS)"',
  );
  const supportingIdx = findRequiredHeading(
    lines,
    /^## Supporting links/,
    '"## Supporting links"',
  );
```

- [ ] **Step 2: Verify against the current committed proposal (smoke test, pre-sync)**

Run: `bun scripts/extract-pieces.ts`
Expected: prints `Wrote docs/proposal-main.md …` and `Wrote docs/annex-1.md … "Detailed Scope and Workstreams"` / `annex-2` / `annex-3` with no "heading not found" error. (This runs against the *current* committed proposal.md, which already uses the new heading names — proving the matchers are right. The generated files are overwritten again in Task 5 after the HackMD sync.)

- [ ] **Step 3: Restore the derived files to avoid committing a stale split**

The generated files now reflect the *old* committed proposal; discard them so only the script change is committed here:

Run: `git checkout -- docs/proposal-main.md docs/annex-1.md docs/annex-2.md docs/annex-3.md`
Expected: working tree shows only `scripts/extract-pieces.ts` modified.

- [ ] **Step 4: Commit**

```bash
git add scripts/extract-pieces.ts
git commit -m "fix(extract-pieces): match '## Reference documents (IPFS)' + L2 '## Supporting links'"
```

---

## Task 3: Realign `build-anchor.ts` (motivation + annex4)

**Files:**
- Modify: `scripts/build-anchor.ts:120-126` (motivation headings)
- Modify: `scripts/build-anchor.ts:179-183` (requirePin calls)

**Interfaces:**
- Consumes: `docs/proposal.md` sections `Abstract`, `The Application Layer Decides the Next Chapter`, `Rationale`, `Supporting links`; `gov/pinned.json` roles `proposal`,`annex1`,`annex2`,`annex3`.
- Produces: `gov/anchor.<network>.json`. No exported symbols.

- [ ] **Step 1: Reduce motivation to the single confirmed section**

In `scripts/build-anchor.ts`, replace the `motivationHeadings` array (lines 120-123) with:

```ts
  const motivationHeadings = [
    "The Application Layer Decides the Next Chapter",
  ];
```

(Leave the `.map(...).join("\n\n")` that follows — it works with one element.)

- [ ] **Step 2: Drop the annex4 pin requirement**

In `scripts/build-anchor.ts`, remove the `requirePin("annex4");` line (line 183), keeping `proposal`, `annex1`, `annex2`, `annex3`.

- [ ] **Step 3: Verify it builds against the current committed proposal (smoke test)**

This needs the pinned roles present. `gov/pinned.json` currently has `proposal`/`annex1`/`annex2`/`annex3`/`annex4`, so `requirePin` passes for the four we keep.

Run: `bun scripts/build-anchor.ts --network preview`
Expected: `Wrote gov/anchor.preview.json (… KB, schema-valid)`. No "Section not found: The Gap…" error.

- [ ] **Step 4: Restore the generated anchor (rebuilt properly in Task 6)**

Run: `git checkout -- gov/anchor.preview.json`
Expected: working tree shows only `scripts/build-anchor.ts` modified.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-anchor.ts
git commit -m "fix(build-anchor): motivation from single section; drop annex4 pin"
```

---

## Task 4: Sync the new proposal + reuse existing CIDs

**Files:**
- Overwrite (synced): `docs/proposal.md`
- Modify: `gov/pinned.json`

**Interfaces:**
- Consumes: HackMD download; CID table (Global Constraints).
- Produces: `docs/proposal.md` whose `## Supporting links` carries real `https://ipfs.io/ipfs/<cid>` URLs; `gov/pinned.json` with content-matched roles.

- [ ] **Step 1: Sync the proposal from HackMD**

Run: `curl -sL https://hackmd.io/@lantr/scalus2026-2/download -o docs/proposal.md`
Then verify the title: `head -1 docs/proposal.md`
Expected: `# Scalus 2026: Maintenance, Dijkstra Readiness & Application Runtime`

- [ ] **Step 2: Patch the Supporting-links placeholders with real gateway URLs**

The synced `## Supporting links` list has placeholder lines `* Full proposal: IPFS, PDF` and `* Annex N: …: IPFS, PDF`. Replace exactly those four lines (preserving label text) so each is `* <label>: https://ipfs.io/ipfs/<cid>`:

```
* Full proposal: https://ipfs.io/ipfs/QmcCjBYA8zrx5Khqbh6xraXQ23zrgaZxuzNewr1Ni6fck7
* Annex 1: Detailed Scope and Workstreams: https://ipfs.io/ipfs/QmQ6RiAPBZfuRqSh2bCS1HBBxSUoVoGob55bM43vimHxfJ
* Annex 2: Competitive Landscape: https://ipfs.io/ipfs/QmSEhgYGnfVHmc432P7cZmWq2ocNrS1FhTsz3GqY2zJv84
* Annex 3: 2025 Retrospective: https://ipfs.io/ipfs/QmaVmFXvbFnS5vjVtb9uuQugDU8tbqiWCe2QrZijbMCP6r
```

Use Edit on `docs/proposal.md` for each of the four lines. Leave the non-IPFS links (scalus.org, github, etc.) untouched.

- [ ] **Step 3: Verify the link regex will parse them**

Run: `grep -nE '^\* .+:\s+https?://\S+\s*$' docs/proposal.md | grep ipfs.io`
Expected: the four IPFS lines printed (this is the exact pattern `build-anchor.ts` uses to build `references[]`).

- [ ] **Step 4: Update `gov/pinned.json` roles to the content-matched CIDs**

Rewrite `gov/pinned.json` so roles map per the table (drop `annex4`):

```json
{
  "proposal": { "cid": "QmcCjBYA8zrx5Khqbh6xraXQ23zrgaZxuzNewr1Ni6fck7", "name": "scalus2026-2-full-proposal-placeholder", "pinnedAt": "2026-05-14T08:58:31.520Z" },
  "annex1": { "cid": "QmQ6RiAPBZfuRqSh2bCS1HBBxSUoVoGob55bM43vimHxfJ", "name": "scalus2026-2-annex-1-scope-placeholder", "pinnedAt": "2026-05-14T08:59:09.408Z" },
  "annex2": { "cid": "QmSEhgYGnfVHmc432P7cZmWq2ocNrS1FhTsz3GqY2zJv84", "name": "scalus2026-2-annex-2-competitive-placeholder", "pinnedAt": "2026-05-14T08:59:47.434Z" },
  "annex3": { "cid": "QmaVmFXvbFnS5vjVtb9uuQugDU8tbqiWCe2QrZijbMCP6r", "name": "scalus2026-2-annex-3-retrospective-placeholder", "pinnedAt": "2026-05-14T09:01:04.956Z" }
}
```

(The `anchor` role is added later by Task 6's pin. `pinnedAt` reuses the original pin timestamps — these objects are unchanged on IPFS.)

- [ ] **Step 5: Commit**

```bash
git add docs/proposal.md gov/pinned.json
git commit -m "docs: sync scalus2026-2 proposal; reuse existing annex CIDs as placeholders"
```

---

## Task 5: Generate the split pieces

**Files:**
- Generated: `docs/proposal-main.md`, `docs/annex-1.md`, `docs/annex-2.md`, `docs/annex-3.md`

**Interfaces:**
- Consumes: `docs/proposal.md` (Task 4), `extract-pieces.ts` (Task 2).
- Produces: the four derived markdown files.

- [ ] **Step 1: Run the splitter**

Run: `bun run extract-pieces`
Expected: four `Wrote …` lines; annex titles printed as `"Detailed Scope and Workstreams"`, `"Competitive Landscape"`, `"2025 Retrospective"`.

- [ ] **Step 2: Sanity-check the outputs**

Run: `head -1 docs/annex-1.md docs/annex-2.md docs/annex-3.md`
Expected: `### Annex 1: Detailed Scope and Workstreams`, `### Annex 2: Competitive Landscape`, `### Annex 3: 2025 Retrospective`.

Run: `grep -c '^## Supporting links' docs/proposal-main.md`
Expected: `1` (the post-annex section is carried into proposal-main).

- [ ] **Step 3: Commit**

```bash
git add docs/proposal-main.md docs/annex-1.md docs/annex-2.md docs/annex-3.md
git commit -m "docs: extract scalus2026-2 into proposal-main + annex-{1,2,3}"
```

---

## Task 6: Build + sign the anchors (preview + mainnet)

**Files:**
- Generated: `gov/anchor.preview.json`, `gov/anchor.mainnet.json`
- Modify: `gov/pinned.json` (adds `anchor` role via pin)

**Interfaces:**
- Consumes: `docs/proposal.md`, `gov/pinned.json` roles, `build-anchor.ts` (Task 3), `sign-anchor.ts`, `pin.ts`.
- Produces: schema-valid, signed `gov/anchor.<net>.json`; the preview anchor's CID recorded as `anchor` in `gov/pinned.json`.

Note: pinning requires `PINATA_JWT` and/or `BLOCKFROST_IPFS_PROJECT_ID` in `.env`. Verify before starting: `bun -e 'console.log(!!process.env.PINATA_JWT || !!process.env.BLOCKFROST_IPFS_PROJECT_ID)'` → `true`.

- [ ] **Step 1: Build the preview anchor**

Run: `bun run build-anchor -- --network preview`
Expected: `Wrote gov/anchor.preview.json (… KB, schema-valid)`.

- [ ] **Step 2: Confirm the anchor references resolved correctly**

Run: `bun -e 'const a=require("./gov/anchor.preview.json"); console.log(a.body.title); console.log(a.body.references.map(r=>r.label+" -> "+r.uri).join("\n"))'`
Expected: title `Scalus 2026: Maintenance, Dijkstra Readiness & Application Runtime`; the four IPFS references show `https://ipfs.io/ipfs/<cid>` matching the CID table; motivation present.

- [ ] **Step 3: Sign the preview anchor**

Run: `bun run sign-anchor gov/anchor.preview.json`
Expected: fills `authors[0].witness.publicKey` + `.signature`; prints schema-valid. (Re-validates at the end.)

- [ ] **Step 4: Pin the preview anchor and record the CID**

Run: `bun run pin gov/anchor.preview.json --role anchor --name scalus2026-2-anchor-preview`
Expected: prints `ipfs://<cid>` and `Recorded as anchor in gov/pinned.json`.

- [ ] **Step 5: Build + sign the mainnet anchor (artifact only — not submitted)**

Run: `bun run build-anchor -- --network mainnet`
Then: `bun run sign-anchor gov/anchor.mainnet.json`
Expected: both succeed, schema-valid. (Mainnet anchor is generated for review; it will be re-pinned with real PDFs before any future mainnet submission.)

- [ ] **Step 6: Commit**

```bash
git add gov/anchor.preview.json gov/anchor.mainnet.json gov/pinned.json
git commit -m "feat(anchor): build+sign scalus2026-2 anchors (preview pinned)"
```

---

## Task 7: Dry-run gov-action summaries

**Files:**
- Generated: `gov/preview-withdrawal.json`, `gov/mainnet-withdrawal.json`

**Interfaces:**
- Consumes: `params/*`, `gov/anchor.<net>.json`, `gov/pinned.json` `anchor` role, `deployment/<net>.json` (existing).
- Produces: human-readable withdrawal summaries (no chain writes).

Note: `03-build-gov-action.ts` reads `deployment/<net>.json` for `treasuryScriptHashHex`. The *existing* preview/mainnet deployment files are still present, so the dry-run computes a summary against the OLD treasury hash. That is fine for a dry-run sanity check of amount + anchor; the preview rehearsal (Task 8) rewrites `deployment/preview.json` with the fresh hash, and a fresh dry-run there reflects it.

- [ ] **Step 1: Preview dry-run**

Run: `NETWORK=preview bun run gov`
Expected: `Wrote gov/preview-withdrawal.json`; printed `cardano-cli` block shows `--transfer 2991667000000`, the anchor `ipfs://<cid>` (preview anchor), and `--anchor-data-hash <hash>`.

- [ ] **Step 2: Mainnet dry-run (no --submit)**

Run: `NETWORK=mainnet bun run gov`
Expected: `Wrote gov/mainnet-withdrawal.json`; `amountLovelace` `2991667000000`; anchor url = `ipfs://<mainnet anchor cid>` (note: until the mainnet anchor is pinned, the `anchor` role holds the preview CID — acceptable for a dry-run; the value is re-pinned before mainnet). Confirm it printed the `--dry-run` notice and did NOT submit.

- [ ] **Step 3: Verify the dry-run amount + return address**

Run: `cat gov/mainnet-withdrawal.json`
Expected: `"amountLovelace": "2991667000000"`, `"returnAddress": "addr1qyhvk2xna6s7wglqx09k…"` (admin), `"network": "mainnet"`.

- [ ] **Step 4: Commit**

```bash
git add gov/preview-withdrawal.json gov/mainnet-withdrawal.json
git commit -m "chore(gov): dry-run withdrawal summaries (₳2,991,667)"
```

---

## Task 8: Preview rehearsal (end-to-end, testnet only)

**Files:**
- Generated (do not hand-edit): `deployment/preview.json`
- Generated: refreshed `gov/preview-withdrawal.json`
- Append: `journal/` entry for the preview gov action

**Interfaces:**
- Consumes: `recover-deposits/recover-deposits.scala`, scripts `01-init-registry.ts`, `02-register-scripts.ts`, `03-build-gov-action.ts`, preview Blockfrost key in `.env`.
- Produces: a live preview gov action whose `meta_json` parses on Koios.

**Precondition check (read-only):** `BLOCKFROST_PROJECT_ID` in `.env` must be a **preview** key for the recover/init/register/gov scripts (they assert the prefix). The repo `.env` holds the mainnet key per earlier work — confirm which network it targets before running, and use a preview-scoped key for this task. Do not run any step with `--submit` against a mainnet key.

- [ ] **Step 1: Recover preview deposits to fund the rehearsal (dry-run first)**

Run: `cd recover-deposits && scala-cli run recover-deposits.scala -- --network preview`
Expected: prints derived admin addresses, a withdrawable balance (~300k tADA per prior expired preview proposals), and `--dry-run … not submitting`. Confirms keys + balance before broadcasting.

- [ ] **Step 2: Recover preview deposits (submit)**

Run: `scala-cli run recover-deposits.scala -- --network preview --submit`
Expected: delegates to a DRep first if needed, then submits the withdrawal; prints `[submitted] withdrawal tx hash: …`. Wait for confirmation. Then `cd ..`.

- [ ] **Step 3: Fresh registry init on preview (dry-run)**

Run: `NETWORK=preview bun run init`
Expected: builds the one-shot registry-mint tx and prints a summary without submitting.

- [ ] **Step 4: Fresh registry init on preview (submit)**

Run: `NETWORK=preview bun run init --submit`
Expected: mints the registry NFT; rewrites `deployment/preview.json` with new `registryPolicyHex`, `treasuryScriptHashHex`, `vendorScriptHashHex` (reflecting T_max 2027-07-01), `treasuryExpirationMs: "1814400000000"`, and `txs.initRegistry`. Wait for confirmation.

- [ ] **Step 5: Register stake credentials on preview (submit)**

Run: `NETWORK=preview bun run register --submit`
Expected: registers treasury + vendor (vote-delegated AlwaysAbstain) + admin stake creds; writes `txs.registerScripts`. Wait for confirmation.

- [ ] **Step 6: Rebuild + re-pin the preview anchor against the fresh deployment**

The anchor body does not depend on deployment hashes, so the existing signed `gov/anchor.preview.json` (Task 6) and its pinned CID remain valid. Re-pin only if it was garbage-collected:

Run: `curl -sI "https://ipfs.io/ipfs/$(bun -e 'process.stdout.write(require("./gov/pinned.json").anchor.cid)')" | head -1`
Expected: `HTTP/... 200`. If not 200, re-run Task 6 Step 4.

- [ ] **Step 7: Submit the preview gov action**

Run: `NETWORK=preview bun run gov --submit`
Expected: builds the proposal tx (with guardrails-script witness + Proposing redeemer), submits, prints `Submitted. Tx hash: …`, and records `txs.govAction` in `deployment/preview.json`.

- [ ] **Step 8: Verify the anchor metadata parses on Koios**

Run (after a few minutes for propagation):
```bash
curl -s "https://preview.koios.rest/api/v1/proposal_list" | bun -e 'const d=JSON.parse(require("fs").readFileSync(0,"utf8")); const m=d.find(p=>p.proposal_type==="TreasuryWithdrawals" && p.meta_json?.body?.title?.includes("Scalus 2026")); console.log(m? JSON.stringify(m.meta_json.body.title)+" OK" : "not found yet")'
```
Expected: prints the title + `OK` once the action is indexed (retry if "not found yet").

- [ ] **Step 9: Record the journal entry and commit**

Append a `journal/` entry (follow the existing journal file format) with: tx hash (`txs.govAction`), action type `treasuryWithdrawal`, amount `2991667000000`, anchor CID + hash, network `preview`, and a one-line justification. Then:

```bash
git add deployment/preview.json gov/preview-withdrawal.json journal/
git commit -m "chore(preview): rehearse scalus2026-2 — fresh deploy + gov action"
```

---

## Task 9: Update CLAUDE.md workflow notes + memory

**Files:**
- Modify: `CLAUDE.md` (workflow order / mainnet placeholder notes)

**Interfaces:**
- Consumes: outcomes of Tasks 1-8.
- Produces: updated operator docs.

- [ ] **Step 1: Note the resubmission in CLAUDE.md**

Add a short note under the existing workflow/gotchas: the active proposal is now scalus2026-2 (₳2,991,667, T_max 2027-07-01), references reuse old IPFS CIDs as placeholders pending real PDFs, mainnet deferred, preview rehearsed. Keep it to a few lines; do not duplicate the spec.

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: note scalus2026-2 resubmission state in CLAUDE.md"
```

---

## Self-Review notes (coverage map)

- Spec §3 decisions → Tasks 1 (amount/T_max), 4 (CID reuse), 6 (signing), 8 (rehearsal, recover-first).
- Spec §5 script fixes → Tasks 2 (extract-pieces), 3 (build-anchor). §5.3 pinned.ts: `annex4` left in the type but no longer required (Task 3 drops the call); no code change needed beyond that.
- Spec §6 params → Task 1.
- Spec §7 IPFS reuse → Tasks 4 + 6.
- Spec §8 artifact build → Tasks 5, 6, 7.
- Spec §9.1 preview rehearsal → Task 8.
- Spec §9.2 mainnet → intentionally NOT a task (deferred; documented in spec + Task 9 note).
- Spec §10 open items → carried as notes (placeholder PDFs, HackMD drift, pinning creds).

**Deferred to a future effort (explicitly out of scope here):** replacing placeholder PDFs with real exports, updating HackMD Supporting-links to converge, and the entire mainnet sequence.
