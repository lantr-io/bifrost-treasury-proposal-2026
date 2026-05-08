import { describe, expect, test } from "bun:test";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "./preprod";
import { resolveConfig } from "./common";

const FAKE_REGISTRY_POLICY =
  "cafebabecafebabecafebabecafebabecafebabecafebabecafebabe";

describe("preprod raw config", () => {
  test("withdrawal amount matches the proposal total (₳8,503,000)", () => {
    expect(preprodRawConfig.amountLovelace).toBe(8_503_000_000_000n);
  });

  test("treasury expires 2027-09-01 (12-month delivery + 3-month contingency)", () => {
    expect(preprodRawConfig.treasuryExpirationISO).toBe("2027-09-01T00:00:00Z");
  });

  test("vendor grace is 30 days", () => {
    expect(preprodRawConfig.vendorExpirationGraceDays).toBe(30);
  });

  test("admin address matches the designated proposer address", () => {
    expect(preprodRawConfig.adminAddress).toBe(
      "addr_test1qzwg0u9fpl8dac9rkramkcgzerjsfdlqgkw0q8hy5vwk8tzk5pgcmdpe5jeh92guy4mke4zdmagv228nucldzxv95clq68fray",
    );
  });
});

describe("buildTreasuryConfig", () => {
  test("uses the supplied registry policy and resolved expiration", () => {
    const resolved = resolveConfig(preprodRawConfig);
    const cfg = buildTreasuryConfig(resolved, FAKE_REGISTRY_POLICY);
    expect(cfg.registry_token).toBe(FAKE_REGISTRY_POLICY);
    expect(cfg.expiration).toBe(resolved.treasuryExpirationMs);
    expect(cfg.payout_upperbound).toBe(resolved.vendorPayoutUpperboundMs);
  });

  test("all four treasury permissions are a Signature over the admin pkh", () => {
    const resolved = resolveConfig(preprodRawConfig);
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
  test("vendor expiration = treasury expiration + grace; permissions use admin", () => {
    const resolved = resolveConfig(preprodRawConfig);
    const cfg = buildVendorConfig(resolved, FAKE_REGISTRY_POLICY);
    expect(cfg.registry_token).toBe(FAKE_REGISTRY_POLICY);
    expect(cfg.expiration).toBe(resolved.vendorExpirationMs);
    expect(cfg.expiration).toBeGreaterThan(resolved.treasuryExpirationMs);
    for (const ms of [
      cfg.permissions.pause,
      cfg.permissions.resume,
      cfg.permissions.modify,
    ]) {
      expect("Signature" in ms).toBe(true);
    }
  });
});
