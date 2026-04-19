#!/usr/bin/env bun
import { readFileSync } from "node:fs";
import sodium from "libsodium-wrappers-sumo";
import { Utils, Vendor } from "@sundaeswap/treasury-funds";
import { Core } from "@blaze-cardano/sdk";
import { Ed25519KeyHashHex } from "@blaze-cardano/core";
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

  const resolved = resolveConfig(preprodRawConfig, new Date());
  const treasuryCfg = buildTreasuryConfig(resolved, state.registryPolicyHex);
  const vendorCfg = buildVendorConfig(resolved, state.registryPolicyHex);
  const adminPkh = Ed25519KeyHashHex(resolved.adminPkhHex);

  const scripts = Utils.loadScripts(network, treasuryCfg, vendorCfg);
  const vendorUtxos = await blaze.provider.getUnspentOutputs(
    scripts.vendorScript.scriptAddress,
  );
  if (vendorUtxos.length === 0) {
    throw new Error(
      `No vendor UTxOs found at ${scripts.vendorScript.scriptAddress.toBech32()}. Did 05-fund-vendor --submit succeed?`,
    );
  }

  const tx = await Vendor.withdraw({
    blaze,
    configsOrScripts: { configs: { treasury: treasuryCfg, vendor: vendorCfg } },
    inputs: vendorUtxos,
    signers: [adminPkh],
    now: new Date(),
  });

  const built = await tx.complete();
  console.log(
    `Built vendor-withdraw tx. CBOR size: ${built.toCbor().toString().length / 2} bytes`,
  );
  console.log(`Claiming from ${vendorUtxos.length} vendor UTxO(s)`);

  if (DRY_RUN) {
    console.log(
      "\n--dry-run (default): not submitting. Re-run with --submit to broadcast.",
    );
    console.log(
      "NOTE: on-chain validation will reject withdrawal before milestone maturation.",
    );
    return;
  }

  const signed = await blaze.signTransaction(built);
  const hash = await blaze.submitTransaction(signed);
  console.log(`Submitted. Tx hash: ${hash}`);
  state.txs.vendorWithdraw = hash.toString();
  saveDeployment(DEPLOYMENT_PATH, state, { overwrite: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
