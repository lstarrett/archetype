`src/version.ts` resolves it: `appVersion(stamped)` returns a stamped `APP_VERSION` verbatim, and
otherwise reads `VERSION` and counts with git. Run as a script, `bun run src/version.ts` prints the
version, which is how a build step stamps one; the module uses Bun built-ins only, so that step
needs no install. The checkout must carry full history (`fetch-depth: 0` in CI), since a shallow
clone cannot count.
