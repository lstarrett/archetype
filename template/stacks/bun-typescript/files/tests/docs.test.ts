import { fileURLToPath } from "node:url";
import { checkDocs } from "./docs-guard.ts";

checkDocs({
  root: fileURLToPath(new URL("..", import.meta.url)),
  sources: [
    { dir: "src", ext: ".ts" },
    { dir: "tests", ext: ".ts" },
  ],
  extra: [".github/workflows/ci.yml"],
});
