# Architecture

How the archetype works, and why it is shaped this way. [README.md](README.md) covers starting a
project from it and adding a stack; [ADR.md](ADR.md) keeps the decisions that had a real
alternative.

## Two document sets

The root documents — this file, `README.md`, `AGENTS.md`, `ADR.md`, `VERSION` — govern the archetype
itself. Everything a new project receives lives under `template/`, and nothing under it describes
the archetype (ADR-001). The root `AGENTS.md` is the template's own, applied to this repository, so
the archetype is held to the rules it hands out.

## Template layout

```
template/
  core/                    language-agnostic: the five documents and a .gitignore
  stacks/<name>/
    files/                 overlaid onto the project: configs, source, tests, CI
    fragments/<marker>.md  fills the core passage of the same name
    gitignore              appended to the core .gitignore
```

The core documents say what every project holds to; a stack says how, in one language and its tools
(ADR-002). A core-only project is valid: every marked passage keeps its `PROJECT-SPECIFIC` note, for
the project to fill by hand.

## Placeholders and markers

The setup script replaces two placeholders, wherever they appear in a copied file:

| Placeholder        | Becomes                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| `{{PROJECT_NAME}}` | the name as given, verbatim                                                |
| `{{PROJECT_SLUG}}` | the name lowercased, each run of anything but `a-z0-9` a `-`, ends trimmed |

A marked passage in a core document is fenced by `<!-- archetype:begin NAME -->` and
`<!-- archetype:end NAME -->` lines, each with a blank line on both sides. Seven names exist:

| Marker             | Document        | The stack supplies                                         |
| ------------------ | --------------- | ---------------------------------------------------------- |
| `validation`       | AGENTS.md       | the library that validates at boundaries                   |
| `verification`     | AGENTS.md       | the commands of the verification pass                      |
| `formatters`       | AGENTS.md       | the tools holding code, markdown, and comments to 100 cols |
| `quick-start`      | README.md       | prerequisites and the first commands                       |
| `scripts`          | README.md       | the table of contributor commands                          |
| `version-resolver` | ARCHITECTURE.md | where the resolver lives and how a build calls it          |
| `testing`          | ARCHITECTURE.md | the runner, the docs guard's home, the determinism idiom   |

The word that names the fence appears nowhere else in `template/core`, which is what lets the tests
assert none survives into a scaffolded project.

## The setup script

`scripts/new-project.sh` works in a fixed order, and checks before it writes:

1. Resolves the stack and the slug, and refuses an unknown stack or a name with no letters or
   digits.
2. Lists every file core and the stack's `files/` would produce, and refuses — naming each one — if
   any already exists in the target. A target holding only `.git` and a `LICENSE` is fine.
3. Copies core, then overlays the stack's `files/`. `.DS_Store` never travels.
4. Splices each markdown file: a marked passage takes the fragment of its name, or keeps its note
   when the stack has none; the fence lines and the blank after each are dropped, so the passage
   sits between single blank lines like its neighbors.
5. Appends the stack's `gitignore` to `.gitignore`.
6. Substitutes the placeholders by literal index, never by regex, so a name holding `&` or `/` lands
   verbatim.

It never runs git; initializing, installing, and the first commit belong to whoever runs it.

## Stack contract

A stack is a directory under `template/stacks/` with a `files/` tree; `fragments/` and `gitignore`
are optional, but a stack that leaves a marker unfilled leaves its project a note to fill instead.
Whatever the language, a stack makes the core's rules real:

- a code formatter and a markdown formatter at 100 columns, and a check holding comment prose to the
  same width;
- a docs guard with the checks below;
- a version resolver that follows `template/core/ARCHITECTURE.md`'s app-version section;
- a test runner, and an idiom for building instants independent of the host's zone.

## Docs guard

One guard, `template/stacks/bun-typescript/files/tests/docs-guard.ts`, exports `checkDocs`. It
checks that every `<Doc>.md#anchor` and ADR reference resolves, that anchors are unique, that ADR
numbers are unique and gapless (zero entries passes), that every status is from the closed set, and
that no comment line runs past 100 columns where it could have wrapped. A missing directory or doc
is skipped.

It runs two ways. A Bun project scaffolded from the template calls it from its own
`tests/docs.test.ts`. The archetype calls the same module from its root `tests/docs.test.ts`, with
`template/` exempt from the reference checks — a template reference resolves against the template's
own docs, not these (ADR-004). Comment width is checked everywhere.

## Testing strategy

`bunfig.toml` roots the suite at `tests/`, so the stack's own test files under `template/` run only
inside a scaffolded project, never against the archetype's root.

`tests/new-project.test.ts` scaffolds core alone and then every directory in `template/stacks/` into
a temporary directory, and asserts that no placeholder or fence survives, that the name heads the
README, that `PROJECT-SPECIFIC` notes remain only where the stack supplied no fragment, that the
spliced documents pass Prettier as they stand, and that the stack's files arrived. A new stack is
covered the moment its directory exists. It also asserts that a second run into the same target
refuses, and how a slug is derived. For a stack whose tests need no install, such as
`bun-typescript`, it runs the scaffolded project's own suite.

## Module map

| Path                        | Owns                                                              |
| --------------------------- | ----------------------------------------------------------------- |
| `scripts/new-project.sh`    | scaffolding a project from core and a stack                       |
| `template/core/`            | the language-agnostic documents every project starts with         |
| `template/stacks/<name>/`   | one language's files, fragments, and ignores                      |
| `tests/docs.test.ts`        | the docs guard over the archetype's own documents                 |
| `tests/new-project.test.ts` | scaffolding core and every stack, and what each scaffold contains |
