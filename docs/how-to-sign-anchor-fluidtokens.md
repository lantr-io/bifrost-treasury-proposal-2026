# How to co-sign the Bifrost governance anchor (FluidTokens)

This is a step-by-step guide for the **FluidTokens** team to add their author
witness to the Bifrost Bridge Phase 1 treasury-withdrawal **governance-action
anchor** (CIP-100 / CIP-108). Lantr has already signed as the first author; we
need FluidTokens as the second co-author before the proposal is pinned and
submitted.

You do **not** need to run a node, hold ADA, or submit anything. You produce two
hex strings (a public key and a signature) and send them back. That's it.

---

## What you are signing, and why it matters twice

A CIP-100 author witness is an ed25519 signature over the **canonicalized
`{@context, body}`** of the anchor JSON — the proposal metadata (title,
abstract, motivation, rationale, references). It is **not** a Cardano
transaction and moves no funds. It only attests: *"FluidTokens co-authors this
proposal."*

The signature covers only `@context` + `body`. It does **not** cover the
`authors` array, so Lantr's signature and yours are independent and both sign
the **identical body hash**.

**Use the ed25519 key whose payment key hash is your Bifrost vendor pkh:**

```
1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175
```

This is deliberate. When you sign with that exact key, the witness we receive
does double duty:

1. it is your **CIP-100 author attestation** on the proposal, and
2. it is the **proof-of-control of your vendor pkh** that must be established
   before the immutable treasury/vendor mint (previously outstanding as "obtain
   FluidTokens' vkey + a proof-of-control signature").

Our insertion tool **rejects** any witness whose public key does not hash to
`1c471b31…`, so please sign with the right key.

## The one cross-check that guarantees success

Whatever tool you use, it must arrive at this **body hash** (blake2b-256 of the
canonicalized `{@context, body}`):

```
6bca0ed8b5b3b791eb273f49057f26973206d4c34cf02583e2858a727d3a73d8
```

If your tool prints this exact hash, your signature **will** verify on our side.
If it prints something else, the anchor body changed or the canonicalization
differs — stop and tell us before signing.

> ⚠️ The body is **frozen** at this hash. If we later edit the proposal text,
> this hash changes and any earlier signature becomes invalid — we will send you
> a new hash to re-sign. Always sign the hash in the message that delivered the
> anchor to you.

---

## What we need back

Two hex strings for the `FluidTokens` author:

- **publicKey** — 64 hex chars (32-byte ed25519 verification key)
- **signature** — 128 hex chars (64-byte ed25519 signature)

Send them over any channel; they are public data. We insert them with
`scripts/insert-witness.ts`, which re-verifies the signature against the body
hash **and** checks the key hashes to `1c471b31…` before writing.

---

## Path A — use our script (recommended, guaranteed byte-identical)

This reuses the exact canonicalization the maintainer uses, so there is zero
risk of a recipe mismatch. It **writes nothing** and needs no secrets beyond
your signing key file.

```bash
# 1. Clone the governance repo and install deps (bun — https://bun.sh)
git clone https://github.com/lantr-io/bifrost-treasury-proposal-2026
cd bifrost-treasury-proposal-2026
bun install

# 2. Put your ed25519 signing key (raw 64-hex private key, the one behind
#    pkh 1c471b31…) in a file, e.g. ft.skey  — a cardano-cli PaymentSigningKey
#    'cborHex' works too if you strip the CBOR header to the raw 32-byte seed;
#    ask us if unsure.

# 3. Print your witness WITHOUT modifying the anchor:
bun scripts/sign-anchor.ts gov/anchor.preview.json \
  --key ft.skey --author FluidTokens --print-only
```

It prints `body blake2b-256`, `publicKey`, and `signature`. Confirm the body
hash equals `6bca0ed8…`, then send us the `publicKey` and `signature` lines.

## Path B — use `cardano-signer` (gitmachtl reference tool)

If you prefer the community reference tool
(<https://github.com/gitmachtl/cardano-signer>), it implements the same
CIP-100 recipe:

```bash
cardano-signer sign --cip100 \
  --data-file gov/anchor.preview.json \
  --secret-key ft.skey \
  --author-name "FluidTokens" \
  --out-file anchor.ft-signed.json
```

Open `anchor.ft-signed.json`, find the `FluidTokens` entry in `authors[]`, and
send us its `witness.publicKey` and `witness.signature`. (cardano-signer also
prints the canonicalized-body hash — verify it is `6bca0ed8…`.)

## Path C — raw recipe (your own tooling)

If you sign with your own code, the exact steps are:

1. Take the subset `{ "@context": <anchor.@context>, "body": <anchor.body> }`.
2. Canonicalize it with **URDNA2015**, output **`application/n-quads`**.
3. Ensure the output ends with a newline (`\n`).
4. **blake2b-256** the UTF-8 bytes → 32-byte body hash (must be `6bca0ed8…`).
5. **ed25519-sign that 32-byte hash** (raw ed25519, not ed25519ph) with your key.
6. Report `publicKey` (hex) and `signature` (hex).

This is the same recipe as `scripts/sign-anchor.ts` and
`scripts/insert-witness.ts` in this repo — read those if you want a reference
implementation (jsonld URDNA2015 + libsodium blake2b + ed25519).

---

## How we verify and insert your witness (for transparency)

```bash
bun scripts/insert-witness.ts gov/anchor.preview.json \
  --author FluidTokens \
  --pubkey <your 64-hex publicKey> \
  --signature <your 128-hex signature> \
  --network preview
```

The tool refuses to write unless **both**: (1) the signature verifies against
the freshly-recomputed body hash, and (2) `blake2b-224(publicKey) ==
1c471b31…`. On success the anchor carries both authors and is ready to pin +
submit.

> Note on networks: the preview and mainnet anchors share the same proposal
> `body` and the same FluidTokens vendor pkh, so a signature over one network's
> body hash is specific to that body. For the mainnet submission we will send
> you the mainnet body hash to sign (same procedure, different hash).
