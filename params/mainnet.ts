import type { RawConfig } from "./common";

/**
 * Mainnet placeholder. NOT runnable as-is — replace every TODO with the real
 * value before attempting to deploy to mainnet. Requires the full
 * operator+3-board topology (see Plan.md "Treasury Withdrawal Script
 * Address" section); this single-RawConfig shape will need an extension
 * before mainnet to express that.
 *
 * Wrapped in a function so that merely importing this module does not crash
 * the process; calling it is the explicit acknowledgement that you intend to
 * use the mainnet path.
 */
export function mainnetRawConfig(): RawConfig {
  throw new Error(
    "TODO(mainnet): fill in mainnet params — see params/mainnet.ts for fields required",
  );

  // Shape to fill in when the real proposal is finalized:
  // return {
  //   network: "mainnet",
  //   adminAddress: "addr1q...",                          // TODO(mainnet): operator+board multisig setup; current single-admin shape is preprod-only
  //   amountLovelace: 8_503_000_000_000n,                 // ₳8,503,000 per HackMD proposal (2026-05-08)
  //   treasuryExpirationISO: "2027-09-01T00:00:00Z",      // 12-month delivery (May 2027) + 3-month contingency
  //   vendorExpirationGraceDays: 30,                      // T_max + 30d for late Modify cleanup
  // };
}
