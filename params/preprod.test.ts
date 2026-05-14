import { describe, expect, test } from "bun:test";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "./preprod";
import { resolveConfig } from "./common";

const FAKE_REGISTRY_POLICY =
  "cafebabecafebabecafebabecafebabecafebabecafebabecafebabe";

describe("preprod raw config", () => {
  test("withdrawal amount matches the proposal total (₳8,503,000)", () => {
    expect(preprodRawConfig.amountLovelace).toBe(8_503_000_000_000n);
  });

  test("treasury expires 2027-10-01 (12-month delivery July 2026 - June 2027 + 3-month contingency)", () => {
    expect(preprodRawConfig.treasuryExpirationISO).toBe("2027-10-01T00:00:00Z");
  });

  test("vendor grace is 30 days", () => {
    expect(preprodRawConfig.vendorExpirationGraceDays).toBe(30);
  });

  test("admin address matches the designated proposer address", () => {
    expect(preprodRawConfig.adminAddress).toBe(
      "addr_test1qqhvk2xna6s7wglqx09k87l4my9uq74gaxrwqn3yqr2zzp97em0a23l90d0nw30feg6gahelyhk5cl5080uzxszrtcdspa5c55",
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

describe("buildTreasuryConfig — operator+board topology", () => {
  const resolved = resolveConfig(preprodRawConfig);
  const cfg = buildTreasuryConfig(resolved, FAKE_REGISTRY_POLICY);
  const op = { Signature: { key_hash: resolved.adminPkhHex } };
  const board = resolved.boardPkhs.map((k) => ({ Signature: { key_hash: k } }));
  const opPlus1 = {
    AllOf: { scripts: [op, { AtLeast: { required: 1n, scripts: board } }] },
  };
  const opPlus2 = {
    AllOf: { scripts: [op, { AtLeast: { required: 2n, scripts: board } }] },
  };

  test("registry token + expiration + payout_upperbound", () => {
    expect(cfg.registry_token).toBe(FAKE_REGISTRY_POLICY);
    expect(cfg.expiration).toBe(resolved.treasuryExpirationMs);
    expect(cfg.payout_upperbound).toBe(resolved.vendorPayoutUpperboundMs);
  });

  test("reorganize = K_op alone", () => {
    expect(cfg.permissions.reorganize).toEqual(op);
  });

  test("disburse = K_op + 2-of-3 board (same as fund — both value-out)", () => {
    expect(cfg.permissions.disburse).toEqual(opPlus2);
  });

  test("sweep = K_op + 1-of-3 board (reversible: returns funds to Cardano treasury)", () => {
    expect(cfg.permissions.sweep).toEqual(opPlus1);
  });

  test("fund = K_op + 2-of-3 board", () => {
    expect(cfg.permissions.fund).toEqual(opPlus2);
  });
});

describe("buildVendorConfig — operator+board topology", () => {
  const resolved = resolveConfig(preprodRawConfig);
  const cfg = buildVendorConfig(resolved, FAKE_REGISTRY_POLICY);
  const op = { Signature: { key_hash: resolved.adminPkhHex } };
  const board = resolved.boardPkhs.map((k) => ({ Signature: { key_hash: k } }));
  const board1 = { AtLeast: { required: 1n, scripts: board } };
  const board2 = { AtLeast: { required: 2n, scripts: board } };
  const opPlus2 = { AllOf: { scripts: [op, board2] } };

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

  test("modify = K_op + 2-of-3 board", () => {
    expect(cfg.permissions.modify).toEqual(opPlus2);
  });
});
