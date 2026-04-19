#!/usr/bin/env bun
/**
 * Workaround for a packaging bug in libsodium-wrappers-sumo@0.7.16:
 * its published ESM variant imports `./libsodium-sumo.mjs` relative to
 * itself, but the referenced file lives in the peer `libsodium-sumo`
 * package instead. Copy it into place so Bun's ESM resolver can find it.
 *
 * Safe to re-run: if the source is missing or the destination already
 * holds the file, this script is a no-op.
 */
import { existsSync, copyFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const src = resolve(
  "node_modules/libsodium-sumo/dist/modules-sumo-esm/libsodium-sumo.mjs",
);
const dest = resolve(
  "node_modules/libsodium-wrappers-sumo/dist/modules-sumo-esm/libsodium-sumo.mjs",
);

if (!existsSync(src)) {
  console.log(`[patch-libsodium] source missing (${src}), skipping`);
  process.exit(0);
}
if (existsSync(dest) && statSync(dest).size === statSync(src).size) {
  console.log("[patch-libsodium] already patched");
  process.exit(0);
}

copyFileSync(src, dest);
console.log(`[patch-libsodium] copied ${src} → ${dest}`);
