#!/usr/bin/env bun
/**
 * Patch @sundaeswap/treasury-funds@0.0.25 to fix a bug in its codegen:
 * each validator constructor reads `this.trace` to pick between the
 * stripped and traced bytecode, but never assigns `this.trace = trace`.
 * That makes `this.trace` always `undefined` (falsy), so the constructor
 * always selects the TRACED variant — bloating each validator by ~2x and
 * pushing the vendor script over the 16 KB max-tx-size cap.
 *
 * Bug shape:
 *   var trace = arguments[1] !== undefined ? arguments[1] : false;
 *   _classCallCheck(this, X);
 *   _defineProperty(this, "Script", void 0);
 *   this.Script = applyParamsToScript(this.trace ? STRIPPED : TRACED, …)
 *                                      ^^^^^^^^^^ always undefined
 *
 * Patch: replace `this.trace ?` with `trace ?` so the local variable is
 * read directly. Idempotent — re-running is a no-op.
 *
 * After this patch + passing `trace: true` to loadScripts, the vendor
 * script drops from ~17 KB to ~9 KB and fits in a single tx.
 *
 * The branch naming is upstream's choice: `trace=true` selects the
 * STRIPPED (production) bytecode despite the variable name. We don't
 * normalize that; we just make it work.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";

const TARGETS = [
  "node_modules/@sundaeswap/treasury-funds/dist/cjs/generated-types/contracts.js",
  "node_modules/@sundaeswap/treasury-funds/dist/esm/generated-types/contracts.js",
];

function patchFile(path: string): "patched" | "already" | "skipped" {
  if (!existsSync(path)) return "skipped";
  const before = readFileSync(path, "utf8");
  const after = before.replace(/\bthis\.trace \?/g, "trace ?");
  if (after === before) return "already";
  writeFileSync(path, after);
  return "patched";
}

let any = false;
for (const path of TARGETS) {
  const status = patchFile(path);
  console.log(`${status.padEnd(8)} ${path}`);
  if (status === "patched") any = true;
}
if (!any) {
  console.log("(no changes — package already patched or not present)");
}
