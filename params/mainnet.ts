import type { RawConfig } from "./common";

/**
 * Mainnet placeholder. NOT runnable as-is — replace every TODO with the
 * real value before attempting to deploy to mainnet. The shape is the
 * same as preprod (operator + 3-board); preprod uses freshly-generated
 * test keys, mainnet uses the actual operator and board members'
 * production keys.
 *
 * Wrapped in a function so that merely importing this module does not
 * crash the process; calling it is the explicit acknowledgement that
 * you intend to use the mainnet path.
 */
export function mainnetRawConfig(): RawConfig {
  throw new Error(
    "TODO(mainnet): fill in mainnet params — see params/mainnet.ts for fields required",
  );

  // Shape to fill in when the real proposal is finalized:
  // return {
  //   network: "mainnet",
  //   adminAddress: "addr1qyhvk2xna6s7wglqx09k87l4my9uq74gaxrwqn3yqr2zzp97em0a23l90d0nw30feg6gahelyhk5cl5080uzxszrtcdsztfcct", // operator (K_op) — derived 2026-05-13 from keys/admin.{vkey,stake.vkey}; same keypair as the testnet addr_test1q... (verified by blake2b-224(vkey) → pkh match)
  //   boardPkhs: [
  //     "7095faf3d48d582fbae8b3f2e726670d7a35e2400c783d992bbdeffb", // K_1 — Matthias Benkort (Cardano Foundation), collected 2026-05-13
  //     "058a5ab0c66647dcce82d7244f80bfea41ba76c7c9ccaf86a41b00fe", // K_2 — Chris Gianelloni (Blink Labs), collected 2026-05-13
  //     "fe0921cfa53b2deef20f185258f8bc6e127ab6fa1084e62f0830ddef", // K_3 — Riley Kilgore (IOG), collected 2026-05-13
  //   ],
  //   amountLovelace: 8_503_000_000_000n,                 // ₳8,503,000 per HackMD proposal (2026-05-08)
  //   treasuryExpirationISO: "2027-09-01T00:00:00Z",      // 12-month delivery (May 2027) + 3-month contingency
  //   vendorExpirationGraceDays: 30,                      // T_max + 30d for late Modify cleanup
  // };
}
