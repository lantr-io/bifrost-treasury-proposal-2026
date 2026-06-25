#!/usr/bin/env bun
/**
 * Split docs/proposal.md into the four files we pin separately on IPFS:
 *
 *   docs/proposal-main.md   — proposal text minus the annex bodies (the
 *                             pre-annex content + the post-annex
 *                             "Supporting links" section).
 *   docs/annex-1.md         — "### Annex 1: …" through to the next ###
 *   docs/annex-2.md         — "### Annex 2: …" through to the next ###
 *   docs/annex-3.md         — "### Annex 3: …" through to the next ###
 *
 * Idempotent. Re-run after every docs/proposal.md edit. The split files
 * are derived (one-way) — never edit them by hand; the next extract
 * overwrites them.
 *
 * Section detection ignores `### Annex N:` headings inside HTML comment
 * blocks (`<!-- … -->`), so the placeholder Annex 4 in the source is
 * skipped.
 */

import { readFileSync, writeFileSync } from "node:fs";

const PROPOSAL_PATH = "docs/proposal.md";

interface AnnexHeading {
  index: number;
  num: number;
  title: string;
}

function findAnnexHeadings(lines: string[]): AnnexHeading[] {
  const out: AnnexHeading[] = [];
  let inComment = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]!;
    if (!inComment) {
      if (l.trimStart().startsWith("<!--")) {
        inComment = !l.includes("-->");
        continue;
      }
      const m = l.match(/^### Annex (\d+):\s*(.*)$/);
      if (m) {
        out.push({ index: i, num: parseInt(m[1]!, 10), title: m[2]!.trim() });
      }
    } else if (l.includes("-->")) {
      inComment = false;
    }
  }
  return out;
}

/** Strip trailing blank lines, `---` thematic breaks, and HTML comment
 *  blocks from a slice. Used to clean up the tail of each annex section
 *  (the source proposal puts thematic breaks and a commented Annex 4
 *  stub in the gap between Annex 3 and "Supporting links"). */
function trimTail(lines: string[]): string[] {
  let end = lines.length;
  const stripBlanksAndRules = () => {
    while (end > 0) {
      const l = lines[end - 1]!.trim();
      if (l === "" || l === "---") {
        end--;
        continue;
      }
      break;
    }
  };
  stripBlanksAndRules();
  // If the tail is now an HTML comment block close, drop the whole block.
  if (end > 0 && lines[end - 1]!.includes("-->")) {
    let start = end - 1;
    while (start >= 0 && !lines[start]!.trimStart().startsWith("<!--")) {
      start--;
    }
    if (start >= 0) {
      end = start;
      stripBlanksAndRules();
    }
  }
  return lines.slice(0, end);
}

function findRequiredHeading(lines: string[], pattern: RegExp, label: string): number {
  const idx = lines.findIndex((l) => pattern.test(l));
  if (idx < 0) throw new Error(`heading not found: ${label}`);
  return idx;
}

function writeFile(path: string, body: string[], banner: string): void {
  // Single trailing newline, no trailing blanks.
  const text = body.join("\n").replace(/\s+$/, "") + "\n";
  writeFileSync(path, text);
  console.log(`Wrote ${path} (${body.length} lines${banner ? `, ${banner}` : ""})`);
}

function main(): void {
  const md = readFileSync(PROPOSAL_PATH, "utf8");
  const lines = md.split("\n");

  const attachedIdx = findRequiredHeading(
    lines,
    /^## Reference documents \(IPFS\)/,
    '"## Reference documents (IPFS)"',
  );
  const supportingIdx = findRequiredHeading(
    lines,
    /^## Supporting links/,
    '"## Supporting links"',
  );

  const annexes = findAnnexHeadings(lines);
  if (annexes.length < 3) {
    throw new Error(
      `expected at least 3 annexes (excluding HTML-commented stubs), found ${annexes.length}`,
    );
  }

  // proposal-main: everything before the "Attached documents" parent
  // header, joined to the "Supporting links" section onward. Drop the
  // trailing thematic break before "## Attached documents" so the join
  // has exactly one `---` separator.
  const preAnnex = trimTail(lines.slice(0, attachedIdx));
  const postAnnex = lines.slice(supportingIdx);
  const proposalMain = [...preAnnex, "", "---", "", ...postAnnex];
  writeFile(
    "docs/proposal-main.md",
    proposalMain,
    `pre=${preAnnex.length}, post=${postAnnex.length}`,
  );

  // Each annex spans from its heading to the next `### ` heading
  // (annex N+1 if any, else "Supporting links").
  for (let i = 0; i < annexes.length; i++) {
    const h = annexes[i]!;
    const nextIdx = annexes[i + 1]?.index ?? supportingIdx;
    const slice = trimTail(lines.slice(h.index, nextIdx));
    writeFile(`docs/annex-${h.num}.md`, slice, `"${h.title}"`);
  }
}

main();
