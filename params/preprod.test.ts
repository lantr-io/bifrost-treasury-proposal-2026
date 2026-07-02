import { describe, expect, test } from "bun:test";
import {
  preprodRawConfig,
  buildTreasuryConfig,
  buildVendorConfig,
  vendorMultisig,
} from "./preprod";
import { resolveConfig } from "./common";

const FAKE_REGISTRY_POLICY =
  "cafebabecafebabecafebabecafebabecafebabecafebabecafebabe";

describe("preprod raw config (Bifrost)", () => {
  test("withdrawal amount matches the Phase 1 total incl. contingency (₳12,332,031)", () => {
    expect(preprodRawConfig.amountLovelace).toBe(12_332_031_000_000n);
  });

  test("treasury expires 2027-07-31 (Q1 2027 delivery + 4-month buffer)", () => {
    expect(preprodRawConfig.treasuryExpirationISO).toBe("2027-07-31T00:00:00Z");
  });

  test("vendor grace is 30 days", () => {
    expect(preprodRawConfig.vendorExpirationGraceDays).toBe(30);
  });

  test("admin address is the Lantr K_op operator address", () => {
    expect(preprodRawConfig.adminAddress).toBe(
      "addr_test1qz0dmpgtyr6tyr7y555tkn707r9pnprs6gj2klthdvz99c7vcjy2fsjf8aenxn80lyr8czps6dh04jdsd40y8kcn9qrqvy0jxa",
    );
  });

  test("FluidTokens vendor pkh", () => {
    expect(preprodRawConfig.fluidTokensPkh).toBe(
      "1c471b31ea0b04c652bd8f76b239aea5f57139bdc5a2b28ab1e69175",
    );
  });

  test("board pkhs are 3 distinct 56-char hex hashes", () => {
    expect(preprodRawConfig.boardPkhs).toHaveLength(3);
    for (const pkh of preprodRawConfig.boardPkhs) {
      expect(pkh).toMatch(/^[0-9a-f]{56}$/);
    }
    expect(new Set(preprodRawConfig.boardPkhs).size).toBe(3);
  });
});

const resolved = resolveConfig(preprodRawConfig);
const op = { Signature: { key_hash: resolved.adminPkhHex } };
const ft = { Signature: { key_hash: resolved.fluidTokensPkh } };
const board = resolved.boardPkhs.map((k) => ({ Signature: { key_hash: k } }));
const board1 = { AtLeast: { required: 1n, scripts: board } };
const board2 = { AtLeast: { required: 2n, scripts: board } };

describe("buildTreasuryConfig — two-vendor + board topology", () => {
  const cfg = buildTreasuryConfig(resolved, FAKE_REGISTRY_POLICY);

  test("registry token + expiration + payout_upperbound", () => {
    expect(cfg.registry_token).toBe(FAKE_REGISTRY_POLICY);
    expect(cfg.expiration).toBe(resolved.treasuryExpirationMs);
    expect(cfg.payout_upperbound).toBe(resolved.vendorPayoutUpperboundMs);
  });

  test("reorganize = K_op alone", () => {
    expect(cfg.permissions.reorganize).toEqual(op);
  });

  test("disburse = both vendors (Lantr + FluidTokens) + 1-of-3 board", () => {
    expect(cfg.permissions.disburse).toEqual({
      AllOf: { scripts: [op, ft, board1] },
    });
  });

  test("sweep = 1-of-3 board (returns funds to Cardano treasury)", () => {
    expect(cfg.permissions.sweep).toEqual(board1);
  });

  test("fund = 2-of-3 board (vendor consent enforced by fund.ak)", () => {
    expect(cfg.permissions.fund).toEqual(board2);
  });
});

describe("buildVendorConfig — board topology", () => {
  const cfg = buildVendorConfig(resolved, FAKE_REGISTRY_POLICY);

  test("registry token + vendor expiration (= T_max + grace)", () => {
    expect(cfg.registry_token).toBe(FAKE_REGISTRY_POLICY);
    expect(cfg.expiration).toBe(resolved.vendorExpirationMs);
    expect(cfg.expiration).toBeGreaterThan(resolved.treasuryExpirationMs);
  });

  test("pause = 1-of-3 board (cheap to flag)", () => {
    expect(cfg.permissions.pause).toEqual(board1);
  });

  test("resume = 2-of-3 board (deliberate)", () => {
    expect(cfg.permissions.resume).toEqual(board2);
  });

  test("modify = 2-of-3 board (vendor consent enforced by vendor.ak)", () => {
    expect(cfg.permissions.modify).toEqual(board2);
  });
});

describe("vendorMultisig — 2-of-2 vendor claim", () => {
  test("AllOf[Lantr, FluidTokens]", () => {
    expect(vendorMultisig(resolved)).toEqual({ AllOf: { scripts: [op, ft] } });
  });
});
