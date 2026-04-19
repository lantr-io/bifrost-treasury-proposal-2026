# CLAUDE.md

## What this repo is

Operational setup for the Cardano treasury withdrawal funding the Scalus
Application Platform and Node Diversity initiative. Parameterizes and drives
the audited SundaeSwap `treasury-funds` contracts via their published TS
package. **Does not port or reimplement contracts.**

## Cross-repo context

- Source contracts: `/Users/nau/projects/lantr/treasury-contracts/` (Aiken,
  audited by TxPipe and MLabs).
- Scalus monorepo: `/Users/nau/projects/lantr/scalus/` — consult for Scalus
  API patterns if a Scalus-side counterpart is ever added.
- Spec: `docs/superpowers/specs/2026-04-19-treasury-withdrawal-setup-design.md`.
- Plan: `docs/superpowers/plans/2026-04-19-treasury-withdrawal-setup.md`.

## Conventions

- **Never hand-edit** `deployment/*.json` or `keys/*` — both are machine-written
  by scripts and gitignored.
- Scripts default to `--dry-run` (build tx, print summary, do not submit).
  Submission requires the explicit `--submit` flag.
- Preprod concrete config: `params/preprod.ts` (runnable).
- Mainnet placeholder: `params/mainnet.ts` (NOT runnable until TODOs filled).
- Pinned versions in `package.json`; bumps are deliberate and justified in
  the commit message.
- Commit style: conventional (`feat:`, `fix:`, `docs:`, `chore:`, `test:`).

## Preprod workflow order

1. `bun run gen-keys`
2. `bun run init` — mint one-shot registry NFT, publish registry datum.
3. `bun run register` — register + delegate both scripts to AlwaysAbstain DRep.
4. `bun run gov` — emit the `treasuryWithdrawal` governance-action JSON.
5. (Manual) submit the gov action via `cardano-cli`, wait for it to pass.
6. `bun run withdraw` — pull ADA from the treasury reward account.
7. `bun run fund` — treasury → vendor contract with the single milestone.
8. (Wait for milestone maturation.)
9. `bun run vendor-withdraw` — admin claims the matured payout.

## What NOT to do

- Do not add contract code (Aiken, Scalus, or otherwise). If a change requires
  contract logic, raise it upstream with SundaeSwap.
- Do not add business-logic tests for SundaeSwap's package — we trust it.
- Do not commit secrets, `.env`, or anything under `keys/` / `deployment/`.
