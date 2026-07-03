#!/usr/bin/env bun
/**
 * Insert a co-author's ed25519 witness into a CIP-100 governance anchor, after
 * verifying it — for authors who sign OUT-OF-BAND with a key we do not hold
 * (e.g. FluidTokens, the joint vendor). `sign-anchor.ts` signs authors[0] with
 * our own key; this fills any other author from a `(publicKey, signature)` pair
 * they produce themselves and send back.
 *
 * The witness recipe is identical to sign-anchor.ts (they MUST sign the same
 * bytes): canonicalize `{@context, body}` with URDNA2015 → N-Quads → blake2b-256
 * → the ed25519 signature is over that 32-byte hash. A CIP-100 author witness
 * signs ONLY `{@context, body}` — never the `authors` array — so every author
 * signs the identical body hash and their witnesses are independent.
 *
 * This tool REFUSES to write a witness unless BOTH hold:
 *   1. the signature verifies against the freshly-recomputed body hash, and
 *   2. blake2b-224(publicKey) == the expected payment key hash.
 * For FluidTokens the expected pkh is their vendor pkh baked into the script
 * params (1c471b31…). That second check makes the returned witness do double
 * duty: it is simultaneously (a) the CIP-100 author attestation and (b) the
 * proof-of-control of the vendor pkh that must be obtained before the immutable
 * mint. A witness that verifies but whose key hashes to the wrong pkh is either
 * the wrong key or an impostor — hard-fail, don't write it.
 *
 * Usage:
 *   bun scripts/insert-witness.ts gov/anchor.preview.json \
 *     --author FluidTokens \
 *     --pubkey <64-hex> --signature <128-hex> \
 *     [--network preview] [--expect-pkh <56-hex>]
 *
 * --author accepts a name (matched case-insensitively) or a 0-based index.
 * --expect-pkh overrides the pkh check target; otherwise it is taken from the
 * resolved config for --network (default preview) by author name (FluidTokens).
 * Idempotent: re-running with the same inputs rewrites the same witness.
 */

import { readFileSync, writeFileSync } from "node:fs";
// @ts-ignore - jsonld has CJS-only types that don't expose `canonize`
import jsonld from "jsonld";
import sodiumDefault from "libsodium-wrappers-sumo";
const sodium = sodiumDefault as unknown as {
  ready: Promise<void>;
  crypto_generichash: (outlen: number, input: Uint8Array) => Uint8Array;
  crypto_sign_verify_detached: (
    sig: Uint8Array,
    msg: Uint8Array,
    pk: Uint8Array,
  ) => boolean;
};
import { resolveConfig } from "../params/common";
import { previewRawConfig } from "../params/preview";
import { preprodRawConfig } from "../params/preprod";
import { assertAnchorValid } from "./lib/validate-anchor";

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

type Network = "preprod" | "preview";

interface Args {
  anchorPath: string;
  author: string;
  pubkey: string;
  signature: string;
  network: Network;
  expectPkh?: string | undefined;
}

function parseArgs(argv: string[]): Args {
  const positional: string[] = [];
  let author: string | undefined;
  let pubkey: string | undefined;
  let signature: string | undefined;
  let network: Network = "preview";
  let expectPkh: string | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const need = (v: string | undefined, flag: string): string => {
      if (!v) throw new Error(`${flag} requires a value`);
      return v;
    };
    switch (a) {
      case "--author":
        author = need(argv[++i], a);
        break;
      case "--pubkey":
        pubkey = need(argv[++i], a).toLowerCase();
        break;
      case "--signature":
        signature = need(argv[++i], a).toLowerCase();
        break;
      case "--network": {
        const v = need(argv[++i], a);
        if (v !== "preprod" && v !== "preview") {
          throw new Error(`--network must be preprod|preview (got ${v})`);
        }
        network = v;
        break;
      }
      case "--expect-pkh":
        expectPkh = need(argv[++i], a).toLowerCase();
        break;
      default:
        if (a.startsWith("--")) throw new Error(`unknown flag: ${a}`);
        positional.push(a);
    }
  }
  if (positional.length !== 1) {
    throw new Error(
      "usage: bun scripts/insert-witness.ts <anchor.json> --author <name|idx> --pubkey <hex> --signature <hex> [--network preview] [--expect-pkh <hex>]",
    );
  }
  if (author === undefined) throw new Error("--author is required");
  if (!pubkey) throw new Error("--pubkey is required");
  if (!signature) throw new Error("--signature is required");
  if (!/^[0-9a-f]{64}$/.test(pubkey)) {
    throw new Error(`--pubkey must be 64 hex chars (32-byte ed25519 key), got ${pubkey.length}`);
  }
  if (!/^[0-9a-f]{128}$/.test(signature)) {
    throw new Error(`--signature must be 128 hex chars (64-byte ed25519 sig), got ${signature.length}`);
  }
  return { anchorPath: positional[0]!, author, pubkey, signature, network, expectPkh };
}

/** Locate the target author by 0-based index or case-insensitive name. */
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
    throw new Error(
      `no author named "${sel}"; anchor has: ${authors.map((a) => a.name).join(", ")}`,
    );
  }
  return idx;
}

/** Expected pkh for an author name from the resolved config. Only FluidTokens
 *  has a config-derived pkh; other names require an explicit --expect-pkh. */
function expectedPkhFor(name: string, network: Network): string {
  const raw = network === "preprod" ? preprodRawConfig : previewRawConfig;
  const resolved = resolveConfig(raw);
  if (name.toLowerCase() === "fluidtokens") return resolved.fluidTokensPkh;
  throw new Error(
    `no config-derived pkh for author "${name}" — pass --expect-pkh explicitly`,
  );
}

async function main(): Promise<void> {
  await sodium.ready;
  const args = parseArgs(process.argv.slice(2));
  const anchor = JSON.parse(readFileSync(args.anchorPath, "utf8")) as Anchor;
  if (!anchor.body || !anchor["@context"]) {
    throw new Error(`${args.anchorPath} is missing @context or body`);
  }
  if (!anchor.authors || anchor.authors.length === 0) {
    throw new Error(`${args.anchorPath} has no authors[]`);
  }
  const idx = findAuthorIndex(anchor.authors, args.author);
  const target = anchor.authors[idx]!;

  // Recompute the body hash exactly as sign-anchor.ts does.
  const subset = { "@context": anchor["@context"], body: anchor.body };
  const canonize = (jsonld as { canonize: (...a: unknown[]) => Promise<string> }).canonize;
  const canonized = await canonize(subset, {
    algorithm: "URDNA2015",
    format: "application/n-quads",
    safe: true,
  });
  const payload = canonized.endsWith("\n") ? canonized : canonized + "\n";
  const payloadBytes = new TextEncoder().encode(payload);
  const bodyHash = sodium.crypto_generichash(32, payloadBytes);
  const bodyHashHex = Buffer.from(bodyHash).toString("hex");

  const pubBytes = Buffer.from(args.pubkey, "hex");
  const sigBytes = Buffer.from(args.signature, "hex");

  // Check 1: the signature must verify against the freshly-recomputed body hash.
  const ok = sodium.crypto_sign_verify_detached(sigBytes, bodyHash, pubBytes);
  if (!ok) {
    throw new Error(
      `signature does NOT verify for author "${target.name}" against body hash ${bodyHashHex}.\n` +
        `The signer must sign THIS body (did the body change after they signed, or is the pubkey wrong?).`,
    );
  }

  // Check 2: blake2b-224(pubkey) must equal the expected payment key hash.
  const derivedPkh = Buffer.from(sodium.crypto_generichash(28, pubBytes)).toString("hex");
  const expectPkh = args.expectPkh ?? expectedPkhFor(target.name, args.network);
  if (derivedPkh !== expectPkh) {
    throw new Error(
      `pubkey hashes to pkh ${derivedPkh} but expected ${expectPkh} for author "${target.name}".\n` +
        `The witness verifies but the key is not the one bound to the expected pkh — refusing to insert.`,
    );
  }

  target.witness.witnessAlgorithm = "ed25519";
  target.witness.publicKey = args.pubkey;
  target.witness.signature = args.signature;

  assertAnchorValid(anchor, `anchor with ${target.name} witness (${args.anchorPath})`);
  writeFileSync(args.anchorPath, JSON.stringify(anchor, null, 2) + "\n");
  console.log(`Inserted witness for author[${idx}] "${target.name}" into ${args.anchorPath} (schema-valid)`);
  console.log(`  body blake2b-256 : ${bodyHashHex}`);
  console.log(`  publicKey        : ${args.pubkey}`);
  console.log(`  derived pkh      : ${derivedPkh} (== expected ✓)`);
  console.log(`  signature        : ${args.signature.slice(0, 32)}…`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
