import { describe, expect, test, beforeAll } from "bun:test";
import sodium from "libsodium-wrappers-sumo";
import { preprodRawConfig, buildTreasuryConfig, buildVendorConfig } from "../../params/preprod";
import { resolveConfig } from "../../params/common";
import { compileScripts } from "./scripts";

beforeAll(async () => {
  await sodium.ready;
});

describe("compileScripts", () => {
  test("produces stable script hashes for fixed inputs", async () => {
    const { Core } = await import("@blaze-cardano/sdk");
    const resolved = resolveConfig(preprodRawConfig);
    const fakeRegistry =
      "cafebabecafebabecafebabecafebabecafebabecafebabecafebabe";
    const treasuryCfg = buildTreasuryConfig(resolved, fakeRegistry);
    const vendorCfg = buildVendorConfig(resolved, fakeRegistry);

    const a = compileScripts(Core.NetworkId.Testnet, treasuryCfg, vendorCfg);
    const b = compileScripts(Core.NetworkId.Testnet, treasuryCfg, vendorCfg);

    expect(a.treasury.scriptHashHex).toBe(b.treasury.scriptHashHex);
    expect(a.vendor.scriptHashHex).toBe(b.vendor.scriptHashHex);
    expect(a.treasury.scriptHashHex).toMatch(/^[0-9a-f]{56}$/);
    expect(a.vendor.scriptHashHex).toMatch(/^[0-9a-f]{56}$/);
    expect(a.treasury.scriptHashHex).not.toBe(a.vendor.scriptHashHex);
  });

  test("different registry token yields different script hashes", async () => {
    const { Core } = await import("@blaze-cardano/sdk");
    const resolved = resolveConfig(preprodRawConfig);
    const reg1 = "ca".repeat(28);
    const reg2 = "ab".repeat(28);
    const a = compileScripts(
      Core.NetworkId.Testnet,
      buildTreasuryConfig(resolved, reg1),
      buildVendorConfig(resolved, reg1),
    );
    const b = compileScripts(
      Core.NetworkId.Testnet,
      buildTreasuryConfig(resolved, reg2),
      buildVendorConfig(resolved, reg2),
    );
    expect(a.treasury.scriptHashHex).not.toBe(b.treasury.scriptHashHex);
    expect(a.vendor.scriptHashHex).not.toBe(b.vendor.scriptHashHex);
  });
});
