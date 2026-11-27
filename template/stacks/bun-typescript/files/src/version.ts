// What build this is: `major.minor` from the VERSION file, and a patch counting the commits since
// that file last changed (ARCHITECTURE.md#app-version).
//
// Bun built-ins only: this module also runs as a CLI (`bun run src/version.ts`) in a CI step that
// installs no dependencies.

import { readFileSync } from "node:fs";

/** Holds the release line and nothing else, so a change to it means "the release line moved". */
const RELEASE_FILE = "VERSION";

/** The `major.minor` a VERSION file's contents name. */
export function releaseLine(contents: string): string {
  const line = contents.trim();
  if (!/^\d+\.\d+$/.test(line)) {
    throw new Error(
      `${RELEASE_FILE} must hold a release line, "major.minor" (e.g. 0.1), not ${JSON.stringify(line)}`,
    );
  }
  return line;
}

/** A git command's trimmed stdout, or null where git cannot answer. */
function git(...args: string[]): string | null {
  try {
    const { success, stdout } = Bun.spawnSync(["git", ...args], { stderr: "ignore" });
    return success ? new TextDecoder().decode(stdout).trim() : null;
  } catch {
    return null;
  }
}

/** Non-merge commits since the release line last moved; zero where git cannot answer. */
function commitsSinceRelease(): number {
  const base = git("log", "-1", "--format=%H", "--", RELEASE_FILE);
  if (!base) return 0;
  const count = Number(git("rev-list", "--count", "--no-merges", `${base}..HEAD`));
  return Number.isSafeInteger(count) ? count : 0;
}

/** This build's version, `major.minor.patch`; `stamped` (APP_VERSION) wins when set. */
export function appVersion(stamped: string): string {
  if (stamped !== "") return stamped;
  return `${releaseLine(readFileSync(RELEASE_FILE, "utf8"))}.${commitsSinceRelease()}`;
}

if (import.meta.main) {
  console.log(appVersion(""));
}
