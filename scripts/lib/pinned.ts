import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

/**
 * Persistent record of IPFS-pinned artifacts. Acts as the source of truth
 * for the URLs that go into the anchor body (proposal markdown ref) and the
 * gov-action anchor URL. Committed to git so the on-chain references are
 * traceable from the repo.
 */
export interface PinnedRegistry {
  proposal?: PinnedEntry;
  anchor?: PinnedEntry;
}

export interface PinnedEntry {
  cid: string;
  /** Human-readable label passed to the pinning service. */
  name: string;
  /** ISO 8601 UTC timestamp of the pin. */
  pinnedAt: string;
}

export type PinRole = "proposal" | "anchor";

export const PINNED_PATH = "gov/pinned.json";

export function loadPinned(path: string = PINNED_PATH): PinnedRegistry {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8")) as PinnedRegistry;
}

export function savePinned(
  registry: PinnedRegistry,
  path: string = PINNED_PATH,
): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(registry, null, 2) + "\n", "utf8");
}

export function recordPin(role: PinRole, entry: PinnedEntry): PinnedRegistry {
  const reg = loadPinned();
  reg[role] = entry;
  savePinned(reg);
  return reg;
}

export function requirePin(role: PinRole): PinnedEntry {
  const reg = loadPinned();
  const entry = reg[role];
  if (!entry) {
    throw new Error(
      `${role} not pinned yet. Run: bun run pin <path> --role ${role} --name <label>`,
    );
  }
  return entry;
}
