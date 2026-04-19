import { describe, expect, test } from "bun:test";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "./preprod";
import { resolveConfig } from "./common";

const FIXED_NOW = new Date("2026-05-01T00:00:00Z");
const FAKE_REGISTRY_POLICY =
  "cafebabecafebabecafebabecafebabecafebabecafebabecafebabe";

describe("preprod raw config", () => {
  test("withdrawal amount is 1,000,000 tADA", () => {
    expect(preprodRawConfig.amountLovelace).toBe(1_000_000_000_000n);
  });

  test("single milestone configuration", () => {
    expect(preprodRawConfig.milestoneCount).toBe(1);
  });

  test("admin address matches the designated proposer address", () => {
    expect(preprodRawConfig.adminAddress).toBe(
      "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
    );
  });
});

describe("buildTreasuryConfig", () => {
  test("uses the supplied registry policy and resolved expiration", () => {
    const resolved = resolveConfig(preprodRawConfig, FIXED_NOW);
    const cfg = buildTreasuryConfig(resolved, FAKE_REGISTRY_POLICY);
    expect(cfg.registry_token).toBe(FAKE_REGISTRY_POLICY);
    expect(cfg.expiration).toBe(resolved.treasuryExpirationMs);
    expect(cfg.payout_upperbound).toBe(resolved.vendorPayoutUpperboundMs);
  });

  test("all four treasury permissions are a Signature over the admin pkh", () => {
    const resolved = resolveConfig(preprodRawConfig, FIXED_NOW);
    const cfg = buildTreasuryConfig(resolved, FAKE_REGISTRY_POLICY);
    for (const ms of [
      cfg.permissions.reorganize,
      cfg.permissions.sweep,
      cfg.permissions.fund,
      cfg.permissions.disburse,
    ]) {
      expect("Signature" in ms).toBe(true);
      if ("Signature" in ms) {
        expect(ms.Signature.key_hash).toBe(resolved.adminPkhHex);
      }
    }
  });
});

describe("buildVendorConfig", () => {
  test("registry + expiration match treasury; three permissions use admin", () => {
    const resolved = resolveConfig(preprodRawConfig, FIXED_NOW);
    const cfg = buildVendorConfig(resolved, FAKE_REGISTRY_POLICY);
    expect(cfg.registry_token).toBe(FAKE_REGISTRY_POLICY);
    expect(cfg.expiration).toBe(resolved.treasuryExpirationMs);
    for (const ms of [
      cfg.permissions.pause,
      cfg.permissions.resume,
      cfg.permissions.modify,
    ]) {
      expect("Signature" in ms).toBe(true);
    }
  });
});
