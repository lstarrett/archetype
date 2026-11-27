| Command                  | Does                                                |
| ------------------------ | --------------------------------------------------- |
| `bun test`               | the test suite, including the docs guard            |
| `bun run typecheck`      | `tsc --noEmit` over the whole tree                  |
| `bun run lint`           | biome over code, Prettier over markdown — no writes |
| `bun run lint:fix`       | the same, applying every fix it can                 |
| `bun run src/version.ts` | prints this build's version                         |
