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

type Network = "preprod" | "mainnet";

interface NetworkAnchorConfig {
  /** Optional note appended to the anchor body for testnet stubs. */
  note?: string;
}

const NETWORK_CONFIG: Record<Network, NetworkAnchorConfig> = {
  preprod: {
    note: "preprod test anchor — content mirrors mainnet proposal but the action targets the preprod treasury",
  },
  mainnet: {},
};

interface Section {
  level: number;
  heading: string;
  body: string;
}

/** Split markdown into sections keyed by heading text. Body is only the
 *  prose between this heading and the next heading at any level — descendant
 *  subsections are separate entries, joined back in by sectionWithDescendants. */
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

/** Concatenate one parent section plus all its descendants, preserving the
 *  original heading markup so the rendered text reads as one document. */
function sectionWithDescendants(sections: Section[], heading: string): string {
  const idx = sections.findIndex((x) => x.heading === heading);
  if (idx < 0) throw new Error(`Section not found: "${heading}"`);
  const root = sections[idx]!;
  const parts: string[] = [`${"#".repeat(root.level)} ${root.heading}`, "", root.body];
  for (let j = idx + 1; j < sections.length; j++) {
    const s = sections[j]!;
    if (s.level <= root.level) break;
    parts.push("", `${"#".repeat(s.level)} ${s.heading}`, "", s.body);
  }
  return parts.join("\n").trim();
}

function parseArgs(argv: string[]): { network: Network } {
  const i = argv.indexOf("--network");
  if (i < 0 || !argv[i + 1]) {
    throw new Error("missing --network <preprod|mainnet>");
  }
  const v = argv[i + 1]!;
  if (v !== "preprod" && v !== "mainnet") {
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

  const motivationHeadings = [
    "The Application Layer Decides the Next Chapter",
    "The gap: The Assembly Problem",
  ];
  const motivation = motivationHeadings
    .map((h) => sectionWithDescendants(sections, h))
    .join("\n\n");

  // Rationale = everything from the `## Rationale` heading to end of file,
  // including the `## Attached documents (IPFS)` annexes and supporting
  // links. The leading `## Rationale` heading itself is dropped (the field
  // name already conveys it); all other structure is preserved verbatim.
  const lines = md.split("\n");
  const rationaleStart = lines.findIndex((l) => /^##\s+Rationale\s*$/.test(l));
  if (rationaleStart < 0) throw new Error("`## Rationale` heading not found");
  const rationale = lines.slice(rationaleStart + 1).join("\n").trim();

  const cfg = NETWORK_CONFIG[network];
  const proposalMainPin = requirePin("proposal-main");
  const annex1Pin = requirePin("annex1");
  const annex2Pin = requirePin("annex2");
  const annex3Pin = requirePin("annex3");
  const body: Record<string, unknown> = {
    title: titleSection.heading,
    abstract,
    motivation,
    rationale,
    references: [
      {
        "@type": "Other",
        label: "Proposal main text (markdown, IPFS-pinned)",
        uri: `ipfs://${proposalMainPin.cid}`,
      },
      {
        "@type": "Other",
        label: "Annex 1: Detailed Scope and Workstreams",
        uri: `ipfs://${annex1Pin.cid}`,
      },
      {
        "@type": "Other",
        label: "Annex 2: Product Development Methodology",
        uri: `ipfs://${annex2Pin.cid}`,
      },
      {
        "@type": "Other",
        label: "Annex 3: 2025 Retrospective",
        uri: `ipfs://${annex3Pin.cid}`,
      },
      {
        "@type": "Other",
        label: "Proposal (HackMD, human-readable mirror)",
        uri: "https://hackmd.io/@lantr/scalus2026",
      },
      {
        "@type": "Other",
        label: "Proposal repository",
        uri: "https://github.com/lantr-io/scalus-treasury-proposal-2026",
      },
      {
        "@type": "Other",
        label: "Public transaction journal",
        uri:
          "https://github.com/lantr-io/scalus-treasury-proposal-2026/tree/main/journal",
      },
      { "@type": "Other", label: "Scalus", uri: "https://scalus.org/" },
      { "@type": "Other", label: "Lantr Engineering", uri: "https://lantr.io/" },
      {
        "@type": "Other",
        label: "Scalus repository",
        uri: "https://github.com/scalus3",
      },
      {
        "@type": "Other",
        label: "SundaeSwap treasury-funds (audited contracts)",
        uri: "https://github.com/SundaeSwap-finance/treasury-funds",
      },
      {
        "@type": "Other",
        label: "MLabs audit (treasury-contracts)",
        uri:
          "https://github.com/SundaeSwap-finance/treasury-contracts/blob/dea9e52671f7a696f0ec6a0f475c7fbe52689c9b/audits/mlabs.pdf",
      },
      {
        "@type": "Other",
        label: "TxPipe audit (treasury-contracts)",
        uri:
          "https://github.com/SundaeSwap-finance/treasury-contracts/blob/dea9e52671f7a696f0ec6a0f475c7fbe52689c9b/audits/txpipe.pdf",
      },
    ],
  };
  if (cfg.note) body.note = cfg.note;

  return {
    "@context": {
      "@language": "en-us",
      CIP100:
        "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0100/README.md#",
      CIP108:
        "https://github.com/cardano-foundation/CIPs/blob/master/CIP-0108/README.md#",
      hashAlgorithm: "CIP100:hashAlgorithm",
      body: "CIP108:body",
      title: "CIP108:title",
      abstract: "CIP108:abstract",
      motivation: "CIP108:motivation",
      rationale: "CIP108:rationale",
      references: "CIP108:references",
    },
    hashAlgorithm: "blake2b-256",
    body,
  };
}

function main(): void {
  const { network } = parseArgs(process.argv.slice(2));
  const md = readFileSync("docs/proposal.md", "utf8");
  const anchor = buildAnchor(md, network);
  const out = `gov/anchor.${network}.json`;
  writeFileSync(out, JSON.stringify(anchor, null, 2) + "\n");
  console.log(`Wrote ${out} (${(JSON.stringify(anchor).length / 1024).toFixed(1)} KB)`);
}

main();
