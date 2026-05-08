#!/usr/bin/env bun
/**
 * Pin a file to IPFS via the configured pinning services and verify the CID
 * is retrievable from a public gateway before exiting.
 *
 * Usage:
 *   bun scripts/pin.ts <path> [--name <label>] [--role <role>]
 *
 * Roles: proposal-main | annex1 | annex2 | annex3 | anchor
 *
 * --role records the resulting CID in gov/pinned.json so downstream scripts
 * (build-anchor, 03-build-gov-action) read it as the source of truth. Omit
 * --role for one-off pins.
 *
 * Pins to every service that has credentials in env (at least one required):
 *   PINATA_JWT                  Pinata JWT (https://app.pinata.cloud/)
 *   BLOCKFROST_IPFS_PROJECT_ID  Blockfrost IPFS project id (separate from
 *                               the chain BLOCKFROST_PROJECT_ID)
 *
 * Both services use unixfs with default chunking, so the same input produces
 * the same CIDv0. We pin to multiple so the proposal survives any single
 * pinner going away — governance anchors stay live indefinitely.
 */

import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { PIN_ROLES, recordPin, type PinRole } from "./lib/pinned";

interface PinResult {
  service: string;
  cid: string;
}

function envOpt(name: string): string | undefined {
  const v = process.env[name];
  if (!v || v.includes("REPLACE_ME")) return undefined;
  return v;
}

function makeForm(path: string, label: string): FormData {
  const buf = readFileSync(path);
  const form = new FormData();
  form.append(
    "file",
    new Blob([buf], { type: "application/octet-stream" }),
    label,
  );
  return form;
}

async function pinPinata(path: string, label: string, jwt: string): Promise<PinResult> {
  const form = makeForm(path, label);
  // cidVersion: 0 keeps the CID format aligned with Blockfrost's default so
  // both services return the same hash for the same content.
  form.append("pinataOptions", JSON.stringify({ cidVersion: 0 }));
  form.append("pinataMetadata", JSON.stringify({ name: label }));

  const resp = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });
  if (!resp.ok) {
    throw new Error(`Pinata ${resp.status}: ${await resp.text()}`);
  }
  const j = (await resp.json()) as { IpfsHash: string };
  return { service: "Pinata", cid: j.IpfsHash };
}

async function pinBlockfrost(
  path: string,
  label: string,
  projectId: string,
): Promise<PinResult> {
  const addResp = await fetch("https://ipfs.blockfrost.io/api/v0/ipfs/add", {
    method: "POST",
    headers: { project_id: projectId },
    body: makeForm(path, label),
  });
  if (!addResp.ok) {
    throw new Error(`Blockfrost add ${addResp.status}: ${await addResp.text()}`);
  }
  const j = (await addResp.json()) as { ipfs_hash: string };
  const cid = j.ipfs_hash;

  // /add uploads but does not pin on Blockfrost — pin explicitly so the
  // object is not garbage-collected.
  const pinResp = await fetch(
    `https://ipfs.blockfrost.io/api/v0/ipfs/pin/add/${cid}`,
    { method: "POST", headers: { project_id: projectId } },
  );
  if (!pinResp.ok && pinResp.status !== 409) {
    throw new Error(`Blockfrost pin ${pinResp.status}: ${await pinResp.text()}`);
  }
  return { service: "Blockfrost", cid };
}

async function waitForGateway(cid: string, timeoutMs = 180_000): Promise<string> {
  const gateways = [
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
    `https://gateway.pinata.cloud/ipfs/${cid}`,
  ];
  const deadline = Date.now() + timeoutMs;
  let last = "";
  while (Date.now() < deadline) {
    for (const url of gateways) {
      try {
        const resp = await fetch(url, { method: "HEAD" });
        if (resp.ok) return url;
        last = `${url} → ${resp.status}`;
      } catch (e) {
        last = `${url} → ${(e as Error).message}`;
      }
    }
    await new Promise((r) => setTimeout(r, 4000));
  }
  throw new Error(`gateway timeout after ${timeoutMs}ms (last: ${last})`);
}

interface ParsedArgs {
  path: string;
  label: string;
  role: PinRole | undefined;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  let label: string | undefined;
  let role: PinRole | undefined;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--name") {
      label = argv[++i];
    } else if (a === "--role") {
      const v = argv[++i];
      if (!v || !(PIN_ROLES as readonly string[]).includes(v)) {
        throw new Error(
          `--role must be one of ${PIN_ROLES.join(", ")} (got "${v}")`,
        );
      }
      role = v as PinRole;
    } else if (a.startsWith("--")) {
      throw new Error(`unknown flag: ${a}`);
    } else {
      positional.push(a);
    }
  }
  if (positional.length !== 1) {
    throw new Error(
      `usage: bun scripts/pin.ts <path> [--name <label>] [--role <${PIN_ROLES.join("|")}>]`,
    );
  }
  const path = positional[0]!;
  return { path, label: label ?? basename(path), role };
}

async function main(): Promise<void> {
  const { path, label, role } = parseArgs(process.argv.slice(2));
  const size = statSync(path).size;
  console.log(`Pinning ${path} as "${label}" (${(size / 1024).toFixed(1)} KB)`);

  const pinata = envOpt("PINATA_JWT");
  const blockfrost = envOpt("BLOCKFROST_IPFS_PROJECT_ID");
  if (!pinata && !blockfrost) {
    throw new Error(
      "no pinning service configured: set PINATA_JWT and/or BLOCKFROST_IPFS_PROJECT_ID",
    );
  }

  const tasks: Promise<PinResult>[] = [];
  if (pinata) tasks.push(pinPinata(path, label, pinata));
  if (blockfrost) tasks.push(pinBlockfrost(path, label, blockfrost));
  const results = await Promise.all(tasks);

  for (const r of results) console.log(`  ${r.service}: ${r.cid}`);
  const cids = new Set(results.map((r) => r.cid));
  if (cids.size > 1) {
    throw new Error(
      `services returned different CIDs (${[...cids].join(", ")}). ` +
        "Likely a chunking/CID-version mismatch — investigate before publishing.",
    );
  }

  const cid = results[0]!.cid;
  console.log(`Waiting for public gateway propagation (CID ${cid})…`);
  const url = await waitForGateway(cid);
  console.log(`  retrievable at: ${url}`);
  console.log("");
  console.log(`ipfs://${cid}`);

  if (role) {
    recordPin(role, { cid, name: label, pinnedAt: new Date().toISOString() });
    console.log(`Recorded as ${role} in gov/pinned.json`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
