import type {
  MultisigScript,
  TreasuryConfiguration,
  VendorConfiguration,
} from "@sundaeswap/treasury-funds";
import type { RawConfig, ResolvedConfig } from "./common";

/**
 * Preprod concrete config. Uses the real proposal totals and dates so the
 * preprod test exercises the same script parameters that mainnet will mint
 * (single admin key for testing instead of the full operator+board
 * multisig — that change is mainnet-only).
 *
 *   amount   : ₳8,503,000 (incl. 10% refundable contingency, per HackMD
 *              proposal as of 2026-05-08)
 *   T_max    : 2027-09-01 = end of 12-month delivery (May 2027) + 3-month
 *              contingency window
 *   vendor.expiration: T_max + 30 days
 *
 * Milestone schedule is NOT defined here. It is decided at fund-vendor
 * time (vendor datum, not script parameter), and the existing
 * 05-fund-vendor.ts will need a wired schedule before it can run.
 */
export const preprodRawConfig: RawConfig = {
  network: "preprod",
  adminAddress:
    "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
  amountLovelace: 8_503_000_000_000n,
  treasuryExpirationISO: "2027-09-01T00:00:00Z",
  vendorExpirationGraceDays: 30,
};

function adminSig(resolved: ResolvedConfig): MultisigScript {
  return { Signature: { key_hash: resolved.adminPkhHex } };
}

export function buildTreasuryConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): TreasuryConfiguration {
  const sig = adminSig(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      reorganize: sig,
      sweep: sig,
      fund: sig,
      disburse: sig,
    },
    expiration: resolved.treasuryExpirationMs,
    payout_upperbound: resolved.vendorPayoutUpperboundMs,
  };
}

export function buildVendorConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): VendorConfiguration {
  const sig = adminSig(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      pause: sig,
      resume: sig,
      modify: sig,
    },
    expiration: resolved.vendorExpirationMs,
  };
}

/** The vendor multisig that gates claim-on-maturation. Same admin key. */
export function vendorMultisig(resolved: ResolvedConfig): MultisigScript {
  return adminSig(resolved);
}
