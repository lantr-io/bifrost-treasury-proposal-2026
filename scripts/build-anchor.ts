#!/usr/bin/env bun
/**
 * Build gov/anchor.{network}.json (CIP-108 governance metadata) from
 * docs/proposal.md.
 *
 * Usage:
 *   bun scripts/build-anchor.ts --network preprod
 *   bun scripts/build-anchor.ts --network mainnet
 *
 * The generated JSON is the source of truth for the on-chain anchor hash.
 * It is hand-curated by selecting which markdown sections feed each
 * CIP-108 body field; the rest of the proposal is reachable via `references`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { requirePin } from "./lib/pinned";
import { assertAnchorValid } from "./lib/validate-anchor";

type Network = "preprod" | "preview" | "mainnet";

/** Display name that appears in the anchor's `authors` array. */
const AUTHOR_NAME = "Lantr Engineering";

interface Section {
  level: number;
  heading: string;
  body: string;
}

/** Split markdown into sections keyed by heading text. Body is only the
 *  prose between this heading and the next heading at any level — descendant
 *  subsections are separate entries, joined back in by sectionContents. */
function parseSections(md: string): Section[] {
  const lines = md.split("\n");
  const sections: Section[] = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i]!.match(/^(#{1,6})\s+(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const level = m[1]!.length;
    const heading = m[2]!.trim();
    const start = i + 1;
    let end = lines.length;
    for (let j = start; j < lines.length; j++) {
      if (lines[j]!.match(/^#{1,6}\s+/)) {
        end = j;
        break;
      }
    }
    const body = lines.slice(start, end).join("\n").trim();
    sections.push({ level, heading, body });
    i = start;
  }
  return sections;
}

function findSection(sections: Section[], heading: string): Section {
  const s = sections.find((x) => x.heading === heading);
  if (!s) throw new Error(`Section not found: "${heading}"`);
  return s;
}

/** Full content of a parent section: every descendant subsection (heading +
 *  body), but NOT the parent's own heading line — that heading is redundant
 *  with the CIP-108 field name (e.g. "motivation") the content lands in.
 *  Unlike a fixed subsection list this captures the WHOLE section, so adding a
 *  subsection under it on HackMD flows through automatically. */
function sectionContents(sections: Section[], heading: string): string {
  const idx = sections.findIndex((x) => x.heading === heading);
  if (idx < 0) throw new Error(`Section not found: "${heading}"`);
  const root = sections[idx]!;
  const parts: string[] = [];
  if (root.body) parts.push(root.body);
  for (let j = idx + 1; j < sections.length; j++) {
    const s = sections[j]!;
    if (s.level <= root.level) break;
    parts.push(`${"#".repeat(s.level)} ${s.heading}`);
    if (s.body) parts.push(s.body);
  }
  return parts.join("\n\n").trim();
}

/** Rewrite known IPFS gateway URLs and ipfs:// URIs to the canonical
 *  https://ipfs.io/ipfs/<cid> form so every reference points at the same
 *  gateway regardless of which one the proposal author wrote. */
function normalizeIpfsGateway(url: string): string {
  const ipfsScheme = url.match(/^ipfs:\/\/([A-Za-z0-9]+)(\/.*)?$/);
  if (ipfsScheme) {
    return `https://ipfs.io/ipfs/${ipfsScheme[1]}${ipfsScheme[2] ?? ""}`;
  }
  const gateway = url.match(
    /^https?:\/\/(?:gateway\.pinata\.cloud|cloudflare-ipfs\.com|ipfs\.blockfrost\.io|dweb\.link)\/ipfs\/([A-Za-z0-9]+)(\/.*)?$/,
  );
  if (gateway) {
    return `https://ipfs.io/ipfs/${gateway[1]}${gateway[2] ?? ""}`;
  }
  return url;
}

function parseArgs(argv: string[]): { network: Network } {
  const i = argv.indexOf("--network");
  if (i < 0 || !argv[i + 1]) {
    throw new Error("missing --network <preprod|mainnet>");
  }
  const v = argv[i + 1]!;
  if (v !== "preprod" && v !== "preview" && v !== "mainnet") {
    throw new Error(`bad --network: ${v}`);
  }
  return { network: v };
}

function buildAnchor(md: string, network: Network): unknown {
  const sections = parseSections(md);
  const titleSection = sections.find((s) => s.level === 1);
  if (!titleSection) throw new Error("no H1 title in proposal markdown");

  // Curated CIP-108 mapping. Voters see these inline in governance UIs;
  // the full proposal (milestones, budget, risks, annexes) is reachable
  // via the references array.
  const abstract = findSection(sections, "Abstract").body;

  // The whole `## Motivation` section (every subsection), not a hardcoded
  // first subsection — the earlier bug only emitted "The Application Layer
  // Decides the Next Chapter" and dropped the rest of Motivation.
  const motivation = sectionContents(sections, "Motivation");

  // Rationale = everything from `## Rationale` to (but not including) the
  // final `## Supporting links` section. The trailing Supporting-links list
  // is consumed by the references[] parser below, so we drop it from the
  // rationale prose to avoid duplicating each link in both fields.
  const lines = md.split("\n");
  const rationaleStart = lines.findIndex((l) => /^##\s+Rationale\s*$/.test(l));
  if (rationaleStart < 0) throw new Error("`## Rationale` heading not found");
  const supportingStart = lines.findIndex(
    (l) => /^##\s+Supporting links\s*$/.test(l),
  );
  if (supportingStart < 0) {
    throw new Error("`## Supporting links` heading not found");
  }
  // Drop any blank lines or `---` thematic break immediately before
  // "## Supporting links" so the rationale ends cleanly.
  let rationaleEnd = supportingStart;
  while (
    rationaleEnd > rationaleStart &&
    (lines[rationaleEnd - 1]!.trim() === "" ||
      lines[rationaleEnd - 1]!.trim() === "---")
  ) {
    rationaleEnd--;
  }
  const rationale = lines.slice(rationaleStart + 1, rationaleEnd).join("\n").trim();

  // Parse "## Supporting links" bullet list into references[]. Format:
  //   * <label>: <https-url>
  // Greedy on the label so entries like "Annex 1: ... (PDF)" keep their
  // internal colon. URLs that point at an IPFS gateway are normalized to
  // https://ipfs.io/ipfs/<cid> so indexers all see the same gateway.
  const linkRe = /^\* (.+):\s+(https?:\/\/\S+)\s*$/;
  const references: { "@type": string; label: string; uri: string }[] = [];
  for (let j = supportingStart + 1; j < lines.length; j++) {
    const m = lines[j]!.match(linkRe);
    if (!m) continue;
    references.push({
      "@type": "Other",
      label: m[1]!.trim(),
      uri: normalizeIpfsGateway(m[2]!.trim()),
    });
  }
  if (references.length === 0) {
    throw new Error(
      "no `* label: url` entries parsed under `## Supporting links`",
    );
  }

  void network; // network selector is currently informational only
  // Pin records aren't directly read here anymore (refs come from
  // proposal.md), but require them so the file enforces that every PDF
  // has been pinned before the anchor can be built.
  requirePin("proposal");
  requirePin("annex1");
  requirePin("annex2");
  requirePin("annex3");
  const body: Record<string, unknown> = {
    title: titleSection.heading,
    abstract,
    motivation,
    rationale,
    references,
  };

  // Canonical CIP-100 + CIP-108 @context with nested @id sub-contexts.
  // Matches the reference example at
  // https://github.com/cardano-foundation/CIPs/tree/master/CIP-0108/examples
  // — strict JSON-LD parsers expand this correctly during URDNA2015
  // canonicalization, which authors[*].witness.signature depends on.
  const context = {
    "@language": "en-us",
    CIP100:
      "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#",
    CIP108:
      "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0108/README.md#",
    hashAlgorithm: "CIP100:hashAlgorithm",
    body: {
      "@id": "CIP108:body",
      "@context": {
        references: {
          "@id": "CIP108:references",
          "@container": "@set",
          "@context": {
            GovernanceMetadata: "CIP100:GovernanceMetadataReference",
            Other: "CIP100:OtherReference",
            label: "CIP100:reference-label",
            uri: "CIP100:reference-uri",
            referenceHash: {
              "@id": "CIP108:referenceHash",
              "@context": {
                hashDigest: "CIP108:hashDigest",
                hashAlgorithm: "CIP100:hashAlgorithm",
              },
            },
          },
        },
        title: "CIP108:title",
        abstract: "CIP108:abstract",
        motivation: "CIP108:motivation",
        rationale: "CIP108:rationale",
      },
    },
    authors: {
      "@id": "CIP100:authors",
      "@container": "@set",
      "@context": {
        name: "http://xmlns.com/foaf/0.1/name",
        witness: {
          "@id": "CIP100:witness",
          "@context": {
            witnessAlgorithm: "CIP100:witnessAlgorithm",
            publicKey: "CIP100:publicKey",
            signature: "CIP100:signature",
          },
        },
      },
    },
  };

  // authors[*].witness is filled in by scripts/sign-anchor.ts after the
  // body is canonicalized and hashed. Emit placeholders here so the JSON
  // round-trips through any tool that round-trips by key.
  const authors = [
    {
      name: AUTHOR_NAME,
      witness: {
        witnessAlgorithm: "ed25519",
        publicKey: "",
        signature: "",
      },
    },
  ];

  return {
    "@context": context,
    hashAlgorithm: "blake2b-256",
    body,
    authors,
  };
}

function main(): void {
  const { network } = parseArgs(process.argv.slice(2));
  const md = readFileSync("docs/proposal.md", "utf8");
  const anchor = buildAnchor(md, network);
  assertAnchorValid(anchor, `built anchor (network=${network})`);
  const out = `gov/anchor.${network}.json`;
  writeFileSync(out, JSON.stringify(anchor, null, 2) + "\n");
  console.log(
    `Wrote ${out} (${(JSON.stringify(anchor).length / 1024).toFixed(1)} KB, schema-valid)`,
  );
  console.log(`Next: bun run sign-anchor ${out}`);
}

main();
