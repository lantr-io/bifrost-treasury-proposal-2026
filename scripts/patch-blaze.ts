#!/usr/bin/env bun
/**
 * Workaround for a Blaze tx-builder bug in @blaze-cardano/tx@0.13.x:
 * `addVoteDelegation` hardcodes redeemer `index: 256` as a placeholder, but
 * no later pass renumbers cert-purpose redeemers (only Spend/Mint/Reward
 * redeemers get renumbered during finalization). Real Blockfrost silently
 * tolerates the orphan 256 pointer; Yaci's stricter Ogmios rejects it as
 * extraneous. Replace the placeholder with the actual cert position.
 *
 * Safe to re-run: if the file is already patched, this script is a no-op.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TARGETS = [
  "node_modules/@blaze-cardano/tx/dist/index.mjs",
  "node_modules/@blaze-cardano/tx/dist/index.js",
];

const NEEDLE = `redeemers.push(Redeemer.fromCore({
				index: 256,
				purpose: RedeemerPurpose["certificate"],`;
const REPLACEMENT = `redeemers.push(Redeemer.fromCore({
				index: vals.length - 1,
				purpose: RedeemerPurpose["certificate"],`;

let patched = 0;
for (const rel of TARGETS) {
  const path = resolve(rel);
  if (!existsSync(path)) continue;
  const content = readFileSync(path, "utf8");
  if (content.includes(REPLACEMENT)) {
    console.log(`[patch-blaze] ${rel}: already patched`);
    continue;
  }
  if (!content.includes(NEEDLE)) {
    console.log(`[patch-blaze] ${rel}: pattern not found (Blaze upgrade?)`);
    continue;
  }
  writeFileSync(path, content.replace(NEEDLE, REPLACEMENT));
  console.log(`[patch-blaze] patched ${rel}`);
  patched++;
}

if (patched === 0) {
  console.log("[patch-blaze] no changes (already patched or pattern missing)");
}
