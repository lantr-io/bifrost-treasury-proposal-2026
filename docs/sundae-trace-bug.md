# Bug: validator constructors always emit TRACED bytecode (`this.trace` never assigned)

**Package:** `@sundaeswap/treasury-funds@0.0.25` (latest, published 2025-10-22)
**Repo:** https://github.com/SundaeSwap-finance/treasury-contracts (`offchain/`)
**Severity:** High — the traced vendor validator (~17 KB) exceeds Cardano's
16,384-byte `max_tx_size` cap on both preprod and mainnet, so it cannot be
included in any single tx. This silently breaks vendor stake-credential
registration for every consumer.

## Summary

Each generated validator class in `dist/{cjs,esm}/generated-types/contracts.js`
reads `arguments[1]` into a local `var trace` but never assigns it to `this`.
The `Script` field then reads `this.trace` (always `undefined` → falsy), so
the ternary `this.trace ? <stripped> : <traced>` always picks the **traced**
branch — regardless of what the caller passes.

## Reproduction

```ts
import { TreasuryTreasurySpend } from "@sundaeswap/treasury-funds";

const cfg = { /* any valid TreasuryConfiguration */ };

const a = new TreasuryTreasurySpend(cfg);          // default
const b = new TreasuryTreasurySpend(cfg, false);   // expect same as default
const c = new TreasuryTreasurySpend(cfg, true);    // expect different (smaller)

console.log(a.Script.toCbor().toString().length); // identical
console.log(b.Script.toCbor().toString().length); // identical
console.log(c.Script.toCbor().toString().length); // identical
// All three emit the same (traced) bytecode — the flag is a no-op.
```

Same for `Utils.loadScripts(network, t, v, true)` and every other
constructor in the file.

## Generated code

```js
// dist/cjs/generated-types/contracts.js (and esm equivalent)
var VendorVendorSpend = exports.VendorVendorSpend = _createClass(function VendorVendorSpend(config) {
  var trace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  _classCallCheck(this, VendorVendorSpend);
  _defineProperty(this, "Script", void 0);
  this.Script = (0, _uplc.cborToScript)(
    (0, _uplc.applyParamsToScript)(
      this.trace ? "<stripped-hex>" : "<traced-hex>",
      // ^^^^^^^^^^ always undefined → always selects the traced branch
      ...
    )
  );
});
```

`var trace` is captured from `arguments[1]`, but the constructor never writes
it onto `this`. Every reference to `this.trace` reads `undefined`.

## Impact

Cardano's `max_tx_size` protocol parameter is **16,384 bytes** on both
preprod and mainnet (verified via `cardano-cli conway query gov-state` /
Blockfrost `/epochs/latest/parameters`). Compiled bytecode after
`applyParamsToScript`:

| Validator | trace=true (stripped, intended) | trace=false (traced, current) |
|-----------|---------------------------------:|-------------------------------:|
| Treasury  | ~5.5 KB                          | ~12.1 KB                       |
| Vendor    | ~8.0 KB                          | ~16.9 KB                       |

The traced vendor validator is **larger than the entire tx-size cap**. It
cannot be inlined as a witness in any single tx, which means:

- Cannot register the vendor stake credential (`RegCert(scriptCred)`
  requires the script in the witness set; the validator alone is bigger
  than the tx limit).
- Cannot publish the vendor script as a reference output (same problem —
  the output's `referenceScript` field counts toward tx size).
- Cannot inline-witness the vendor validator for any spend.

We hit this exact wall registering vendor on preprod:
> `MaxTxSizeUTxO Mismatch (RelLTEQ) {supplied: 17712, expected: 16384}`

After locally patching the bug + passing `trace: true`, our combined
register tx (treasury + vendor + admin stake creds in one) drops from
~30 KB to **14.7 KB** and fits comfortably.

## Proposed fix

One-line change in the codegen template — assign the local to `this`:

```diff
 function VendorVendorSpend(config) {
   var trace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
   _classCallCheck(this, VendorVendorSpend);
+  _defineProperty(this, "trace", trace);
   _defineProperty(this, "Script", void 0);
   this.Script = ...applyParamsToScript(this.trace ? STRIPPED : TRACED, ...);
 }
```

Or, equivalently, change the ternary to read the local directly
(`trace ? STRIPPED : TRACED`) — which is what we patch in our workaround.

## Local workaround

Until a fixed release is published, consumers can patch the generated
files in postinstall:

```ts
// scripts/patch-sundae.ts
import { existsSync, readFileSync, writeFileSync } from "node:fs";

for (const path of [
  "node_modules/@sundaeswap/treasury-funds/dist/cjs/generated-types/contracts.js",
  "node_modules/@sundaeswap/treasury-funds/dist/esm/generated-types/contracts.js",
]) {
  if (!existsSync(path)) continue;
  const before = readFileSync(path, "utf8");
  const after = before.replace(/\bthis\.trace \?/g, "trace ?");
  if (after !== before) writeFileSync(path, after);
}
```

```json
// package.json
"scripts": { "postinstall": "... && bun scripts/patch-sundae.ts" }
```

After this patch, callers must explicitly pass `trace: true` to
`Utils.loadScripts(...)` and to each validator constructor to get the
stripped (production) bytecode.

## Note on naming

The variable is named `trace`, but `trace=true` selects the **stripped**
(no-trace) branch and `trace=false` selects the **traced** branch. That
inversion is unrelated to this bug, but worth flipping in a future API
revision (e.g. rename to `keepTraces` or default to stripping with an
opt-in `withTraces` flag).
