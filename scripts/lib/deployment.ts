import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface SeedUtxo {
  txId: string;
  outputIndex: number;
}

export interface DeploymentState {
  network: "preprod" | "mainnet";
  seedUtxo: SeedUtxo;
  registryPolicyHex: string;
  /** "REGISTRY" as hex. */
  registryAssetNameHex: string;
  treasuryScriptHashHex: string;
  vendorScriptHashHex: string;
  treasuryExpirationMs: bigint;
  /** Named transaction hashes recorded as the flow progresses. */
  txs: Record<string, string>;
}

interface SerializedState extends Omit<DeploymentState, "treasuryExpirationMs"> {
  treasuryExpirationMs: string;
}

export function loadDeployment(path: string): DeploymentState | null {
  if (!existsSync(path)) return null;
  const raw = JSON.parse(readFileSync(path, "utf8")) as SerializedState;
  return {
    ...raw,
    treasuryExpirationMs: BigInt(raw.treasuryExpirationMs),
  };
}

export function saveDeployment(
  path: string,
  state: DeploymentState,
  opts: { overwrite?: boolean } = {},
): void {
  if (existsSync(path) && !opts.overwrite) {
    throw new Error(
      `Deployment state ${path} already exists. Pass { overwrite: true } to replace it.`,
    );
  }
  const serialized: SerializedState = {
    ...state,
    treasuryExpirationMs: state.treasuryExpirationMs.toString(),
  };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(serialized, null, 2) + "\n", "utf8");
}
