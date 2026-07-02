import type {
  MultisigScript,
  TreasuryConfiguration,
  VendorConfiguration,
} from "@sundaeswap/treasury-funds";
import type { RawConfig, ResolvedConfig } from "./common";

/**
 * Preprod / preview concrete config for the Bifrost Bridge treasury
 * withdrawal (preview re-exports and re-networks this module). Uses the real
 * proposal totals and dates so testnet exercises the same script parameters
 * that mainnet will mint.
 *
 *   amount   : ₳12,332,031 — Phase 1 total incl. 10% refundable contingency
 *              ($0.16/ADA), per HackMD @lantr/bifrost-bridge-2026 Budget.
 *   T_max    : 2027-07-31 = end of Q1 2027 delivery + 4-month buffer (so M3
 *              matures and fund/final ADA disburse land before expiration).
 *   vendor.expiration: T_max + 30 days (= 2027-08-30).
 *   topology : two joint vendors (Lantr = K_op, FluidTokens) + 3 oversight
 *              board members (K_1..K_3), per docs/superpowers/specs/
 *              2026-07-02-bifrost-treasury-design.md §4.
 *
 * K_op is Lantr's freshly generated operator key (keys/admin.*); it doubles
 * as Lantr's vendor signer. The board pkhs are the production oversight
 * members (CF / Blink / IOG) — external, we hold only their pkhs.
 *
 * The milestone schedule (M0 advance + M1/M2/M3) and the vendor claim
 * multisig live in the VendorDatum, set at fund time — NOT script parameters,
 * so they don't affect the treasury/vendor script hashes.
 */
export const preprodRawConfig: RawConfig = {
  network: "preprod",
  // K_op — Lantr operator (also Lantr vendor signer). Fresh key, 2026-07-02.
  adminAddress:
    "addr_test1qz0dmpgtyr6tyr7y555tkn707r9pnprs6gj2klthdvz99c7vcjy2fsjf8aenxn80lyr8czps6dh04jdsd40y8kcn9qrqvy0jxa",
  boardPkhs: [
    "7095faf3d48d582fbae8b3f2e726670d7a35e2400c783d992bbdeffb", // K_1 — Matthias Benkort (Cardano Foundation)
    "058a5ab0c66647dcce82d7244f80bfea41ba76c7c9ccaf86a41b00fe", // K_2 — Chris Gianelloni (Blink Labs)
    "fe0921cfa53b2deef20f185258f8bc6e127ab6fa1084e62f0830ddef", // K_3 — Riley Kilgore (IOG)
  ],
  // FluidTokens vendor (second of the two joint vendors).
  fluidTokensPkh: "1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175",
  amountLovelace: 12_332_031_000_000n,
  treasuryExpirationISO: "2027-07-31T00:00:00Z",
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
  /** Lantr K_op — operator and Lantr's vendor signer. */
  opSig: MultisigScript;
  /** FluidTokens vendor. */
  ftSig: MultisigScript;
  boardSigs: MultisigScript[];
  /** AtLeast(1, board) — any single board member. */
  board1: MultisigScript;
  /** AtLeast(2, board) — board majority. */
  board2: MultisigScript;
  /** AllOf [Lantr, FluidTokens, AtLeast(1, board)] — both vendors + 1 board. */
  bothVendorsPlus1: MultisigScript;
  /** AllOf [Lantr, FluidTokens] — 2-of-2 vendor claim multisig. */
  vendorClaim: MultisigScript;
}

function permissionGroup(resolved: ResolvedConfig): PermissionGroup {
  const opSig = sig(resolved.adminPkhHex);
  const ftSig = sig(resolved.fluidTokensPkh);
  const boardSigs = resolved.boardPkhs.map(sig);
  const board1 = atLeast(1n, boardSigs);
  const board2 = atLeast(2n, boardSigs);
  const bothVendorsPlus1 = allOf([opSig, ftSig, board1]);
  const vendorClaim = allOf([opSig, ftSig]);
  return { opSig, ftSig, boardSigs, board1, board2, bothVendorsPlus1, vendorClaim };
}

export function buildTreasuryConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): TreasuryConfiguration {
  const { opSig, board1, board2, bothVendorsPlus1 } = permissionGroup(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      // K_op alone — no value leaves the script.
      reorganize: opSig,
      // 1-of-3 board — benign; only returns funds to the Cardano treasury.
      sweep: board1,
      // Both vendors (Lantr + FluidTokens) + any 1 board member. Disburse
      // routes value to arbitrary recipients (audits, legal, etc.).
      disburse: bothVendorsPlus1,
      // 2-of-3 board (board majority). Commits funds to a vendor milestone
      // schedule; fund.ak additionally forces the vendor multisig to consent.
      fund: board2,
    },
    expiration: resolved.treasuryExpirationMs,
    payout_upperbound: resolved.vendorPayoutUpperboundMs,
  };
}

export function buildVendorConfig(
  resolved: ResolvedConfig,
  registryPolicyHex: string,
): VendorConfiguration {
  const { board1, board2 } = permissionGroup(resolved);
  return {
    registry_token: registryPolicyHex,
    permissions: {
      // 1-of-3 board (cheap to flag / contest a milestone).
      pause: board1,
      // 2-of-3 board (deliberate).
      resume: board2,
      // 2-of-3 board — restructures the milestone schedule; vendor.ak
      // additionally forces the vendor multisig to consent.
      modify: board2,
    },
    expiration: resolved.vendorExpirationMs,
  };
}

/**
 * The vendor claim multisig (in VendorDatum, set per Fund call) that gates
 * claim-on-maturation: AllOf[Lantr, FluidTokens] (2-of-2). Both joint vendors
 * must sign to withdraw a matured milestone.
 */
export function vendorMultisig(resolved: ResolvedConfig): MultisigScript {
  return permissionGroup(resolved).vendorClaim;
}
