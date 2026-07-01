# CIP-108 title length validation (bun + scalus)

**Date:** 2026-07-01
**Status:** Approved, in implementation

## Goal

CIP-108 caps the governance-action metadata `body.title` field at 80
characters (confirmed against the current upstream spec text and JSON
schema — not folklore). Neither the bun anchor pipeline nor the scalus
`BuildGovAction` submission path currently enforces this. Add validation
to both so an oversized title fails loudly, before an anchor is signed/pinned
(bun) or before an irreversible governance-action tx is submitted (scalus).

## Findings that shaped scope

- Our vendored `schemas/cip-0108.common.schema.json` (pinned at commit
  `3f3d685`) is stale relative to current upstream: it is missing
  `body.title.maxLength: 80`, `body.abstract.maxLength: 2500`, required
  `witness` fields, and `references.uniqueItems: true`.
- Checked all three current anchors (`gov/anchor.{mainnet,preview,preprod}.json`)
  against every constraint upstream added: no duplicate `references`, all
  `witness` fields present, `abstract` well under 2500 chars in all three.
  Only `title` is affected — mainnet and preview are both 84 characters
  ("Scalus 2026: Maintenance, Dijkstra Readiness, Interoperability &
  Application Runtime"), preprod is 75.
- The mainnet and preview anchors are already hashed, pinned to IPFS, and
  referenced by a live/passed governance action (mainnet tx `3234567a…`,
  DRep vote running to epoch 647). This cannot be fixed retroactively —
  changing the title changes the anchor hash, invalidating the submission.
  Documented as an informational gotcha only; no action taken on those
  anchors.

## Scope

In scope:

1. Re-sync `schemas/cip-0108.common.schema.json` with current upstream
   (verbatim replacement), so the existing `assertAnchorValid()` Ajv check
   (already called from both `build-anchor.ts` and `sign-anchor.ts`)
   enforces `title.maxLength: 80` and the three other new constraints.
2. Friendly pre-check in `build-anchor.ts` at the point `titleSection.heading`
   is read: throw immediately with the actual title + length, pointing at
   the fix (shorten the H1 in `docs/proposal.md`). The schema check is the
   general safety net (also covers `sign-anchor.ts` and hand-edited anchor
   files); this is the nicer error at the point a dev would actually act on.
3. `treasury-publish/BuildGovAction.scala`: a small package-private pure
   function `assertTitleLength(title: String): Unit`, called after the
   anchor JSON is parsed and before the proposal tx is built. This is the
   only place scalus touches anchor content (it otherwise just hashes bytes
   and reads a CID — "anchor stays in bun" per the Phase-1 design doc).
   Scoped to `title` only, matching what was asked; not a second JSON-schema
   validator (that would duplicate Ajv and violate the documented
   bun/scalus boundary).
4. Tests: `scripts/lib/validate-anchor.test.ts` (bun:test, fits the existing
   `scripts/lib` test convention) and a scalus munit test for
   `assertTitleLength`. Both cover a passing case (≤80 chars) and a failing
   case (>80 chars, message assertion).
5. One `CLAUDE.md` gotcha entry recording the stale-schema discovery and the
   already-submitted mainnet/preview title overage (informational,
   unfixable retroactively).

Out of scope:

- Fixing or resubmitting the mainnet/preview anchors — not possible without
  invalidating the already-passed governance action.
- Investigating whether GovTool/dbsync/cexplorer actually enforce
  `maxLength` today (deferred; the fix is needed regardless of whether the
  live vote is currently at risk).
- A second full CIP-108 schema validator in Scala.
- Unicode-exact (codepoint/grapheme-cluster) length semantics — plain
  string length (`.length` in both TS and Scala, i.e. UTF-16 code units) is
  sufficient since all current and historical titles are plain ASCII/Latin-1
  text with no astral characters.

## Architecture

No new modules. Three existing files change (`schemas/cip-0108.common.schema.json`,
`scripts/build-anchor.ts`, `treasury-publish/BuildGovAction.scala`), plus two
new test files and one `CLAUDE.md` addition.

```
docs/proposal.md (H1 title)
        │
        ▼
scripts/build-anchor.ts ──[pre-check: heading.length > 80 → throw]──▶ gov/anchor.<net>.json
        │
        ▼
scripts/lib/validate-anchor.ts (assertAnchorValid, Ajv + re-synced schema)
        │ called from build-anchor.ts AND sign-anchor.ts
        ▼
gov/anchor.<net>.json (validated, signed)
        │
        ├─▶ scripts/03-build-gov-action.ts (bun; reads bytes, no re-check — trusts earlier stages)
        └─▶ treasury-publish/BuildGovAction.scala (scalus; parses JSON,
             assertTitleLength(body.title) before building the proposal tx)
```

## Testing

- `bun test scripts/lib` — new `validate-anchor.test.ts` cases pass.
- `scala-cli test treasury-publish` — new `assertTitleLength` cases pass
  alongside the existing hash-parity suite.
- `bun run typecheck` — no new type errors.
- Manual: re-run `bun scripts/build-anchor.ts --network preprod` (a title
  under 80 chars) to confirm the existing passing path is unaffected.
