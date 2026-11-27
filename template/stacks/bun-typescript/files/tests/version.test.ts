import { describe, expect, test } from "bun:test";
import { appVersion, releaseLine } from "../src/version.ts";

describe("releaseLine", () => {
  test("reads major.minor, trailing newline and all", () => {
    expect(releaseLine("0.1\n")).toBe("0.1");
    expect(releaseLine("12.7")).toBe("12.7");
  });

  test("a patch in the release file is a mistake, since the patch is counted", () => {
    expect(() => releaseLine("0.1.0")).toThrow(/must hold a release line/);
  });

  test("names the file and what it found when the line is unreadable", () => {
    expect(() => releaseLine("v0.1")).toThrow(/VERSION must hold .* not "v0\.1"/);
    expect(() => releaseLine("")).toThrow(/not ""/);
  });
});

describe("appVersion", () => {
  test("a stamped build is taken verbatim — it carries no history to count", () => {
    expect(appVersion("3.5.22")).toBe("3.5.22");
    expect(appVersion("3.5.22-beta")).toBe("3.5.22-beta");
  });

  test("an unstamped build counts commits against the release line", () => {
    // The count moves with every commit, so the shape is what can be asserted.
    expect(appVersion("")).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
