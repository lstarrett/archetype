import { afterAll, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCRIPT = join(ROOT, "scripts", "new-project.sh");
const CORE = join(ROOT, "template", "core");
const STACKS = join(ROOT, "template", "stacks");

/** Stacks whose scaffolded suite runs with no dependency install. */
const SELF_TESTING = ["bun-typescript"];

const NAME = "Test Project";
const NOTE = "PROJECT-SPECIFIC";
const BEGIN = /^<!-- archetype:begin ([a-z-]+) -->$/gm;

const stacks = readdirSync(STACKS)
  .filter((name) => existsSync(join(STACKS, name, "files")))
  .sort();

const scratch = mkdtempSync(join(tmpdir(), "archetype-test-"));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));
let runs = 0;

function scaffold(args: string[], target = join(scratch, `run-${++runs}`)) {
  const run = Bun.spawnSync(["bash", SCRIPT, ...args, target], { stdout: "pipe", stderr: "pipe" });
  return {
    target,
    exitCode: run.exitCode,
    stderr: new TextDecoder().decode(run.stderr),
  };
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((name) => statSync(join(dir, name)).isFile())
    .sort();
}

function occurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

const coreMarkdown = filesUnder(CORE).filter((file) => file.endsWith(".md"));
const coreNotes = coreMarkdown.reduce(
  (sum, file) => sum + occurrences(readFileSync(join(CORE, file), "utf8"), NOTE),
  0,
);
const markers = coreMarkdown.flatMap((file) =>
  [...readFileSync(join(CORE, file), "utf8").matchAll(BEGIN)].map((match) => match[1] ?? ""),
);

const cases: [string, string | undefined][] = [
  ["core only", undefined],
  ...stacks.map((stack): [string, string] => [`the ${stack} stack`, stack]),
];

describe.each(cases)("scaffolding %s", (_, stack) => {
  const run = scaffold(stack ? ["--stack", stack, NAME] : [NAME]);
  const files = run.exitCode === 0 ? filesUnder(run.target) : [];
  const read = (file: string) => readFileSync(join(run.target, file), "utf8");
  const filled = stack
    ? markers.filter((marker) => existsSync(join(STACKS, stack, "fragments", `${marker}.md`)))
    : [];

  test("succeeds", () => {
    expect(run.stderr).toBe("");
    expect(run.exitCode).toBe(0);
  });

  test("leaves no placeholder and no marker behind", () => {
    expect(files.filter((file) => read(file).includes("{{"))).toEqual([]);
    expect(files.filter((file) => read(file).includes("archetype:"))).toEqual([]);
  });

  test("names the project in the README title", () => {
    expect(read("README.md").split("\n")[0]).toBe(`# ${NAME}`);
  });

  test("keeps a PROJECT-SPECIFIC note only where the stack supplied no fragment", () => {
    const notes = files.reduce((sum, file) => sum + occurrences(read(file), NOTE), 0);
    expect(notes).toBe(coreNotes - filled.length);
    for (const marker of filled) {
      const fragment = readFileSync(join(STACKS, stack ?? "", "fragments", `${marker}.md`), "utf8");
      expect(coreMarkdown.some((file) => read(file).includes(fragment.trimEnd()))).toBe(true);
    }
  });

  test("its documents are already formatted", () => {
    const prettier = join(ROOT, "node_modules", ".bin", "prettier");
    const markdown = files.filter((file) => file.endsWith(".md"));
    const check = Bun.spawnSync(
      [prettier, "--config", join(ROOT, ".prettierrc"), "--check", ...markdown],
      { cwd: run.target, stdout: "pipe", stderr: "pipe" },
    );
    expect(new TextDecoder().decode(check.stderr)).toBe("");
    expect(check.exitCode).toBe(0);
  });

  test("copies every core and stack file", () => {
    const expected = [
      ...filesUnder(CORE),
      ...(stack ? filesUnder(join(STACKS, stack, "files")) : []),
    ];
    expect(expected.filter((file) => !files.includes(file))).toEqual([]);
  });

  if (stack && SELF_TESTING.includes(stack)) {
    test("passes its own test suite", () => {
      const suite = Bun.spawnSync(["bun", "test"], {
        cwd: run.target,
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(suite.exitCode).toBe(0);
    }, 30_000);
  }
});

describe("the setup script", () => {
  test("refuses to overwrite, naming each file it would have written", () => {
    const first = scaffold([NAME]);
    const second = scaffold([NAME], first.target);
    expect(second.exitCode).not.toBe(0);
    expect(second.stderr).toContain("refusing to overwrite");
    expect(second.stderr).toContain("README.md");
  });

  test("slugs a name to lowercase runs of letters and digits joined by single dashes", () => {
    const run = scaffold(["--stack", "bun-typescript", "  My App & Co./2  "]);
    expect(JSON.parse(readFileSync(join(run.target, "package.json"), "utf8")).name).toBe(
      "my-app-co-2",
    );
  });

  test("lands a name holding & and / verbatim", () => {
    const run = scaffold(["A & B/C"]);
    expect(readFileSync(join(run.target, "README.md"), "utf8").split("\n")[0]).toBe("# A & B/C");
  });

  test("refuses a name with nothing to slug, and an unknown stack", () => {
    expect(scaffold(["!!!"]).exitCode).not.toBe(0);
    const unknown = scaffold(["--stack", "no-such-stack", NAME]);
    expect(unknown.exitCode).not.toBe(0);
    expect(unknown.stderr).toContain("bun-typescript");
  });

  test("lists the stacks", () => {
    const run = Bun.spawnSync(["bash", SCRIPT, "--list-stacks"], { stdout: "pipe" });
    expect(new TextDecoder().decode(run.stdout).trim().split("\n")).toEqual(stacks);
  });
});
