# Architecture decision record

Foundational decisions about the archetype itself — the ones that had a real alternative, and whose
change path the commit that made them leaves unclear. The git history is the changelog. The register
a new project receives is `template/core/ADR.md`, which starts empty.

## How this file works

**Status** comes from a closed set, checked by the docs guard:

| Status                  | Means                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| `Accepted`              | decided and in effect                                                        |
| `Active workaround`     | in effect, with a `Resolves when` condition. Something we want to stop doing |
| `Backlog`               | decided we want it; not built                                                |
| `Superseded by ADR-NNN` | kept for the trail                                                           |
| `Won't do`              | considered and declined                                                      |

**Numbers are permanent** and never reused. New entries append; a reversal is a new entry that
supersedes the old one. Each entry carries `Status`, `Context`, `Decision`, `Alternatives`, `Why`,
and — for anything temporary — `Resolves when`.

## ADR-001: The boilerplate lives under template/, beside the archetype's own documents

- **Status:** Accepted
- **Context:** The archetype needs documents of its own — how to use it, how to extend it, why it is
  shaped this way — and also ships a set of documents for new projects. Both sets carry the same
  file names.
- **Decision:** The archetype's documents sit at the root; everything a project receives sits under
  `template/`, and the setup script copies only from there.
- **Alternatives:** The boilerplate at the root, with the archetype's notes elsewhere, so the repo
  could be cloned as a starting point directly; or the boilerplate on its own branch.
- **Why:** At the root, every clone would inherit the archetype's own notes to delete, and the two
  sets would be indistinguishable by name. A branch hides the boilerplate from the tests that check
  it and from every edit that should touch both. A subdirectory keeps one tree, one test suite, and
  one diff for a change to both.

## ADR-002: The core is language-agnostic, and stacks fill named markers

- **Status:** Accepted
- **Context:** The process rules — documentation homes, code review, versioning, plan-to-build —
  hold in any language. The commands that enforce them do not.
- **Decision:** `template/core` names no tool. Each passage that needs a command is fenced by a
  named marker, and each stack supplies a fragment per marker, spliced in at setup.
- **Alternatives:** A complete set of documents per language; or core documents written for Bun +
  TypeScript, edited by hand for any other language.
- **Why:** A full set per language duplicates every shared rule, and a rule duplicated per stack is
  a rule that drifts. Hand edits leave the core's examples wrong for every project not in the first
  language. Markers confine the per-language part to a few lines each, and an unfilled marker
  degrades to a `PROJECT-SPECIFIC` note rather than to wrong text. A language whose needs do not fit
  the passages grows the marker set, which every stack then fills — it does not fork the core.

## ADR-003: The boilerplate's ADR starts empty, with the learnings folded into its documents

- **Status:** Accepted
- **Context:** The archetype was distilled from a project whose register held the reasoning behind
  its documentation width, comment standard, cut-don't-move rule, entry bar, and versioning scheme.
- **Decision:** Each of those rules is restated inline in the core document it governs, with its
  reason in a clause. `template/core/ADR.md` keeps its format and status table, and no entries.
- **Alternatives:** Seed every new project's register with those entries.
- **Why:** An entry records a decision the project made, with alternatives it weighed. A new project
  made none of these; it inherited them. Seeded entries would give it numbers it did not earn, and
  would put the rule where the next reader of the document governed by it does not look.

## ADR-004: The archetype checks its own documents with the Bun stack's guard

- **Status:** Accepted
- **Context:** The archetype's root documents cite anchors and ADR ids, as any project's do, and
  need the same guard against rot.
- **Decision:** The root `tests/docs.test.ts` imports `checkDocs` from the Bun stack's `files/`, and
  exempts `template/` from the reference checks.
- **Alternatives:** A copy of the guard at the root.
- **Why:** A copy would be a second home for the same checks, drifting from the one projects
  receive. Importing the shipped guard also exercises it on every archetype test run. The exemption
  is required, not convenient: a template's references resolve against the template's documents,
  which a scaffolded project has and the root does not. Were the archetype's own tooling to leave
  Bun, the guard it imports would move with it.
