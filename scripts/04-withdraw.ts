#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import sodium from "libsodium-wrappers-sumo";
import { Treasury } from "@sundaeswap/treasury-funds";
import { Core } from "@blaze-cardano/sdk";
import { loadProvider } from "./lib/provider";
import { loadDeployment, saveDeployment } from "./lib/deployment";
import {
  preprodRawConfig,
  buildTreasuryConfig,
  buildVendorConfig,
} from "../params/preprod";
import { resolveConfig } from "../params/common";

const DEPLOYMENT_PATH = "deployment/preprod.json";
const DRY_RUN = !process.argv.includes("--submit");

async function main(): Promise<void> {
  await sodium.ready;

  const state = loadDeployment(DEPLOYMENT_PATH);
  if (!state) throw new Error("Run 01-init-registry.ts --submit first.");

  const skHex = readFileSync("keys/admin.skey", "utf8").trim();
  const { blaze, network } = await loadProvider(skHex);
  if (network !== Core.NetworkId.Testnet) throw new Error("Expected testnet");

  const resolved = resolveConfig(preprodRawConfig);
  const treasuryCfg = buildTreasuryConfig(resolved, state.registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, state.registryPolicyHex);

  const tx = await Treasury.withdraw({
    blaze,
    configsOrScripts: { configs: { treasury: treasuryCfg, vendor: vendorCfg } },
    amounts: [preprodRawConfig.amountLovelace],
    withdrawAmount: preprodRawConfig.amountLovelace,
  });

  const built = await tx.complete();
  console.log(
    `Built treasury withdraw tx. CBOR size: ${built.toCbor().toString().length / 2} bytes`,
  );
  console.log(`Withdrawing ${preprodRawConfig.amountLovelace.toString()} lovelace`);

  if (DRY_RUN) {
    console.log(
      "\n--dry-run (default): not submitting. Re-run with --submit to broadcast.",
    );
    return;
  }

  const signed = await blaze.signTransaction(built);
  const hash = await blaze.submitTransaction(signed);
  console.log(`Submitted. Tx hash: ${hash}`);
  state.txs.treasuryWithdraw = hash.toString();
  saveDeployment(DEPLOYMENT_PATH, state, { overwrite: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
