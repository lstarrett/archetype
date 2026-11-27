# Architecture decision record

Foundational decisions — the ones significant to the core design that had a real alternative or a
meaningful trade-off, and whose change path the commit that made them leaves genuinely unclear.

This is not a changelog. The git history is the changelog. A change with no fork in the road belongs
in a commit message and nowhere else. What belongs here is the reasoning a later reader cannot
reconstruct from the diff: why this and not that, and what would change our minds.

**Not everything unobvious earns an entry.** A duplication kept on purpose, a fail-fast rule broken
deliberately, a magic number in two files — each is a constraint at a line, and a one-line remark
beside the code is what stops the wrong edit. Filing it here instead puts the warning where the
mistaken edit will not be. A renamed helper, a new feature, a bug fixed the only way it could be
fixed — none of these belong in either place.

Before undoing something that looks wrong, read what sits beside it, then read this file.

## How this file works

**Status** comes from a closed set, checked by the docs guard:

| Status                  | Means                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| `Accepted`              | decided and in effect                                                        |
| `Active workaround`     | in effect, with a `Resolves when` condition. Something we want to stop doing |
| `Backlog`               | decided we want it; not built                                                |
| `Superseded by ADR-NNN` | kept for the trail                                                           |
| `Won't do`              | considered and declined                                                      |

**Numbers are permanent** and never reused, so an `ADR-NNN` in a commit message, a plan, or a code
comment always means one thing. New entries append, starting from 001; nothing renumbers. A reversal
is a new entry that supersedes the old one, and the old one's status becomes `Superseded by ADR-NNN`
rather than being edited into agreement.

**Each entry** is a `## ADR-NNN: <the decision, stated as a sentence>` heading followed by these
fields, each a bullet with a bold label: `Status`, `Context`, `Decision`, `Alternatives`, `Why`, and
— for anything temporary — `Resolves when`. `Alternatives` may read "none seriously considered".
That is itself worth recording, and an honest entry beats a fabricated fork.

**Retirement.** When a decision has fully settled and its reasoning has been folded into
[ARCHITECTURE.md](ARCHITECTURE.md), the body may be deleted and the heading kept as a one-line
tombstone, marked `retired` and naming the section it was folded into. That keeps the file readable
without breaking a citation made months earlier, which is why the guard resolves a tombstone as a
valid target.

No entries yet.
