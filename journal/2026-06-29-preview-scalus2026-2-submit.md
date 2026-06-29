# Preview SUBMISSION — scalus2026-2, broadcast via the Scalus pipeline

**Network:** preview (testnet) — **submitted on-chain.**
**Date:** 2026-06-29
**Broadcast by:** the Scalus `treasury-publish` tools (`--submit`). Each stage
was gated by a live bun⇄scalus dry-run diff (byte-identical deterministic
artifacts) immediately before broadcasting. First on-chain proof of the Scalus
submit path (tx-build + local CEK ExUnits eval + Blockfrost submit).

## Deploy coordinates (fresh, seed-forced)

| Item | Value |
|---|---|
| Seed UTxO | `5835e17fc1b4d38398dab755c4c35aa705cca75fab80ae9fd4bfd72714a548d0#0` |
| Registry policy | `18d7beac6c0a3e364bab987b83b5379295b349ca42032af831e7b475` |
| Treasury script hash | `7ec9559c42c7bc22559f30e9258834714a5ca1a4085e5ad7de84e990` |
| Vendor script hash | `4bcff32e6a242fad82bbe8046062f56e9b1ed26c6d62fbeb81a37216` |
| Treasury reward acct | `stake_test17plvj4vugtrmcgj4nucwjfvgx3c55h9p5sy9ukkhm6zwnyq9u926j` |
| Vendor reward acct | `stake_test17p9uluewdgjzltvzh05qgcrz74hfk8kjd3kk97ltsx3hy9seaqgcn` |
| Admin reward acct | `stake_test1uzlvah74gljhkhehgh5u5dywmuljtm2v068nh7prgpp4uxcw7f8f4` (already registered — cert skipped) |

## Transactions (all confirmed)

| Step | Tx hash | Block | Fee | Parity gate |
|---|---|---|---|---|
| init | `272af971142efa66e649d655ce40b4c2ce79a16301d7d6097d10d3f8262b7b78` | 4425832 | 202353 | bun≡scalus: policy/treasury/vendor identical |
| register | `6f84e2fe6f8ef0b645ed07abd17bb7a9de1c7ad5606cb3dcbbf469ec50112289` | 4425837 | 810002 | bun≡scalus: 3 reward accts identical (4 redeemers) |
| gov | `e3c1f115fa71b31992b66095119d9a0da833126f0c046759adcb71d911929c0c` | 4425839 | 299954 | bun≡scalus: withdrawal JSON byte-identical |

Raw signed tx CBOR differed by builder where applicable (init 967 bun / 995
scalus, register 14669 / 14733) — expected; deterministic artifacts identical.

## Gov action

- **proposal_id:** `gov_action1u0qlz906wxe3ny4kvz23r8v6pk5rxyn0pszxwkddedcajyvjnsxqqyg7gx5`
- **Type:** TreasuryWithdrawals
- **Amount:** 2,464,844,000,000 lovelace (**₳2,464,844**) → treasury reward acct
- **Guardrails:** `fa24fb305126805cf2164c161d852a0e7330cf988f1fe558cf7d4a64`
- **Anchor:** `ipfs://QmcZPndRnPR3giqybj1u24VVFx5q4csN9uYHuFCtT38uqD`
- **Anchor data hash:** `e6b117c2522a69b1b693dd863181aa42b86d71fc928b5b5d40cc906d43515500` (Koios `meta_hash` matches)
- **Deposit:** 1,000 tADA (preview `gov_action_deposit` — cut from 100k in Jun 2026; deposit-return → admin stake)
- **Expiration:** epoch 1374 (preview `gov_action_lifetime` = 30 epochs)
- **Koios verification:** `meta_hash` matches; `meta_json.body.title` populates after Koios's offchain IPFS fetch (lagging at write time; anchor is gateway-resolvable, hash matches).

## State

- Supersedes (does not replace) the 2026-06-25 preview action `c7f69982`
  (which carried placeholder CIDs + the old ₳2,991,667). Both remain on-chain.
- Real-PDF anchor: proposal `QmcxVb3ZKX…`, annex1 `QmXmA7iGez…`,
  annex2 `QmZxgZMk9t…`, annex3 `QmdxcAZoSy…`.
- **Mainnet still deferred.** Mainnet deposit is 100,000 ADA (≠ preview's 1,000);
  HackMD Supporting-links convergence remains a mainnet prerequisite.
