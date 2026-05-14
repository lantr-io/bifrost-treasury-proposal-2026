import type { RawConfig } from "./common";

/**
 * Mainnet config — locked in after the preview end-to-end test
 * (2026-05-14, gov_action1tq67zl7…). Wrapped in a function so that merely
 * importing this module is harmless; calling it (only when
 * NETWORK=mainnet) is the explicit acknowledgement that you intend the
 * mainnet path. params/select.ts deliberately does NOT dispatch to this —
 * scripts must import it directly to make every mainnet code path visible
 * at the import site.
 *
 * Shape matches preprod/preview (operator + 3-board); mainnet uses the
 * same keypair as the testnet `addr_test1q…` (same admin.{vkey,stake.vkey}),
 * which is fine because Shelley addresses are network-discriminated by
 * header byte — the testnet payment pkh equals the mainnet payment pkh.
 */
export function mainnetRawConfig(): RawConfig {
  return {
    network: "mainnet",
    // operator (K_op). Same payment+stake keypair as the preview admin
    // (verified by blake2b-224(vkey) → pkh match); differs only in the
    // Shelley header byte (network=1).
    adminAddress:
      "addr1qyhvk2xna6s7wglqx09k87l4my9uq74gaxrwqn3yqr2zzp97em0a23l90d0nw30feg6gahelyhk5cl5080uzxszrtcdsztfcct",
    boardPkhs: [
      "7095faf3d48d582fbae8b3f2e726670d7a35e2400c783d992bbdeffb", // K_1 — Matthias Benkort (Cardano Foundation)
      "058a5ab0c66647dcce82d7244f80bfea41ba76c7c9ccaf86a41b00fe", // K_2 — Chris Gianelloni (Blink Labs)
      "fe0921cfa53b2deef20f185258f8bc6e127ab6fa1084e62f0830ddef", // K_3 — Riley Kilgore (IOG)
    ],
    amountLovelace: 8_503_000_000_000n, // ₳8,503,000 — incl. 10% refundable contingency, per HackMD proposal (2026-05-14)
    treasuryExpirationISO: "2027-10-01T00:00:00Z", // T_max = 12-month delivery (July 2026 — June 2027) + 3-month contingency
    vendorExpirationGraceDays: 30, // vendor expiry = T_max + 30d (= 2027-10-31)
  };
}
