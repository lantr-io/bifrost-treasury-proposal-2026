import type { RawConfig } from "./common";

/**
 * Mainnet config for the Bifrost Bridge treasury withdrawal. Wrapped in a
 * function so that merely importing this module is harmless; calling it (only
 * when NETWORK=mainnet is intended) is the explicit acknowledgement of the
 * mainnet path. params/select.ts deliberately does NOT dispatch here —
 * scripts must import it directly so every mainnet code path is visible at the
 * import site.
 *
 * Mainnet submission is deferred until a clean preview rehearsal (see
 * docs/superpowers/specs/2026-07-02-bifrost-treasury-design.md, Scope &
 * phasing). Values mirror the testnet config: the operator base address is
 * the mainnet (addr1…) form of the SAME K_op keypair as the testnet
 * addr_test1q… — identical payment+stake pkhs, differing only in the Shelley
 * header byte (network=1).
 */
export function mainnetRawConfig(): RawConfig {
  return {
    network: "mainnet",
    // K_op — Lantr operator (also Lantr vendor signer). Mainnet form of the
    // fresh 2026-07-02 keypair (same pkh as the testnet admin address).
    adminAddress:
      "addr1qx0dmpgtyr6tyr7y555tkn707r9pnprs6gj2klthdvz99c7vcjy2fsjf8aenxn80lyr8czps6dh04jdsd40y8kcn9qrq0jjj2z",
    boardPkhs: [
      "7095faf3d48d582fbae8b3f2e726670d7a35e2400c783d992bbdeffb", // K_1 — Matthias Benkort (Cardano Foundation)
      "058a5ab0c66647dcce82d7244f80bfea41ba76c7c9ccaf86a41b00fe", // K_2 — Chris Gianelloni (Blink Labs)
      "fe0921cfa53b2deef20f185258f8bc6e127ab6fa1084e62f0830ddef", // K_3 — Riley Kilgore (IOG)
    ],
    // FluidTokens vendor (second of the two joint vendors).
    fluidTokensPkh: "1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175",
    amountLovelace: 12_332_031_000_000n, // ₳12,332,031 — Phase 1 total incl. 10% contingency, per HackMD bifrost-bridge-2026 Budget
    treasuryExpirationISO: "2027-07-31T00:00:00Z", // T_max = Q1 2027 delivery + 4-month buffer
    vendorExpirationGraceDays: 30, // vendor expiry = T_max + 30d (= 2027-08-30)
  };
}
