import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Guards the two references code is allowed to make into the docs, so neither can rot: a section
// anchor, and an ADR id. Also guards comment width, the one width no formatter applies. Every scan
// is sorted, so a failure names the same offender whatever order the filesystem hands them over in.

export interface CheckDocsOptions {
  /** Absolute path of the repository root; every other path is relative to it. */
  root: string;
  /** Directories walked recursively, and the extension of the files each one carries. */
  sources: { dir: string; ext: string }[];
  /** Markdown files that may both hold anchors and reference them. */
  docs?: string[];
  /** Single files outside the source trees that carry the same pointers. */
  extra?: string[];
  /** Path prefixes exempt from the reference checks, for a tree resolving against its own docs. */
  skip?: string[];
}

/** Every status an ADR may carry, besides `Superseded by` with an id. */
const STATUSES = ["Accepted", "Active workaround", "Backlog", "Won't do"];

/** Extensions whose comments carry prose; `.json` has no comment syntax. */
const COMMENTED = [".js", ".ts", ".css"];

/** Columns, matching the code and markdown formatters' width. */
const COMMENT_WIDTH = 100;

const HEADING = /^#{1,6}\s+(.+?)\s*$/;
const ADR_HEADING = /^##\s+ADR-(\d{3}):\s*(.+?)\s*$/;
const ADR_REFERENCE = /ADR-(\d{3})/g;
const STATUS_LINE = /^-\s+\*\*Status:\*\*\s*(.+?)\s*$/;

interface Scanned {
  file: string;
  lines: string[];
}

/** A heading's GitHub anchor: lowercased, punctuation dropped, spaces hyphened. */
export function slug(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s/g, "-");
}

/** Lines that are wholly a comment; a trailing comment shares its width with code. */
function commentLines(lines: string[]): { line: number; text: string }[] {
  const found: { line: number; text: string }[] = [];
  let inBlock = false;
  lines.forEach((text, i) => {
    const trimmed = text.trim();
    const isComment = inBlock || trimmed.startsWith("//") || trimmed.startsWith("/*");
    if (trimmed.startsWith("/*") && !trimmed.includes("*/")) inBlock = true;
    else if (inBlock && trimmed.includes("*/")) inBlock = false;
    if (isComment) found.push({ line: i + 1, text });
  });
  return found;
}

/** Registers the docs guard's tests. A missing directory or file is skipped, not an error. */
export function checkDocs(options: CheckDocsOptions): void {
  const { root, sources } = options;
  const docs = options.docs ?? ["README.md", "ARCHITECTURE.md", "ADR.md", "AGENTS.md"];
  const skip = options.skip ?? [];
  const exists = (path: string) => existsSync(join(root, path));
  const read = (path: string) => readFileSync(join(root, path), "utf8").split("\n");

  const paths = [...docs, ...(options.extra ?? [])].filter(exists);
  for (const { dir, ext } of sources) {
    if (!exists(dir)) continue;
    const entries = readdirSync(join(root, dir), { recursive: true, encoding: "utf8" });
    paths.push(...entries.filter((name) => name.endsWith(ext)).map((name) => join(dir, name)));
  }
  const files: Scanned[] = [...new Set(paths)].sort().map((file) => ({ file, lines: read(file) }));
  const referencing = files.filter(({ file }) => !skip.some((prefix) => file.startsWith(prefix)));

  const anchors = new Map<string, string[]>(
    docs.map((doc) => [
      doc,
      exists(doc)
        ? read(doc)
            .map((line) => HEADING.exec(line)?.[1])
            .filter((heading) => heading !== undefined)
            .map(slug)
        : [],
    ]),
  );
  const adrLines = exists("ADR.md") ? read("ADR.md") : [];
  const adrEntries = adrLines
    .map((line) => ADR_HEADING.exec(line))
    .filter((match) => match !== null)
    .map((match) => ({ number: Number(match[1]), subject: match[2] ?? "" }));

  describe("documentation anchors", () => {
    test("every heading in a referenced doc has a unique anchor", () => {
      // Two headings sharing an anchor would send half their citations to the wrong section.
      for (const doc of docs) {
        const list = anchors.get(doc) ?? [];
        expect([...new Set(list)].sort()).toEqual([...list].sort());
      }
    });

    test("every anchor reference resolves to a heading", () => {
      const dangling: string[] = [];
      for (const doc of docs) {
        const pattern = new RegExp(`${doc.replace(".", "\\.")}#([a-z0-9-]+)`, "g");
        for (const { file, lines } of referencing) {
          lines.forEach((line, i) => {
            for (const [, anchor] of line.matchAll(pattern)) {
              if (!(anchors.get(doc) ?? []).includes(anchor ?? "")) {
                dangling.push(`${file}:${i + 1} → ${doc}#${anchor}`);
              }
            }
          });
        }
      }
      expect(dangling.sort()).toEqual([]);
    });
  });

  describe("ADR references", () => {
    test("every ADR id cited anywhere is an entry in ADR.md", () => {
      const defined = new Set(adrEntries.map((entry) => entry.number));
      const dangling: string[] = [];
      for (const { file, lines } of referencing) {
        lines.forEach((line, i) => {
          for (const [, digits] of line.matchAll(ADR_REFERENCE)) {
            if (!defined.has(Number(digits))) dangling.push(`${file}:${i + 1} → ADR-${digits}`);
          }
        });
      }
      expect(dangling.sort()).toEqual([]);
    });

    test("numbers are unique, start at 1, and leave no gaps", () => {
      // Numbers are permanent and cited from commits and code, so a renumber is never the fix.
      const numbers = adrEntries.map((entry) => entry.number);
      expect(numbers).toEqual([...new Set(numbers)]);
      expect([...numbers].sort((a, b) => a - b)).toEqual(numbers.map((_, i) => i + 1));
    });

    test("every entry carries a status from the closed set", () => {
      // A retired tombstone keeps its heading as a citation target and carries no status.
      const bodies = adrEntries.filter((entry) => !/\bretired\b/i.test(entry.subject));
      const statuses = adrLines
        .map((line) => STATUS_LINE.exec(line)?.[1])
        .filter((status) => status !== undefined);
      expect(statuses).toHaveLength(bodies.length);

      const unknown = statuses
        .filter((status) => !STATUSES.includes(status) && !/^Superseded by ADR-\d{3}$/.test(status))
        .sort();
      expect(unknown).toEqual([]);
    });
  });

  describe("comment width", () => {
    test("no comment line runs past the ceiling it could have wrapped under", () => {
      // Overflow with no space in it is a path, URL, or identifier no wrap could shorten.
      const over: string[] = [];
      for (const { file, lines } of files) {
        if (!COMMENTED.some((ext) => file.endsWith(ext))) continue;
        for (const { line, text } of commentLines(lines)) {
          if (text.length > COMMENT_WIDTH && text.slice(COMMENT_WIDTH).includes(" ")) {
            over.push(`${file}:${line} (${text.length} columns)`);
          }
        }
      }
      expect(over.sort()).toEqual([]);
    });
  });
}
