#!/usr/bin/env bun
/**
 * Read-only: print the resolved treasury/vendor configuration (board hashes,
 * deadlines, sum, permission multisig) that a fresh deploy will bake into the
 * scripts, for a given network + seed UTxO. No network calls.
 *
 *   bun scripts/print-config.ts --network mainnet --seed <txid#ix>
 */
import {
  OneshotOneshotMint,
  Utils,
} from "@sundaeswap/treasury-funds";
import { Core } from "@blaze-cardano/sdk";
import { resolveConfig } from "../params/common";
import { mainnetRawConfig } from "../params/mainnet";
import { previewRawConfig } from "../params/preview";
import {
  preprodRawConfig,
  buildTreasuryConfig,
  buildVendorConfig,
  vendorMultisig,
} from "../params/preprod";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const network = arg("--network") ?? "mainnet";
const seedRef = arg("--seed");
if (!seedRef) throw new Error("--seed <txid#ix> required");
const [seedTx, seedIxStr] = seedRef.split("#");
const seedIx = BigInt(seedIxStr ?? "0");

const raw =
  network === "mainnet"
    ? mainnetRawConfig()
    : network === "preview"
      ? previewRawConfig
      : preprodRawConfig;
const resolved = resolveConfig(raw);

const oneshot = new OneshotOneshotMint(
  { transaction_id: seedTx!, output_index: seedIx },
  true,
);
const registryPolicy = oneshot.Script.hash();

const tcfg = buildTreasuryConfig(resolved, registryPolicy);
const vcfg = buildVendorConfig(resolved, registryPolicy);
const nid = network === "mainnet" ? Core.NetworkId.Mainnet : Core.NetworkId.Testnet;
const compiled = Utils.loadScripts(nid, tcfg, vcfg, true);
const treasuryHash = compiled.treasuryScript.script.Script.hash();
const vendorHash = compiled.vendorScript.script.Script.hash();

const ms = (n: bigint) => `${n} ms  (${new Date(Number(n)).toISOString()})`;
const ada = (n: bigint) => `${n} lovelace  (₳${(Number(n) / 1e6).toLocaleString("en-US")})`;

console.log(`# Treasury/Vendor configuration — network=${network}, seed=${seedRef}\n`);
console.log("## Identities");
console.log(`  admin (K_op) pkh : ${resolved.adminPkhHex}`);
resolved.boardPkhs.forEach((p, i) => console.log(`  board K_${i + 1} pkh    : ${p}`));
console.log("");
console.log("## Sum (treasury withdrawal)");
console.log(`  amount           : ${ada(resolved.amountLovelace)}`);
console.log("");
console.log("## Deadlines");
console.log(`  treasury.expiration       : ${ms(resolved.treasuryExpirationMs)}`);
console.log(`  treasury.payout_upperbound: ${ms(resolved.vendorPayoutUpperboundMs)}`);
console.log(`  vendor.expiration         : ${ms(resolved.vendorExpirationMs)}`);
console.log("");
console.log("## Script identities");
console.log(`  registry policy  : ${registryPolicy}`);
console.log(`  treasury hash    : ${treasuryHash}`);
console.log(`  vendor hash      : ${vendorHash}`);
console.log("");
console.log("## TreasuryConfiguration (applied)");
console.log(JSON.stringify(tcfg, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
console.log("");
console.log("## VendorConfiguration (applied)");
console.log(JSON.stringify(vcfg, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 2));
console.log("");
console.log("## Vendor claim multisig (set per Fund call)");
console.log(JSON.stringify(vendorMultisig(resolved), null, 2));
