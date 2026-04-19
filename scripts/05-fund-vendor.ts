#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import sodium from "libsodium-wrappers-sumo";
import { Treasury, Utils } from "@sundaeswap/treasury-funds";
import { makeValue } from "@blaze-cardano/sdk";
import { Core } from "@blaze-cardano/sdk";
import { Ed25519KeyHashHex } from "@blaze-cardano/core";
import { loadProvider } from "./lib/provider";
import { loadDeployment, saveDeployment } from "./lib/deployment";
import {
  preprodRawConfig,
  buildTreasuryConfig,
  buildVendorConfig,
  vendorMultisig,
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

  const resolved = resolveConfig(preprodRawConfig, new Date());
  const treasuryCfg = buildTreasuryConfig(resolved, state.registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, state.registryPolicyHex);
  const adminPkh = Ed25519KeyHashHex(resolved.adminPkhHex);

  // Find the treasury UTxO holding the freshly-withdrawn funds.
  const scripts = Utils.loadScripts(network, treasuryCfg, vendorCfg);
  const treasuryUtxos = await blaze.provider.getUnspentOutputs(
    scripts.treasuryScript.scriptAddress,
  );
  const funded = treasuryUtxos.find(
    (u) => u.output().amount().coin() >= resolved.amountLovelace,
  );
  if (!funded) {
    throw new Error(
      `No treasury UTxO with >= ${resolved.amountLovelace} lovelace found at ${scripts.treasuryScript.scriptAddress.toBech32()}. Did 04-withdraw --submit succeed?`,
    );
  }

  const schedule = resolved.schedule.map((m) => ({
    date: m.maturation,
    amount: makeValue(m.amountLovelace),
  }));

  const tx = await Treasury.fund({
    blaze,
    configsOrScripts: { configs: { treasury: treasuryCfg, vendor: vendorCfg } },
    input: funded,
    vendor: vendorMultisig(resolved),
    schedule,
    signers: [adminPkh],
  });

  const built = await tx.complete();
  console.log(
    `Built fund-vendor tx. CBOR size: ${built.toCbor().toString().length / 2} bytes`,
  );
  console.log(`Milestone count: ${schedule.length}`);
  for (const m of schedule) {
    console.log(
      `  matures ${m.date.toISOString()}: ${m.amount.coin().toString()} lovelace`,
    );
  }

  if (DRY_RUN) {
    console.log(
      "\n--dry-run (default): not submitting. Re-run with --submit to broadcast.",
    );
    return;
  }

  const signed = await blaze.signTransaction(built);
  const hash = await blaze.submitTransaction(signed);
  console.log(`Submitted. Tx hash: ${hash}`);
  state.txs.fundVendor = hash.toString();
  saveDeployment(DEPLOYMENT_PATH, state, { overwrite: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
