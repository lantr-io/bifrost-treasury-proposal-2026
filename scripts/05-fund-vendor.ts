#!/usr/bin/env bun
import { loadDeployment } from "./lib/deployment";

const DEPLOYMENT_PATH = "deployment/preprod.json";

// TODO(milestone-schedule): wire in a milestone schedule here. Decided at
// fund-vendor time per the proposal — not committed to script parameters at
// registry mint, so it can be set whenever the operator+board agree on the
// payout dates. Once we have a {maturation: Date, amountLovelace: bigint}[]
// (sum <= treasury UTxO amount; any change stays at treasury as
// contingency reserve), restore the Treasury.fund call. Until then this
// script is intentionally non-runnable.
async function main(): Promise<void> {
  const state = loadDeployment(DEPLOYMENT_PATH);
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  throw new Error(
    "05-fund-vendor is not yet wired. The milestone schedule (vendor datum, " +
      "set per Fund call) has been deferred — see TODO(milestone-schedule) " +
      "at the top of this file and Plan.md before running.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
