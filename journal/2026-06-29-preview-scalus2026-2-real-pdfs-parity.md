# Preview — scalus2026-2 real PDFs + bun⇄scalus parity (dry-run)

**Network:** preview (testnet) — build + compare only, **nothing submitted**.
**Date:** 2026-06-29
**Purpose:** (1) replace the placeholder IPFS PDFs with the real
scalus2026-2 exports and rebuild the CIP-108 anchor; (2) prove the Scalus
`treasury-publish` reimplementation produces byte-identical deployment
artifacts to the canonical bun pipeline.

## Proposal refresh

- Re-synced `docs/proposal.md` from HackMD `@lantr/scalus2026-2`. Title now
  includes "Interoperability"; `## Motivation` was restructured (Traction now
  has `####` children). HackMD now ships `\$` escaped — no MathJax re-fix
  needed.
- **Anchor motivation bug fixed first** (commit `e006715`): `build-anchor`
  hardcoded a single Motivation subsection; now emits the whole section
  (11 headings, ~6.9 KB) via `sectionContents()`. Without this the new
  subsections would have been dropped.

## IPFS pins (real PDFs — Pinata, CIDv0)

| Role | File | CID |
|---|---|---|
| proposal | `Scalus_2026_Maintenance_Dijkstra_Readiness_Interoperability_Application_Runtime.pdf` | `QmcxVb3ZKX4NBNqk1rHJuNf7LevB2iAY39sGUiKMGnPEeB` |
| annex1 | `Scalus_2026-Annex1_Scope.pdf` | `QmXmA7iGezVzHHNXZZdHRVkEMdNT5qfjX3R6bsjYsn7LUn` |
| annex2 | `Scalus_2026-Annex2-Competitive_Landscape.pdf` | `QmZxgZMk9tjLkV39b3ppXWxHhFdyHqShmuLgrfAH6bQiTa` |
| annex3 | `Scalus_2026-Annex3_2025_Retrospective.pdf` | `QmdxcAZoSy2hAhNmmGsH6A9HyiuJDJM5jeH8BVHkBkeMMk` |
| anchor | `gov/anchor.preview.json` (signed) | `QmcZPndRnPR3giqybj1u24VVFx5q4csN9uYHuFCtT38uqD` |

`docs/proposal.md` "Supporting links" repointed from the `IPFS, PDF`
placeholders to `https://ipfs.io/ipfs/<cid>`; anchor `references[]` now carry
the real CIDs. Anchor body blake2b-256 = `abc7097843971cde…`; on-chain anchor
dataHash (full-file) = `e6b117c2522a69b1b693dd863181aa42b86d71fc928b5b5d40cc906d43515500`.

## bun ⇄ scalus parity (dry-run, forced seed `5835e17f…#0`)

Both pipelines run init → register → gov against the same chain state, forced
onto the identical one-shot seed via the new `--seed <txid#ix>` flag (added to
bun `01-init-registry.ts` and scalus `InitRegistry`/`Cli`). Without it bun
picks `walletUtxos[0]` and scalus the smallest ada-only UTxO — different seeds
→ divergent policy/treasury/vendor hashes.

| Artifact | Value (bun == scalus) |
|---|---|
| registry policy | `18d7beac6c0a3e364bab987b83b5379295b349ca42032af831e7b475` |
| treasury hash | `7ec9559c42c7bc22559f30e9258834714a5ca1a4085e5ad7de84e990` |
| vendor hash | `4bcff32e6a242fad82bbe8046062f56e9b1ed26c6d62fbeb81a37216` |
| treasury reward | `stake_test17plvj4vugtrmcgj4nucwjfvgx3c55h9p5sy9ukkhm6zwnyq9u926j` |
| vendor reward | `stake_test17p9uluewdgjzltvzh05qgcrz74hfk8kjd3kk97ltsx3hy9seaqgcn` |
| admin reward | `stake_test1uzlvah74gljhkhehgh5u5dywmuljtm2v068nh7prgpp4uxcw7f8f4` (already registered — skipped) |
| gov withdrawal JSON | identical (reward acct, amount `2991667000000`, guardrails `fa24fb30…`, anchor url+hash) |

- Registry datum byte-for-byte parity covered by the offline `ParitySuite`
  (4/4 green) and the TS oracle.
- **Raw signed tx CBOR differs** by builder (init 967 vs 995, register 14669
  vs 14733, gov ~2705 bytes) — Blaze vs Scalus `TxBuilder` estimate
  fees / select change independently. Expected and out of scope for the
  parity bar (deterministic artifacts only).
- Harness: `scripts/compare-parity-preview.sh <txid#ix> [network]` — runs the
  whole comparison and asserts identity. `PARITY OK`.

## State

- **Nothing submitted.** On-chain preview is still the 2026-06-25 deploy
  (gov action `c7f69982…`). `deployment/preview.json` restored to that state;
  the fresh hashes above are dry-run only.
- **Mainnet deferred.** Before any mainnet run: converge the HackMD
  Supporting-links to these real CIDs (the repoint here is local-only) and
  rebuild/sign/pin the mainnet anchor.
