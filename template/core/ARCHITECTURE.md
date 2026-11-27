# Architecture

How {{PROJECT_NAME}} works, and why it is shaped this way. [README.md](README.md) covers installing,
running, and using it; [ADR.md](ADR.md) keeps the decisions that had a real alternative, and the
ideas still open.

## Reading this document

This file is written in the present tense and describes the system as it stands. There is no
archaeology here: when a decision is worth remembering after it has settled, it lives in
[ADR.md](ADR.md) and this file simply describes the result.

Code points here rather than restating any of it. A comment in the source carries what must hold at
that line — units, bounds, invariants, the reason a guard exists — and cites a section by anchor
when the reader needs the shape of the thing:

```
// Patch counts commits since the release line moved. See ARCHITECTURE.md#app-version.
```

Two reference forms are used, and the docs guard fails the suite if either stops resolving:

| Form                       | Means                        |
| -------------------------- | ---------------------------- |
| `ARCHITECTURE.md#<anchor>` | a section of this file       |
| `ADR-NNN`                  | an entry in [ADR.md](ADR.md) |

Headings here stay short, plain, and ASCII so their anchors are predictable and survive an edit to
the prose beneath them. Renaming one means fixing its citations in the same change.

## System shape

> PROJECT-SPECIFIC: The processes that make up the system, what each one does, how data moves
> between them, and what the system deliberately does not do.

### Trust boundary

> PROJECT-SPECIFIC: Who can reach the system, what it trusts them with, and what holds the line —
> authentication, network placement, read-only credentials, input validation.

## Domain model

> PROJECT-SPECIFIC: The nouns of the problem and the rules that bind them, one subsection each. A
> rule a maintainer could not recover from the types and the test names belongs here.

## Configuration

### Configuration layers

> PROJECT-SPECIFIC: Name this project's homes for the three kinds of value below, and table them in
> README's configuration section.

Configuration is split by who owns a value and how often it changes, and **nothing is ever
configured in two places at once**, so there is never a question of which copy is in force:

- **Operational configuration** — hosts, credentials, ports, timeouts — comes from the environment
  and is validated once at startup. It belongs to whoever deploys the system.
- **Domain defaults** — the values a fresh instance starts from — live in one committed file. That
  file is validated by the same schema as saved state, so it doubles as the format reference.
- **Runtime state** — what users change while the system runs — lives in one store outside the
  repository, seeded from the defaults on first run.

### App version

A build is named `major.minor.patch`. The release line — `major.minor` — is set by hand in the
`VERSION` file at the repository root, and the patch counts the commits since that file last
changed. So `2.1.37` is the thirty-seventh commit of the `2.1` line, and editing `VERSION` to `2.2`
restarts the count at `2.2.0`. Nothing is written back into the tree to make this work, which is the
point: a version kept in a committed counter would be the same integer on two long-lived branches,
and would conflict on nearly every merge between them.

Merge commits are not counted. A merge moves work between branches rather than changing it, so
leaving them out is what makes a pre-release build and its release the same number for the same
code, and what keeps the number from depending on whether a branch was merged or fast-forwarded.

`VERSION` therefore holds the release line and nothing else — that is what lets "this file changed"
mean "the release line moved". No package manifest carries a second copy of the number, which would
go stale on the first commit.

A build that carries no git history — a container image, an unpacked archive — cannot count, so it
takes the version it was stamped with at build time (`APP_VERSION`), resolved once by the same
resolver. A pre-release branch's build appends `-beta`; an unstamped build without history reports
patch `0`.

<!-- archetype:begin version-resolver -->

> PROJECT-SPECIFIC: Where the resolver lives, how the running system reads it, and how CI or the
> build calls it to stamp `APP_VERSION`.

<!-- archetype:end version-resolver -->

## Module map

> PROJECT-SPECIFIC: One line per module: its path and what it owns. A new module earns its line in
> the same diff that adds it.

## Testing strategy

The test suite runs everything without a browser, a network, or a live database. Two properties make
that possible.

**Every boundary is injectable.** Anything that reaches outside the process — a query runner, a
clock, a file path, a network client — is passed in rather than imported, so a test drives real code
with fake edges instead of mocking the module under test.

**Decisions are pure functions.** Code that eventually touches a screen, a socket, or a disk exports
the arithmetic separately from the effect, taking values and returning values, so a test can assert
what will happen without making it happen.

Tests must be deterministic: independent of host timezone, wall clock, and run order. Build instants
from local calendar fields so a schedule reads the same in any timezone; a test that must read the
clock asserts only the shape of what it reads.

Test names carry behavior narrative. They are executable documentation, and a well-named test often
replaces the comment that would have explained the same rule.

The docs guard runs with the suite: every `ARCHITECTURE.md#<anchor>` and `ADR-NNN` reference in the
tree must resolve, anchors must be unique, ADR numbers must be unique and gapless, every status must
come from the closed vocabulary, and no comment line may run past 100 columns where it could have
wrapped. Documentation that code points at cannot rot silently.

<!-- archetype:begin testing -->

> PROJECT-SPECIFIC: The test runner, where the docs guard lives, and the idiom tests use to build
> timezone-independent instants.

<!-- archetype:end testing -->
