# Archetype

A starting point for new projects: a set of documents — README, AGENTS, ARCHITECTURE, ADR, VERSION —
that carry a documentation discipline, coding principles, a plan-to-build workflow for working with
agents, and a commit-counted versioning scheme, plus per-language "stacks" that make those rules
executable. A script scaffolds a new project from them.

## Where things are

| Path                               | Holds                                                            |
| ---------------------------------- | ---------------------------------------------------------------- |
| `template/core/`                   | the language-agnostic documents every new project starts with    |
| `template/stacks/<name>/`          | one language's configs, source, tests, CI, and document passages |
| `scripts/new-project.sh`           | the setup script                                                 |
| `tests/`                           | the archetype's own tests                                        |
| [ARCHITECTURE.md](ARCHITECTURE.md) | how the template and the script work                             |
| [ADR.md](ADR.md)                   | the decisions behind the archetype's shape                       |
| [AGENTS.md](AGENTS.md)             | how agents work on the archetype                                 |

## Starting a new project

```sh
scripts/new-project.sh --list-stacks
scripts/new-project.sh --stack bun-typescript "Acme Portal" ~/projects/acme-portal
```

Leave out `--stack` for the documents alone. The target directory may already exist — a fresh
`git init` or a clone holding only a `LICENSE` is fine — but the script refuses, listing the files,
if anything it would write is already there. It never runs git.

What it does, so a person or an agent can do the same by hand:

1. Copies `template/core/` into the target.
2. Copies the stack's `files/` over it.
3. In each markdown file, replaces every passage between `<!-- archetype:begin NAME -->` and
   `<!-- archetype:end NAME -->` with `template/stacks/<stack>/fragments/NAME.md`. Where a stack has
   no fragment, it keeps the passage's `PROJECT-SPECIFIC` note. Either way it deletes the two marker
   lines and the blank line after each.
4. Appends the stack's `gitignore` to `.gitignore`.
5. Replaces `{{PROJECT_NAME}}` with the project's name, and `{{PROJECT_SLUG}}` with the name
   lowercased, every run of characters other than `a-z` and `0-9` turned into one `-`, and leading
   and trailing dashes trimmed.

To hand the job to an agent instead:

> Scaffold a new project named "Acme Portal" into `~/projects/acme-portal` from the archetype at
> `~/personal-projects/archetype`, using the `bun-typescript` stack: run its
> `scripts/new-project.sh`, or follow the steps in its README by hand. Then read the new project's
> `AGENTS.md` and work through every `PROJECT-SPECIFIC` note with me — do not invent answers to
> them. Do not commit.

Then, in the new project:

1. Resolve every `PROJECT-SPECIFIC` note — `grep -rn PROJECT-SPECIFIC --exclude-dir=node_modules .`
   lists them. Each says what the section should hold; replace the note with it.
2. Write the README's opening paragraph: what the system is, and who it is for.
3. Install the stack's dependencies (`bun install` for `bun-typescript`) and run the verification
   pass in `AGENTS.md`.
4. Make the first commit yourself.

## Stacks available

| Stack            | Provides                                                                    |
| ---------------- | --------------------------------------------------------------------------- |
| `bun-typescript` | Bun, TypeScript, biome, Prettier, zod; the docs guard, version resolver, CI |

## Adding a stack

A stack is a directory, `template/stacks/<name>/`, with:

- `files/` — everything copied into the project: package manifest, formatter and compiler configs,
  the version resolver, the tests, and CI. `{{PROJECT_NAME}}` and `{{PROJECT_SLUG}}` work in any of
  them.
- `fragments/<marker>.md` — one per marker, each a few lines of markdown that replaces that passage
  of the core documents. The seven markers, and what each passage needs, are tabled in
  [ARCHITECTURE.md#placeholders-and-markers](ARCHITECTURE.md#placeholders-and-markers).
- `gitignore` — the language's ignores, appended to the core `.gitignore`. Start it with a blank
  line.

Whatever the language, a stack must make these real, following the core documents:

- a code formatter and a markdown formatter at 100 columns;
- a check holding comment prose to 100 columns, which no formatter does;
- a docs guard with the same checks as `template/stacks/bun-typescript/files/tests/docs-guard.ts`;
- a version resolver that follows the app-version section of `template/core/ARCHITECTURE.md`, with
  its tests;
- a test runner, and a test idiom for building instants independent of the host's zone.

The Bun stack is the reference implementation of each. `tests/new-project.test.ts` picks up a new
stack directory automatically and checks its scaffold; then scaffold one by hand, install it, and
run its verification pass. If a new stack's own suite can run without an install, add it to the
test's list of self-testing stacks.

## Developing the archetype

Requires [Bun](https://bun.sh).

```sh
bun install
bun run lint:fix && bun run lint && bun run typecheck && bun test
```

The verification pass, and what else a change under `template/` needs, is in [AGENTS.md](AGENTS.md).
