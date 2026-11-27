#!/usr/bin/env bash
# Scaffolds a new project from template/core and, optionally, one stack. See README.md.
# Bash 3.2 and POSIX tools only, so it runs on a stock macOS as well as Linux. Never runs git.

set -euo pipefail

archetype="$(cd "$(dirname "$0")/.." && pwd)"
template="$archetype/template"

usage() {
  cat <<EOF
Usage: $(basename "$0") [--stack <name>] "<Project Name>" <target-dir>
       $(basename "$0") --list-stacks

Copies the core documents into <target-dir>, overlays the stack's files when --stack is given,
fills the stack's sections of the documents, and names the project throughout. The target may
already exist (holding .git or a LICENSE, say); nothing in it is ever overwritten.
EOF
}

die() {
  echo "new-project: $*" >&2
  exit 1
}

list_stacks() {
  for dir in "$template"/stacks/*/; do
    [ -d "$dir/files" ] && basename "$dir"
  done
  return 0
}

stack=""
positional=()
while [ $# -gt 0 ]; do
  case "$1" in
    --stack)
      [ $# -ge 2 ] || die "--stack needs a name"
      stack="$2"
      shift 2
      ;;
    --stack=*)
      stack="${1#--stack=}"
      shift
      ;;
    --list-stacks)
      list_stacks
      exit 0
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    -*)
      usage >&2
      die "unknown option: $1"
      ;;
    *)
      positional+=("$1")
      shift
      ;;
  esac
done

if [ "${#positional[@]}" -ne 2 ]; then
  usage >&2
  exit 2
fi
name="${positional[0]}"
target="${positional[1]}"

slug="$(printf '%s' "$name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
[ -n "$slug" ] || die "\"$name\" has no letters or digits to derive a slug from"

stack_dir=""
fragments=""
if [ -n "$stack" ]; then
  stack_dir="$template/stacks/$stack"
  if [ ! -d "$stack_dir/files" ]; then
    echo "new-project: no stack named \"$stack\". Available:" >&2
    list_stacks >&2
    exit 1
  fi
  [ -d "$stack_dir/fragments" ] && fragments="$stack_dir/fragments"
fi

[ ! -e "$target" ] || [ -d "$target" ] || die "$target exists and is not a directory"

# Relative paths of every file a source tree contributes, one per line.
files_of() {
  (cd "$1" && find . -type f ! -name .DS_Store | sed 's|^\./||' | sort)
}

core_files="$(files_of "$template/core")"
stack_files=""
[ -n "$stack_dir" ] && stack_files="$(files_of "$stack_dir/files")"
all_files="$(printf '%s\n%s\n' "$core_files" "$stack_files" | sed '/^$/d' | sort -u)"

collisions=""
while IFS= read -r file; do
  [ -e "$target/$file" ] && collisions="$collisions  $file"$'\n'
done <<<"$all_files"
if [ -n "$collisions" ]; then
  echo "new-project: refusing to overwrite what $target already holds:" >&2
  printf '%s' "$collisions" >&2
  exit 1
fi

copy_tree() {
  local from="$1" list="$2" file
  while IFS= read -r file; do
    [ -n "$file" ] || continue
    mkdir -p "$target/$(dirname "$file")"
    cp "$from/$file" "$target/$file"
  done <<<"$list"
}

mkdir -p "$target"
copy_tree "$template/core" "$core_files"
[ -n "$stack_dir" ] && copy_tree "$stack_dir/files" "$stack_files"

# Rewrites a file in place through a filter, keeping its mode.
rewrite() {
  local file="$1" tmp
  shift
  tmp="$(mktemp)"
  "$@" <"$file" >"$tmp"
  cat "$tmp" >"$file"
  rm -f "$tmp"
}

# Each marked section takes the stack's fragment of the same name, or keeps its placeholder when
# there is none. Either way the markers and the blank line after each are dropped, so the section
# sits between single blank lines like the paragraphs around it. Blank lines are held until the
# next text line, so a passage at the end of a file leaves no trailing blank.
splice() {
  FRAGMENTS="$fragments" awk '
    function emit(text) {
      if (text == "") { blanks++; return }
      for (; blanks > 0; blanks--) print ""
      print text
    }
    /^<!-- archetype:begin [a-z-]+ -->$/ {
      inside = 1; replaced = 0; skipblank = 1
      if (ENVIRON["FRAGMENTS"] != "") {
        path = ENVIRON["FRAGMENTS"] "/" $3 ".md"
        while ((getline line < path) > 0) { emit(line); replaced = 1 }
        close(path)
        if (replaced) emit("")
      }
      next
    }
    /^<!-- archetype:end [a-z-]+ -->$/ { inside = 0; replaced = 0; skipblank = 1; next }
    skipblank && $0 == "" { skipblank = 0; next }
    { skipblank = 0 }
    inside && replaced { next }
    { emit($0) }
  '
}

# Literal replacement (index, not a regex), so a name holding & or / lands verbatim.
substitute() {
  NAME="$name" SLUG="$slug" awk '
    function replace(s, token, value,   out, i) {
      out = ""
      while ((i = index(s, token)) > 0) {
        out = out substr(s, 1, i - 1) value
        s = substr(s, i + length(token))
      }
      return out s
    }
    {
      line = replace($0, "{{PROJECT_NAME}}", ENVIRON["NAME"])
      print replace(line, "{{PROJECT_SLUG}}", ENVIRON["SLUG"])
    }
  '
}

while IFS= read -r file; do
  case "$file" in
    *.md) rewrite "$target/$file" splice ;;
  esac
done <<<"$all_files"

[ -n "$stack_dir" ] && [ -f "$stack_dir/gitignore" ] && cat "$stack_dir/gitignore" >>"$target/.gitignore"

while IFS= read -r file; do
  if grep -q '{{PROJECT_' "$target/$file"; then rewrite "$target/$file" substitute; fi
done <<<"$all_files"

cat <<EOF
Created "$name" ($slug) in $target${stack:+ with the $stack stack}.

Next steps:
  1. cd $target
  2. Fill in every section still marked PROJECT-SPECIFIC:
       grep -rn PROJECT-SPECIFIC --exclude-dir=node_modules .
  3. Initialize git if the directory is not already a repository.
  4. Install the stack's dependencies, if any, and run the verification pass in AGENTS.md.
  5. Make the first commit.
EOF
