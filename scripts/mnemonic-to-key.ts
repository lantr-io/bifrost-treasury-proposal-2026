#!/usr/bin/env bun
/**
 * Derive a Cardano payment signing key from a BIP-39 mnemonic (recovery phrase)
 * and print it as raw hex, ready for scripts/sign-anchor.ts.
 *
 * A mnemonic-derived Cardano key is an EXTENDED Ed25519-BIP32 key (64-byte
 * scalar+prefix, 128 hex chars) — not a plain 32-byte key. This does the
 * standard CIP-1852 derivation (m/1852'/1815'/account'/role/index) entirely
 * in-repo via @blaze-cardano/core (no cardano-address / cardano-cli needed) and
 * prints:
 *   - the extended private key hex (what you put in a key file for sign-anchor)
 *   - the public key hex
 *   - the derived payment key hash (pkh) — VERIFY this equals the pkh you expect
 *     (for FluidTokens: 1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175)
 *
 * The mnemonic is read from a file or stdin — never from argv, so it does not
 * land in your shell history or the process table.
 *
 * Usage:
 *   bun scripts/mnemonic-to-key.ts --phrase-file phrase.txt [--path 1852H/1815H/0H/0/0]
 *   echo "word1 word2 …" | bun scripts/mnemonic-to-key.ts [--path …] [--out ft.skey]
 *
 * Flags:
 *   --phrase-file <path>   read the mnemonic from this file (else stdin)
 *   --passphrase-file <p>  optional BIP-39 passphrase ("25th word"); default none
 *   --path <derivation>    CIP-1852 path, default 1852H/1815H/0H/0/0
 *                          (H or ' = hardened). Change the last two indices if
 *                          the target key is at a different role/index.
 *   --out <path>           also write the extended key hex to this file (0600)
 */

import { readFileSync, writeFileSync } from "node:fs";
import sodiumDefault from "libsodium-wrappers-sumo";
import * as core from "@blaze-cardano/core";

const sodium = sodiumDefault as unknown as {
  ready: Promise<void>;
  crypto_generichash: (outlen: number, input: Uint8Array) => Uint8Array;
};

const HARDENED = 0x80000000;

interface Args {
  phraseFile?: string;
  passphraseFile?: string;
  path: string;
  out?: string;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { path: "1852H/1815H/0H/0/0" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    const need = (flag: string): string => {
      const v = argv[++i];
      if (!v) throw new Error(`${flag} requires a value`);
      return v;
    };
    switch (a) {
      case "--phrase-file": out.phraseFile = need(a); break;
      case "--passphrase-file": out.passphraseFile = need(a); break;
      case "--path": out.path = need(a); break;
      case "--out": out.out = need(a); break;
      default:
        throw new Error(`unknown flag: ${a} (mnemonic is read from --phrase-file or stdin, never argv)`);
    }
  }
  return out;
}

/** Parse "1852H/1815H/0H/0/0" (H or ' = hardened) into CIP-1852 indices. */
function parsePath(path: string): number[] {
  return path.split("/").map((seg) => {
    const m = seg.trim().match(/^(\d+)(['H]?)$/);
    if (!m) throw new Error(`bad path segment "${seg}" in "${path}"`);
    const n = Number(m[1]);
    return m[2] ? n + HARDENED : n;
  });
}

/** Collapse all whitespace runs to single spaces and trim — tolerant of a
 *  phrase file with newlines or trailing blanks. */
function normalizePhrase(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function readStdin(): string {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

async function main(): Promise<void> {
  await sodium.ready;
  const args = parseArgs(process.argv.slice(2));

  const rawPhrase = args.phraseFile
    ? readFileSync(args.phraseFile, "utf8")
    : readStdin();
  const phrase = normalizePhrase(rawPhrase);
  if (!phrase) {
    throw new Error("no mnemonic provided — pass --phrase-file <path> or pipe it on stdin");
  }
  const words = phrase.split(" ").length;
  if (![12, 15, 18, 21, 24].includes(words)) {
    throw new Error(`mnemonic has ${words} words — expected 12/15/18/21/24`);
  }
  const passphrase = args.passphraseFile
    ? readFileSync(args.passphraseFile, "utf8").trim()
    : "";

  const indices = parsePath(args.path);
  // mnemonicToEntropy returns raw entropy BYTES (a Uint8Array), not a hex string.
  const entropy = core.mnemonicToEntropy(phrase, (core as { wordlist?: unknown }).wordlist as never);
  const root = core.Bip32PrivateKey.fromBip39Entropy(Buffer.from(entropy), passphrase);
  const raw = root.derive(indices).toRawKey(); // extended Ed25519PrivateKey
  const extHex = raw.hex();
  const pubHex = (await raw.toPublic()).hex();
  const pkh = Buffer.from(
    sodium.crypto_generichash(28, Buffer.from(pubHex, "hex")),
  ).toString("hex");

  if (args.out) {
    writeFileSync(args.out, extHex + "\n", { mode: 0o600 });
  }

  console.log(`derivation path : m/${args.path}  (${words}-word mnemonic)`);
  console.log(`public key      : ${pubHex}`);
  console.log(`payment key hash: ${pkh}`);
  console.log(`  → VERIFY this equals your expected pkh before signing.`);
  console.log(`    FluidTokens vendor pkh: 1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175`);
  if (args.out) {
    console.log(`\nWrote extended private key hex → ${args.out} (chmod 600). Keep it secret; delete after signing.`);
    console.log(`Next: bun scripts/sign-anchor.ts gov/anchor.preview.json --key ${args.out} --author FluidTokens --print-only`);
  } else {
    console.log(`\nextended private key hex (SECRET — do not share):`);
    console.log(extHex);
    console.log(`\nSave it to a file (e.g. ft.skey), then:`);
    console.log(`  bun scripts/sign-anchor.ts gov/anchor.preview.json --key ft.skey --author FluidTokens --print-only`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
