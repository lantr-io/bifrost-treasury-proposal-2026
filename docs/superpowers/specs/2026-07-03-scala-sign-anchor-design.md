# Design: `sign-anchor` in Scala/scalus (parity oracle)

**Date:** 2026-07-03
**Status:** Design — awaiting user review
**Ports:** `scripts/sign-anchor.ts` → `treasury-publish/` (Scala/scalus)

## Goal

Give the Scala pipeline (`treasury-publish/`) its own implementation of the
CIP-100 anchor signer, mirroring the bun `scripts/sign-anchor.ts`. It must
produce a **byte-identical** `authors[].witness` (publicKey + signature) to the
bun path, enforced by an offline parity test — consistent with this repo's
"two pipelines in lockstep" principle. This extends Scala's coverage of the
preview workflow (it already owns `init`/`register`/`gov`; the anchor
build/sign/pin steps are currently bun-only).

**Non-goal:** re-implementing CIP-108 *schema validation* in Scala. The bun
pipeline remains the schema source of truth (as with title-length: Scala's
`BuildGovAction` only guards the one field it must). Scala's signer does a
structural sanity check, not full JSON-schema validation.

## Background: what CIP-100 signing requires

The recipe (verbatim from the bun script, which is correct and shipping):

1. Filter the document to the subset `{ "@context", "body" }`.
2. Canonicalize that with **URDNA2015**, output `application/n-quads`.
3. Ensure the result ends with a newline.
4. **blake2b-256** the UTF-8 bytes of (2) → 32-byte body hash.
5. **ed25519**-sign that 32-byte hash (the hash *is* the message; ed25519 does
   not re-hash a digest here) with the author's secret key.
6. Write hex `publicKey` + `signature` into `authors[0].witness`.

The `@context` in our anchor is an **inline** JSON-LD context (not a URL), so the
processor never needs a network document loader.

## What is already available in scalus (the easy 80%)

- **blake2b-256** — `scalus.uplc.builtin.Builtins.blake2b_256` (used throughout
  `BuildGovAction.scala`).
- **ed25519 (deterministic)** —
  `scalus.crypto.ed25519.JvmEd25519Signer.sign(SigningKey, message: ByteString)`
  signs the raw message bytes (RFC 8032 deterministic), and
  `.derivePublicKey(SigningKey)`. `SigningKey.unsafeFromByteString(...)` loads a
  raw 32-byte "normal" ed25519 key — the same encoding the bun side loads via
  `Ed25519PrivateNormalKeyHex`. Same 32-byte seed on both sides ⇒ identical
  public key and signature.
- **Key loading** — `Chain.loadAdminKeys("keys")` already derives the admin
  signing key from `keys/admin.skey`.

The only capability scalus does **not** provide is JSON-LD / URDNA2015
canonicalization.

## The one dependency: URDNA2015 on the JVM

**Titanium JSON-LD** (`com.apicatalog:titanium-json-ld`) + its RDF
canonicalization module **`com.apicatalog:titanium-rdfc`** (implements
**RDFC-1.0**, the renamed-but-compatible successor to URDNA2015). Pure JVM,
Maven-published, W3C-conformant (passes the official RDFC test suite, same as
the JS `jsonld@9` library the bun script uses).

- Exact compatible version pair + the `RdfCanon`/`NQuadsWriter` API surface are
  pinned by the spike (see Step 0). `titanium-rdfc` 3.x requires **Java 21+**;
  the spike also confirms the toolchain JDK satisfies this.
- Added to `treasury-publish/project.scala` as two `//> using dep` lines.

### The entire risk of this project, stated plainly

Does Titanium RDFC emit **byte-identical** canonical N-Quads to JS `jsonld`
(`algorithm: "URDNA2015"`) for *our* document? If yes → identical blake2b hash →
(ed25519 being deterministic) identical `publicKey`+`signature`, and the parity
test is exact equality. If Titanium differs by even one byte (literal escaping,
blank-node labelling over the `references[]` set, language-tag form) the
signatures diverge and the port is worthless.

Both libraries pass the RDFC conformance suite, so a match is *expected* — but it
is **proven by the spike + fixture test, never assumed.** This is why the plan
front-loads a throwaway spike.

## Architecture

Three isolated pieces so the risky part (canonicalization) is independently
testable, plus one fixture/oracle.

### 1. `treasury-publish/AnchorSigning.scala` — pure, no I/O

The parity-testable core.

```scala
object AnchorSigning:
  /** Steps 1-3: filter to {@context, body}, URDNA2015 → N-Quads UTF-8 bytes,
    * trailing newline guaranteed. */
  def canonicalize(anchor: ujson.Value): Array[Byte]

  /** Step 4: blake2b-256 of the canonicalized bytes. */
  def bodyHash(anchor: ujson.Value): ByteString   // = blake2b_256(canonicalize(anchor))

  /** Steps 5-6: returns the witness fields for one author. */
  final case class Witness(witnessAlgorithm: String, publicKeyHex: String, signatureHex: String)
  def sign(anchor: ujson.Value, sk: SigningKey): Witness
```

Implementation notes:
- **Feeding Titanium:** build the `{@context, body}` subset with ujson, serialize
  to a string, parse into a Titanium `JsonDocument`
  (`JsonDocument.of(new StringReader(subsetJson))`). The exact bytes we feed in
  don't matter — canonicalization normalizes them; only the *values* matter, and
  the body is entirely strings + nested objects (no numbers).
- **N-Quads output:** `JsonLd.toRdf(doc).get()` → feed quads to the RDFC
  canonicalizer → serialize canonical N-Quads → ensure single trailing `\n`.
- `sign` = `blake2b_256(canonicalize)` then
  `JvmEd25519Signer.sign(sk, hashByteString)`; publicKey via `derivePublicKey`.

### 2. `treasury-publish/SignAnchorTool.scala` — the CLI, mirrors bun

```
scala-cli run treasury-publish --main-class treasurypublish.signAnchor \
  gov/anchor.preview.json [--key keys/admin.skey]
```

- Parse args (positional anchor path; `--key`, default `keys/admin.skey`) —
  same surface as the bun script.
- Read anchor (ujson). Assert `@context`, `body`, and a non-empty `authors[]`
  exist (the same structural preconditions the bun script asserts).
- `w = AnchorSigning.sign(anchor, sk)`; write into `authors[0].witness`
  (`witnessAlgorithm="ed25519"`, `publicKey`, `signature`). Only the first
  author is signed (multi-author = separate passes, as in bun).
- Write back with 2-space indent + trailing newline. Print the same summary
  lines as bun (canonical byte length, body blake2b hex, author, publicKey,
  signature prefix). Idempotent.

### 3. Parity gate — offline golden fixture

Mirrors the existing `parity.test.scala` / `fixtures/parity-preprod.json`
pattern (deterministic, no network).

- **Fixture anchor** `treasury-publish/fixtures/anchor-sign-fixture.json` — a
  *small, dedicated, never-changing* CIP-108 anchor built to stress exactly the
  divergence risks (so it doesn't churn with the real proposal):
  - the real inline CIP-108 `@context` incl. `@language: "en-us"`;
  - a `references[]` **set** of 2-3 entries → exercises blank-node labelling and
    ordering (the part of URDNA2015 that actually does work);
  - prose fields (`abstract`/`motivation`) containing a **unicode** char, a
    **double quote**, and a **newline** → exercises canonical N-Quads literal
    escaping;
  - one `authors[0]` with empty witness.
- **Oracle** `scripts/sign-parity-oracle.ts` (bun; add
  `"sign-parity-oracle"` to `package.json` scripts) — deterministic, no network.
  Canonicalizes the fixture with `jsonld` and signs the hash with a **fixed,
  committed, clearly-test-only** 32-byte ed25519 key. Emits
  `treasury-publish/fixtures/sign-parity.json`:
  ```json
  {
    "canonicalNQuads": "<full N-Quads string>",
    "bodyHashHex": "<blake2b-256 hex>",
    "testSecretKeyHex": "<the fixed test key, for the Scala test to load>",
    "testPublicKeyHex": "<hex>",
    "testSignatureHex": "<hex>"
  }
  ```
- **Test** `treasury-publish/sign-anchor.parity.test.scala`:
  1. **Canonicalization parity (the crux):**
     `new String(AnchorSigning.canonicalize(fixtureAnchor), UTF_8) == fixture.canonicalNQuads`
     — full-string compare for a legible diff on mismatch.
  2. **Hash parity:** `AnchorSigning.bodyHash(fixtureAnchor).toHex == fixture.bodyHashHex`.
  3. **Signature parity (closes the ed25519 loop):** signing with
     `testSecretKeyHex` yields `testPublicKeyHex` / `testSignatureHex`.

## Step 0 — spike (throwaway, run first)

Before writing any of the above, a minimal scala-cli snippet that:
1. loads `titanium-json-ld` + `titanium-rdfc`,
2. canonicalizes `treasury-publish/fixtures/anchor-sign-fixture.json`,
3. prints the N-Quads;

and a one-liner bun that prints `jsonld`'s N-Quads for the same file. **Diff
them byte-for-byte.**

- **Match** → parity confirmed; the spike also pins the working version pair and
  the exact `RdfCanon`/`NQuadsWriter` API. Proceed with the full build.
- **Mismatch** → stop and diagnose (escaping? blank-node order? trailing
  newline?). If Titanium can't be made to match, fall back to
  `setl/rdf-urdna` (older, explicitly URDNA2015-named) or, worst case, report
  back that pure-JVM parity isn't achievable and reconsider scope. **Do not
  build the CLI/test until the spike is green.**

## Files touched

| File | Change |
|---|---|
| `treasury-publish/project.scala` | +2 `//> using dep` (titanium-json-ld, titanium-rdfc) |
| `treasury-publish/AnchorSigning.scala` | **new** — canonicalize / bodyHash / sign |
| `treasury-publish/SignAnchorTool.scala` | **new** — `@main def signAnchor` CLI |
| `treasury-publish/sign-anchor.parity.test.scala` | **new** — 3-assertion parity gate |
| `treasury-publish/fixtures/anchor-sign-fixture.json` | **new** — stress fixture |
| `treasury-publish/fixtures/sign-parity.json` | **new** — bun-generated oracle output |
| `scripts/sign-parity-oracle.ts` | **new** — oracle generator |
| `package.json` | +`"sign-parity-oracle"` script |
| `CLAUDE.md` | note the new parity fixture in the parity-regeneration list; add the scala sign-anchor to the workflow/mains |

## Known secondary risk (not a gate)

Written-file whitespace: `ujson.write(indent=2)` vs bun's
`JSON.stringify(…, null, 2)` may differ cosmetically (key order, spacing). The
**authoritative** equality is the witness fields (proven by the parity test),
*not* file whitespace. Match formatting best-effort so git diffs stay clean
regardless of which pipeline signs, but do not gate the design on it.

## Success criteria

1. Spike proves byte-identical N-Quads (Titanium vs `jsonld`) on the fixture.
2. `scala-cli test treasury-publish` passes, incl. the 3 new parity assertions.
3. `scala-cli run … --main-class treasurypublish.signAnchor gov/anchor.preview.json`
   produces the same `publicKey`+`signature` as
   `bun run sign-anchor gov/anchor.preview.json` (verified once, live, with the
   real key — belt-and-braces beyond the offline fixture).
4. No new business-logic tests for SundaeSwap code; no contract changes.
