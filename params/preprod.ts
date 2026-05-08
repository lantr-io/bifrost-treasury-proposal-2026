import type {
  MultisigScript,
  TreasuryConfiguration,
  VendorConfiguration,
} from "@sundaeswap/treasury-funds";
import type { RawConfig, ResolvedConfig } from "./common";

/**
 * Preprod concrete config. Uses the real proposal totals and dates so the
 * preprod test exercises the same script parameters that mainnet will mint.
 *
 *   amount   : ₳8,503,000 (incl. 10% refundable contingency, per HackMD
 *              proposal as of 2026-05-08)
 *   T_max    : 2027-09-01 = end of 12-month delivery (May 2027) + 3-month
 *              contingency window
 *   vendor.expiration: T_max + 30 days
 *   topology : operator (K_op) + 3-board (K_1..K_3) per Plan.md.
 *              Board pkhs come from gen-keys (keys/board-{1,2,3}.pkh).
 *
 * Milestone schedule is NOT defined here. It is decided at fund-vendor
 * time (vendor datum, not script parameter), and the existing
 * 05-fund-vendor.ts will need a wired schedule before it can run.
 */
export const preprodRawConfig: RawConfig = {
  network: "preprod",
  adminAddress:
    "addr_test1qqhvk2xna6s7wglqx09k87l4my9uq74gaxrwqn3yqr2zzp97em0a23l90d0nw30feg6gahelyhk5cl5080uzxszrtcdspa5c55",
  boardPkhs: [
    "8ae3b48af447444ecce58fd4f0f16798249be8f34f8aef61a5ea3a4b", // K_1
    "39a878cc3c3a7d953959b4b45553094503e7a39ce81b9ba58186e0b9", // K_2
    "9099b86b980c7f0c6c8fa879395b7bbfc06ea3ea4c2b6bb61517334d", // K_3
  ],
  amountLovelace: 8_503_000_000_000n,
  treasuryExpirationISO: "2027-09-01T00:00:00Z",
  vendorExpirationGraceDays: 30,
};

const sig = (pkh: string): MultisigScript => ({ Signature: { key_hash: pkh } });

const allOf = (scripts: MultisigScript[]): MultisigScript => ({
  AllOf: { scripts },
});

const atLeast = (
  required: bigint,
  scripts: MultisigScript[],
): MultisigScript => ({ AtLeast: { required, scripts } });

interface PermissionGroup {
  opSig: MultisigScript;
  boardSigs: MultisigScript[];
  /** AtLeast(1, board) — any single board member. */
  board1: MultisigScript;
  /** AtLeast(2, board) — board majority. */
  board2: MultisigScript;
  /** AllOf [K_op, AtLeast(1, board)] — operator + 1 board co-sign. */
  opPlus1: MultisigScript;
  /** AllOf [K_op, AtLeast(2, board)] — operator + board majority. */
  opPlus2: MultisigScript;
}

function permissionGroup(resolved: ResolvedConfig): PermissionGroup {
  const opSig = sig(resolved.adminPkhHex);
  const boardSigs = resolved.boardPkhs.map(sig);
  const board1 = atLeast(1n, boardSigs);
  const board2 = atLeast(2n, boardSigs);
  const opPlus1 = allOf([opSig, board1]);
  const opPlus2 = allOf([opSig, board2]);
  return { opSig, boardSigs, board1, board2, opPlus1, opPlus2 };
}

export function buildTreasuryConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): TreasuryConfiguration {
  const { opSig, opPlus1, opPlus2 } = permissionGroup(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      // K_op alone — no value leaves the script.
      reorganize: opSig,
      // Operator + 1-of-3 board.
      disburse: opPlus1,
      sweep: opPlus1,
      // Operator + 2-of-3 board (commits funds to a milestone schedule).
      fund: opPlus2,
    },
    expiration: resolved.treasuryExpirationMs,
    payout_upperbound: resolved.vendorPayoutUpperboundMs,
  };
}

export function buildVendorConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): VendorConfiguration {
  const { board1, board2, opPlus2 } = permissionGroup(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      // 1-of-3 board (cheap to flag).
      pause: board1,
      // 2-of-3 board (deliberate).
      resume: board2,
      // Operator + 2-of-3 board (restructures the milestone schedule).
      modify: opPlus2,
    },
    expiration: resolved.vendorExpirationMs,
  };
}

/**
 * The vendor multisig (in VendorDatum, set per Fund call) that gates
 * claim-on-maturation. For the preprod test this is K_op alone — Lantr
 * (vendor) signs to claim each matured milestone. Real per-project
 * deployments would set this at Fund time.
 */
export function vendorMultisig(resolved: ResolvedConfig): MultisigScript {
  return sig(resolved.adminPkhHex);
}
