#!/usr/bin/env bun
/**
 * Sign a CIP-100 governance anchor JSON in place.
 *
 * Per CIP-100, each entry of `authors[]` MUST have a `witness` containing
 * an ed25519 signature over the canonicalized body. The exact recipe:
 *
 *   1. Take a filtered subset of the document = `{ "@context", "body" }`.
 *      (Doing the filter at the JSON-LD level — rather than canonicalizing
 *      everything and then trying to filter the resulting N-Quads to the
 *      body subgraph — is the trick used by gitmachtl/cardano-signer; it
 *      avoids re-implementing RDF subgraph extraction.)
 *   2. Canonicalize that with URDNA2015, output `application/n-quads`.
 *   3. Ensure the result ends with a newline.
 *   4. blake2b-256 the UTF-8 bytes of (2).
 *   5. ed25519-sign that hash with the author's secret key.
 *   6. Write the hex-encoded public key + signature into the
 *      author's `witness.publicKey` / `witness.signature`.
 *
 * Usage:
 *   bun scripts/sign-anchor.ts gov/anchor.preprod.json [--key keys/admin.skey]
 *     [--author <name|idx>] [--print-only]
 *
 * --author selects which authors[] entry to sign (0-based index or
 *   case-insensitive name); default 0. --print-only computes and prints the
 *   publicKey/signature WITHOUT modifying the file — the mode an out-of-band
 *   co-author (e.g. FluidTokens) uses to report their witness back for
 *   insertion via insert-witness.ts.
 *
 * Idempotent: re-running with the same key produces the same signature.
 * The `body` and `@context` are NOT modified — only the witness fields
 * inside `authors[]` are filled in. (Modifying anything else would
 * invalidate the signature.)
 */

import { readFileSync, writeFileSync } from "node:fs";
// @ts-ignore - jsonld has CJS-only types that don't expose `canonize`
import jsonld from "jsonld";
import sodiumDefault from "libsodium-wrappers-sumo";
const sodium = sodiumDefault as unknown as {
  ready: Promise<void>;
  crypto_generichash: (outlen: number, input: Uint8Array) => Uint8Array;
};
import {
  Ed25519PrivateKey,
  Ed25519PrivateNormalKeyHex,
  Ed25519PrivateExtendedKeyHex,
  HexBlob,
} from "@blaze-cardano/core";
import { assertAnchorValid } from "./lib/validate-anchor";

/** Load an ed25519 signing key from a raw hex string, accepting BOTH key
 *  shapes we deal with: a 32-byte "normal" key (64 hex — cardano-cli / our
 *  gen-keys operator key) and a 64-byte "extended" Ed25519-BIP32 key (128 hex —
 *  what a mnemonic/wallet-derived key is, e.g. FluidTokens' vendor key produced
 *  by scripts/mnemonic-to-key.ts). Extended-key signatures verify under
 *  standard ed25519, so downstream verification/insertion is identical. */
function loadSigningKey(skHex: string): Ed25519PrivateKey {
  const hex = skHex.trim().toLowerCase();
  if (/^[0-9a-f]{64}$/.test(hex)) {
    return Ed25519PrivateKey.fromNormalHex(Ed25519PrivateNormalKeyHex(hex));
  }
  if (/^[0-9a-f]{128}$/.test(hex)) {
    return Ed25519PrivateKey.fromExtendedHex(Ed25519PrivateExtendedKeyHex(hex));
  }
  throw new Error(
    `key must be raw hex: 64 chars (32-byte normal) or 128 chars (64-byte extended); got ${hex.length} chars`,
  );
}

interface Witness {
  witnessAlgorithm: string;
  publicKey: string;
  signature: string;
}
interface Author {
  name: string;
  witness: Witness;
}
interface Anchor {
  "@context": unknown;
  hashAlgorithm: string;
  body: unknown;
  authors: Author[];
}

function parseArgs(argv: string[]): {
  anchorPath: string;
  keyPath: string;
  author: string;
  printOnly: boolean;
} {
  const positional: string[] = [];
  let keyPath = "keys/admin.skey";
  let author = "0";
  let printOnly = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--key") {
      const v = argv[++i];
      if (!v) throw new Error("--key requires a path");
      keyPath = v;
    } else if (a === "--author") {
      const v = argv[++i];
      if (!v) throw new Error("--author requires a value");
      author = v;
    } else if (a === "--print-only") {
      printOnly = true;
    } else if (a.startsWith("--")) {
      throw new Error(`unknown flag: ${a}`);
    } else {
      positional.push(a);
    }
  }
  if (positional.length !== 1) {
    throw new Error(
      "usage: bun scripts/sign-anchor.ts <anchor.json> [--key keys/admin.skey] [--author <name|idx>] [--print-only]",
    );
  }
  return { anchorPath: positional[0]!, keyPath, author, printOnly };
}

/** Locate an author by 0-based index or case-insensitive name. */
function findAuthorIndex(authors: Author[], sel: string): number {
  if (/^\d+$/.test(sel)) {
    const idx = Number(sel);
    if (idx < 0 || idx >= authors.length) {
      throw new Error(`--author index ${idx} out of range (0..${authors.length - 1})`);
    }
    return idx;
  }
  const idx = authors.findIndex((a) => a.name.toLowerCase() === sel.toLowerCase());
  if (idx < 0) {
    throw new Error(`no author named "${sel}"; anchor has: ${authors.map((a) => a.name).join(", ")}`);
  }
  return idx;
}

async function main(): Promise<void> {
  await sodium.ready;

  const { anchorPath, keyPath, author, printOnly } = parseArgs(process.argv.slice(2));
  const anchor = JSON.parse(readFileSync(anchorPath, "utf8")) as Anchor;
  if (!anchor.body || !anchor["@context"]) {
    throw new Error(`${anchorPath} is missing @context or body`);
  }
  if (!anchor.authors || anchor.authors.length === 0) {
    throw new Error(
      `${anchorPath} has no authors[] to sign — build-anchor should emit at least one placeholder`,
    );
  }
  const authorIdx = findAuthorIndex(anchor.authors, author);

  // Step 1+2: canonicalize {@context, body} via URDNA2015 → N-Quads.
  const subset = { "@context": anchor["@context"], body: anchor.body };
  // jsonld's TS types omit canonize; the function is present at runtime.
  const canonize = (jsonld as { canonize: (...a: unknown[]) => Promise<string> })
    .canonize;
  const canonized = await canonize(subset, {
    algorithm: "URDNA2015",
    format: "application/n-quads",
    safe: true,
  });

  // Step 3: ensure trailing newline (URDNA2015 N-Quads output already does,
  // but be defensive — the spec is explicit).
  const payload = canonized.endsWith("\n") ? canonized : canonized + "\n";
  const payloadBytes = new TextEncoder().encode(payload);

  // Step 4: blake2b-256 of the canonicalized bytes.
  const bodyHashBytes = sodium.crypto_generichash(32, payloadBytes);
  const bodyHashHex = Buffer.from(bodyHashBytes).toString("hex");

  // Step 5: ed25519 sign that hash (normal or extended key — auto-detected).
  const sk = loadSigningKey(readFileSync(keyPath, "utf8"));
  const pk = sk.toPublic();
  const signature = sk.sign(HexBlob(bodyHashHex));

  // --print-only: report the witness for an out-of-band co-author to hand
  // back (inserted + verified later via insert-witness.ts). Write nothing —
  // the signer may not even hold the canonical anchor file.
  if (printOnly) {
    console.log(`Witness for author[${authorIdx}] "${anchor.authors[authorIdx]!.name}" (NOT written):`);
    console.log(`  body blake2b-256 : ${bodyHashHex}`);
    console.log(`  publicKey        : ${pk.hex()}`);
    console.log(`  signature        : ${signature.hex()}`);
    console.log(`\nSend the publicKey and signature back to the anchor maintainer.`);
    return;
  }

  // Step 6: fill in the selected author's witness. Other authors need their
  // own signing pass with their own keys (or insert-witness.ts).
  const witness = anchor.authors[authorIdx]!.witness;
  witness.witnessAlgorithm = "ed25519";
  witness.publicKey = pk.hex();
  witness.signature = signature.hex();

  assertAnchorValid(anchor, `signed anchor (${anchorPath})`);
  writeFileSync(anchorPath, JSON.stringify(anchor, null, 2) + "\n");
  console.log(`Signed ${anchorPath} (schema-valid)`);
  console.log(`  canonicalized body: ${payloadBytes.byteLength} bytes`);
  console.log(`  body blake2b-256  : ${bodyHashHex}`);
  console.log(`  author            : [${authorIdx}] ${anchor.authors[authorIdx]!.name}`);
  console.log(`  publicKey         : ${witness.publicKey}`);
  console.log(`  signature         : ${witness.signature.slice(0, 32)}…`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
