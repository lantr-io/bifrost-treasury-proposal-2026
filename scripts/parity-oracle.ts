#!/usr/bin/env bun
// Deterministic, no-network oracle for the Scala hash-parity test.
// Compiles the registry/treasury/vendor scripts exactly as 01-init does, for a
// FIXED seed UTxO + preprodRawConfig, and prints the three script hashes.
// The Scala reimplementation must reproduce these byte-for-byte.
import { OneshotOneshotMint, Utils } from "@sundaeswap/treasury-funds";
import { Core } from "@blaze-cardano/sdk";
import { toHex } from "@blaze-cardano/core";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "../params/preprod";
import { resolveConfig } from "../params/common";

// Fixed seed UTxO (arbitrary but pinned — both oracle and Scala use this exact value).
const SEED_TX = "1111111111111111111111111111111111111111111111111111111111111111";
const SEED_IX = 0n;

const network = Core.NetworkId.Testnet;
const seedUtxoData = { transaction_id: SEED_TX, output_index: SEED_IX };

const oneshot = new OneshotOneshotMint(seedUtxoData, true);
const registryPolicyHex = oneshot.Script.hash();
const registryAssetNameHex = toHex(Buffer.from("REGISTRY"));

const resolved = resolveConfig(preprodRawConfig);
const treasuryCfg = buildTreasuryConfig(resolved, registryPolicyHex);
const vendorCfg = buildVendorConfig(resolved, registryPolicyHex);
const compiled = Utils.loadScripts(network, treasuryCfg, vendorCfg, true);

const out = {
  seed: { txId: SEED_TX, outputIndex: Number(SEED_IX) },
  registryPolicy: registryPolicyHex,
  registryAssetNameHex,
  treasuryScriptHash: compiled.treasuryScript.script.Script.hash(),
  vendorScriptHash: compiled.vendorScript.script.Script.hash(),
  // also dump the applied CBOR so Scala can diff bytes, not just hashes
  treasuryScriptCbor: compiled.treasuryScript.script.Script.toCbor(),
  vendorScriptCbor: compiled.vendorScript.script.Script.toCbor(),
  oneshotScriptCbor: oneshot.Script.toCbor(),
};
console.log(JSON.stringify(out, null, 2));
