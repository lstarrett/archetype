import { fileURLToPath } from "node:url";
import { checkDocs } from "../template/stacks/bun-typescript/files/tests/docs-guard.ts";

checkDocs({
  root: fileURLToPath(new URL("..", import.meta.url)),
  sources: [
    { dir: "scripts", ext: ".sh" },
    { dir: "tests", ext: ".ts" },
    { dir: "template", ext: ".ts" },
  ],
  extra: [".github/workflows/ci.yml", "bunfig.toml"],
  skip: ["template/"],
});
