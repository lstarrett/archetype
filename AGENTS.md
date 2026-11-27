# Archetype — Agent Instructions

Architecture, domain conventions, and design rationale live in [ARCHITECTURE.md](ARCHITECTURE.md);
foundational decisions in [ADR.md](ADR.md); installing, running, and using the system in
[README.md](README.md). This file covers how agents should work in the repo.

## Coding principles

### General

- Minimize diff scope; match surrounding naming, types, and patterns.
- Prefer simplicity and alignment with established best practices; within that constraint, prefer
  the most modern and best-in-class solution.
- Reuse existing abstractions — do not over-engineer or add one-off helpers.
- Avoid arcane language conventions unless truly necessary; prefer simplicity, clarity, and
  readability wherever possible.
- Tests when they cover real behavior — not trivial assertions.
- Tests must be deterministic: independent of host timezone, wall clock, and run order. Build
  instants from calendar fields in the test's own zone rather than from literals that assume one.
- Tests must be written to test the application as it is. No mechanisms or fixtures exclusively for
  the sake of the automated tests should be built into the application; they remain independent
  components of the test suite.
- When a refactor supersedes a constant, helper, or dead branch, delete it — no dead code, no stale
  "mirrors X" remnants. See **Documentation** for what this means for the prose that described it.
- Do not invoke `git commit`. The repository owner writes commit messages and performs all commits.

### Project-specific

This repository has two audiences: the archetype's own root documents govern work on the archetype,
and everything under `template/` is what a new project receives. Four rules keep them apart.

1. **`template/core` stays language-agnostic.** Anything that names a tool, a runtime, or a command
   belongs in a stack's `fragments/` or `files/`, filling a marker the core leaves open.
2. **A change to a shared idea lands everywhere it is expressed, in the same diff** — the core
   passage and every stack's fragment for it, so no stack ships the old rule.
3. **Template files never cite the archetype's own ADRs or anchors.** A scaffolded project has no
   copy of them; a template reference resolves against the template's own docs, and an ADR id in a
   template is always written `ADR-NNN`.
4. **`PROJECT-SPECIFIC` notes and archetype markers in `template/` are deliberate content**, not
   unfinished work. Resolving one here would hand every new project a decision that is theirs.

The two defaults below apply to the archetype's own code as to any project's:

- One source of truth for every value. A placeholder, a marker name, or a stack's setting has one
  home, and the reference tables in [ARCHITECTURE.md](ARCHITECTURE.md) describe it rather than
  restate it.
- Fail fast with a readable error at every boundary — a bad argument to the setup script, an unknown
  stack, a file it would overwrite — and never silently fall back to a guess.

### Change verification

The builder runs this full pass as the last step of its workflow, before handing off for review:

```sh
bun run lint:fix # apply auto-formatting first…
bun run lint # …then confirm a clean pass
bun run typecheck
bun test
```

- For a change under `template/` or to `scripts/new-project.sh`, also scaffold a project with the
  changed stack into a temporary directory, install it, and run its own verification pass there.
- Self-review the final diff before handoff — scope matches the plan, and nothing is left half done:
  the **Code review** pass below is that sweep in full.

## Code review

Run this at the end of a round of development, once the work reads and behaves the way it should and
before the owner's final look. What it asks is not whether the design is right — that was settled
while building — but whether the diff commits to one approach and carries its own documentation.

1. **Read the whole round, not the last change.** Every file the round touched, diff in hand, docs
   included. A tidy last commit over a half-finished earlier one still reads as half finished.
2. **Delete what is no longer chosen.** Alternatives left in waiting, commented-out branches,
   temporary fixtures and toggles, debug output, stray files, any constant, helper, or dead branch
   the round superseded, and formatting churn that changed no prose. An option held open in the code
   is a decision the next reader has to make again.
3. **Finish what is only half applied.** A rename that stopped partway, a rule enforced at one call
   site and not its twin, a value that has quietly gained a second home, a parameter nothing passes
   any more, a naming scheme the newest code follows and the oldest does not.
4. **Finalize all corresponding documentation** — and no more than its own — in the same diff as the
   code (see **Documentation**): the reference files, the env and config samples, and any comment or
   test name still describing how it used to work. Tentative wording — "for now", "experimental",
   "may change" — either becomes a decision or an entry with a `Resolves when`.
5. **Hold each comment to the standard of where it lives.** Rationale is deleted, or moved only if
   it is load-bearing and has nowhere else to live; narration goes; anything that would read the
   same with the code closed is describing the system rather than the line.
6. **Check the record.** Pointers still resolve, no orphaned section survives what it described,
   statuses come from the closed set, and numbers are appended rather than reused. A foundational
   decision earns an entry; anything smaller gets a commit message, or a remark beside the line it
   constrains.
7. **Confirm the tests say what changed.** New behavior is named by a test rather than explained in
   a comment, and nothing new leans on the clock, the host timezone, or run order.
8. **Re-run Change verification, then hand off** with what changed, what was cleaned up, and any
   judgment call left for the owner to settle — including anything found here that would be a design
   change rather than a tidy-up. The owner reviews and commits.

## Documentation

**Before asking where a paragraph goes, ask whether it should exist.** Each home asks one question,
and a paragraph has to earn the one it is sitting in:

1. **`README.md`** — does a deploying administrator need this to install, run, configure, or use the
   system?
2. **`ARCHITECTURE.md`** — would a maintainer fail to get this from the code, the type, and the test
   names?
3. **`ADR.md`** — is this foundational enough to the core design to earn a permanent entry, with a
   change path the commit that made it leaves genuinely unclear?

**A paragraph that fails its home's question is deleted, not moved to another.** It has already been
judged not to be reference, not to be inferable, and not to be reasoning, so there is no home left
for it. Relocation is how documentation balloons to tens of thousands of words while every rule
below is followed. What replaces a deleted paragraph is usually nothing — sometimes a pointer to the
function that implements it, or a test name that says what it does.

**Five homes, one truth.** Every explanation has exactly one place to live: **source comments** for
what must hold at that line; `README.md` for installing, running, testing, deploying, and using the
system; `ARCHITECTURE.md` for how the system works and why it is shaped that way; `ADR.md` for
foundational decisions; `AGENTS.md` for how agents work here. A decision explained in two of them is
a decision that will soon be described two different ways.

The changelog is the git history — commit messages are written to match what each commit changed,
and nothing here duplicates that job.

**What a comment is for:** stopping a wrong edit to the code beside it. Units, bounds, invariants,
non-obvious constraints, the reason a guard or a clamp exists, and a one-line contract for anything
exported. If the prose would read the same with the code closed, it is describing the system rather
than the line, and belongs in `ARCHITECTURE.md` or `ADR.md` with a pointer left behind — or nowhere.
Never narrate what the code plainly says.

`ARCHITECTURE.md` is written in the present tense and describes the system as it stands, with no
archaeology. `ADR.md` keeps the reasoning and the roads not taken.

**Budgets, as signals rather than quotas.** An ADR entry runs about 200 words, 300 for a genuinely
intricate one; an `ARCHITECTURE.md` subsection about 400. A budget is a signal to re-read, not a
line to trim to — an entry that truly needs more keeps it, and shows it by reading as dense rather
than padded. Hitting a budget by compressing prose into telegraphic fragments fails the goal, which
is a document someone reads start to finish.

**What is being removed is prose a reader does not need. A smaller file is a side effect, never the
goal, and never the measure of success.** Formatting is a separate question, judged only on whether
the result reads better:

- **Changing formatting to make code clearer is always welcome**, in any round, implementing or
  refactoring — collapsing delimiters, re-flowing a paragraph, and tightening whitespace included.
- **The same change is not acceptable when its only effect is a smaller file.** If the prose is
  unchanged and the formatting no clearer, there was no reason to touch it.
- **Wholesale reformatting belongs in a round whose stated purpose is refactoring**, not in a
  feature diff, where it buries the change under churn.

**One width, 100 columns**, so a mid-paragraph revision lands on its own line instead of superseding
the commit message for the whole paragraph, and a vertical-motion editor stays usable. The width is
applied by formatters rather than remembered, because a rule a person has to remember is a rule that
drifts. Nothing unbreakable — a path, a URL, an identifier — counts as a violation. This is a
source-editing rule, not a rendering one: a standard markdown renderer collapses soft breaks, so
wrapping never shows in the rendered doc. A block comment of four or more lines keeps its opening
and closing delimiters on their own lines; three or fewer runs compressed.

`biome` applies the width to code and Prettier to markdown, both under `bun run lint`; comment prose
is the one width no formatter rewrites, so `tests/docs.test.ts` checks it and a human wraps what it
names.

- **The threshold is roughly three lines.** Past that, a comment is usually explaining a decision
  rather than a constraint — delete it, or move it only if it is load-bearing and has nowhere else
  to live.
- **One comment standard for every source tree.** Nothing in the source carries design narrative,
  rationale, or trade-off prose: brief remarks that only make sense beside the line they sit on,
  one-line contracts for exported functions, units, invariants, and constraints. Where a tree is
  served to the public as source, its comments are public too — a reason to hold that tree to the
  bar first, not a reason to hold the others to a lower one.
- **Never duplicate a reference table between code and docs.** The doc is authoritative; the code
  points to it. A type is documented once, in the type. Prose that _narrates_ what a type encodes is
  not a reference table, and belongs nowhere.
- **Point with `ARCHITECTURE.md#<anchor>` or `ADR-NNN`.** The docs guard fails on a reference that
  no longer resolves, so keep headings short and stable, and fix the reference when a heading
  changes.
- **`ADR.md` holds foundational decisions, not a changelog.** An entry is earned by a decision
  significant to the core design that had a real alternative — not by a change merely being
  unobvious. A register that records every unobvious change stops being read, and then the entries
  that matter are lost among it. Anything short of that bar gets a commit message and nothing else.
- **"Someone could undo this without knowing why" earns a comment, not an entry.** A duplication
  kept on purpose, a fail-fast rule broken deliberately, a magic number in two files — each is a
  constraint at a line, and a one-line remark there is what stops the wrong edit. Sending them to
  `ADR.md` puts the warning where the mistaken edit will not be.
- **Record the reasoning the diff cannot show.** Why this and not that, and what would change our
  minds. If an entry could be written by reading the diff alone, it belongs in the commit message
  instead.
- **Before undoing something that looks wrong, read what sits beside it, then `ADR.md`.** A
  duplication, a fallback, or a magic number in two files is usually there on purpose; the remark
  beside it says so, and an entry says what would take it off the list.
- **When a decision has fully settled**, fold into `ARCHITECTURE.md` only what a maintainer cannot
  get from the code; most settled decisions retire to a tombstone line and nothing more.
- **ADR numbers are permanent.** Append; never renumber, never reuse. A reversal is a new ADR that
  supersedes the old one, and the old one's status becomes `Superseded by ADR-NNN` rather than being
  edited into agreement.
- **Status comes from the closed set** that `ADR.md` tabulates and the docs guard enforces. Anything
  temporary carries a `Resolves when` condition.
- **Behavior narrative belongs in test names.** Tests are executable documentation; a well-named
  test often replaces the comment that would have explained the same rule.
- **When behavior changes, its documentation changes in the same diff** — `README.md`,
  `ARCHITECTURE.md`, `ADR.md`, env and config samples, and any comment that describes the old
  behavior.
- **When a refactor supersedes rationale, delete it.** That includes the `ARCHITECTURE.md` passage
  and any pointer to it; no orphaned sections, no comments that reference a superseded design. An
  ADR is the exception: it is superseded, not deleted.
- **A new module earns a line in the ARCHITECTURE module map** in the same diff that adds it.

## Plan-to-build workflow

Plan first for multi-file features, architectural decisions, or unclear scope. Continuity between
planning and building comes from the **saved plan file**, not the planning chat — the plan must
stand alone.

**Planning (thinking model)**

1. Build a plan with no ambiguity: goal, non-goals, files to touch, concrete steps, verification,
   and locked decisions. A builder reading only the plan should never need to guess or re-litigate a
   choice.
2. Craft the plan's todos to be as independent and parallelizable as possible: each todo names its
   files and its acceptance criteria, avoids overlapping edits with sibling todos, and states any
   ordering dependency explicitly — so on large plans, multiple builder agents can work separate
   todos simultaneously on the same branch without colliding.

**Building (builder model)**

1. The builder is invoked against the entire plan or an individual todo. It works from the plan file
   alone, implements exactly what it prescribes, and surfaces conflicts between the plan and reality
   rather than improvising around them. It finishes by running the **Change verification** pass
   above, so review starts from a green baseline.

**Review and commit**

1. After the build, the thinking model reviews the changes against the plan: every todo satisfied,
   coding principles upheld, verification steps run and passing, nothing beyond the plan's scope —
   then the **Code review** pass over the round as a whole.
2. Fix or modify for minor improvements as needed.
3. For any recommendation that involves a significant trade-off or requires validation, bring it to
   the repository owner for review before making a major change.
4. If a foundational trade-off or significant decision arises, record its outcome as an ADR in the
   same diff. Each entry should represent a real alternative or a meaningful decision point that
   arose during review.
5. After alignment between the thinking model and project owner is reached, the repository owner is
   responsible for committing the changes (agents must never commit — see coding principles).

**What lives where:** always-on agent guidance here (`AGENTS.md`); active feature plans in the agent
tool's own plan store, outside the repository; design, rationale, and reference grammars in
`ARCHITECTURE.md`; installing, running, and using the system in `README.md`; foundational decisions,
with what would or did resolve each, in `ADR.md` — read it before "fixing" a duplication or a
fallback, and retire an entry when its condition is met. A gitignored `plans/` folder may hold
optional local archive copies of plans for future reference, and a gitignored `scratch/` folder
holds throwaway probes and experiments.

## Git restrictions

1. Agents may not run `git commit`.
2. Agents may not write commit messages.
3. Agents may not run `git push`.
4. Agents may stage or unstage files, as long as the commit and push steps are left to the owner.
