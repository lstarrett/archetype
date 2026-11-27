`bun test` runs the suite. The docs guard is `tests/docs-guard.ts`, registered by
`tests/docs.test.ts` with the directories it scans — add a source tree to that list in the same diff
that creates it. Tests build instants with `new Date(year, monthIndex, day, hours, minutes)`, which
reads its fields in the host's zone, so the same calendar fields name the same moment of the day
anywhere the suite runs.
