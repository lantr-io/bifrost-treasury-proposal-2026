import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  loadDeployment,
  saveDeployment,
  type DeploymentState,
} from "./deployment";

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "bifrost-treasury-"));
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("deployment state", () => {
  test("loadDeployment returns null when no file exists", () => {
    expect(loadDeployment(join(dir, "missing.json"))).toBeNull();
  });

  test("round-trip save/load preserves bigint fields as strings and re-hydrates them", () => {
    const path = join(dir, "preprod.json");
    const state: DeploymentState = {
      network: "preprod",
      seedUtxo: { txId: "ab".repeat(32), outputIndex: 3 },
      registryPolicyHex: "de".repeat(28),
      registryAssetNameHex: "52454749535452590000000000000000000000000000000000000000",
      treasuryScriptHashHex: "ca".repeat(28),
      vendorScriptHashHex: "be".repeat(28),
      treasuryExpirationMs: 1_700_000_000_000n,
      txs: {},
    };
    saveDeployment(path, state);
    const loaded = loadDeployment(path);
    expect(loaded).toEqual(state);
  });

  test("saveDeployment refuses to overwrite unless overwrite=true", () => {
    const path = join(dir, "preprod.json");
    const state: DeploymentState = {
      network: "preprod",
      seedUtxo: { txId: "ab".repeat(32), outputIndex: 0 },
      registryPolicyHex: "",
      registryAssetNameHex: "",
      treasuryScriptHashHex: "",
      vendorScriptHashHex: "",
      treasuryExpirationMs: 0n,
      txs: {},
    };
    saveDeployment(path, state);
    expect(() => saveDeployment(path, state)).toThrow(/already exists/);
    saveDeployment(path, state, { overwrite: true });
  });
});
