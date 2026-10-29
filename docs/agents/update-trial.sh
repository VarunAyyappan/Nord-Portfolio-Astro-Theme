#!/usr/bin/env bash
# Checks the README's "Updating from the Theme" steps end to end: scaffolds
# an old release, makes it an Adopter's own, runs the update commands taken
# verbatim from the new release's README, resolves the conflicts an Adopter
# always gets, and checks the result. Run it before a release, from the
# repo root:
#
#   docs/agents/update-trial.sh v1.0.0 release-2.1
#
# The new ref is a tag, or a branch that stands in for the release's tag,
# fetched from GitHub; set THEME_SOURCE to a local clone to try a ref that
# isn't pushed, such as a commit. Needs network access. Prints each step, and on failure names
# it and keeps the work folder for a look.
set -euo pipefail

old=${1:?usage: update-trial.sh <old-tag> <new-ref>}
new=${2:?usage: update-trial.sh <old-tag> <new-ref>}
repo=VarunAyyappan/Nord-Portfolio-Astro-Theme
work=$(mktemp -d "${TMPDIR:-/tmp}/update-trial.XXXXXX")
site=$work/my-portfolio
step=start
trap 'echo "FAILED at: $step (work folder kept: $work)" >&2' ERR

say() { step=$1; echo "== $1"; }
fail() { echo "FAILED at: $step: $1 (work folder kept: $work)" >&2; trap - ERR; exit 1; }

say "scaffold $old"
(cd "$work" && aube create astro@latest my-portfolio --template "$repo#$old" \
  --no-install --no-git --skip-houston --yes >/dev/null)
cd "$site"
aube install >/dev/null
git init -q -b main && git add -A && git commit -q -m "Scaffold from the Theme's $old"

# The Adopter changes values, replaces whole content files and adds one rule
# to the end of global.css: edits that a release rarely touches, so the
# trial tests the update steps rather than this script's own guesses.
say "make it an Adopter's site"
node --input-type=module -e '
  import { readFileSync, writeFileSync } from "node:fs";
  const file = "src/site.config.ts";
  const [types, values] = readFileSync(file, "utf8").split("export const siteConfig");
  const set = (text, key, value) => {
    const next = text.replace(new RegExp(`(\\n  ${key}: )"[^"]*"`), `$1"${value}"`);
    if (next === text) throw new Error(`Site config has no ${key}`);
    return next;
  };
  let v = values;
  v = set(v, "name", "Grace Hopper");
  v = set(v, "url", "https://grace.example.com");
  v = set(v, "base", "/");
  writeFileSync(file, `${types}export const siteConfig${v}`);
'
rm -rf src/content/posts/* src/content/projects/* src/content/experience/* src/content/education/*
printf -- '---\ntitle: Hello, World\ndescription: Why I am starting a blog.\ndate: 2026-01-10\ntags: [Meta]\n---\n\nMy first Post.\n' \
  > src/content/posts/hello-world.md
printf -- '---\ntitle: A-0 Compiler\nsummary: The first compiler for an electronic computer.\ndate: 2026-01-05\nstack: [Assembly]\nfeatured: true\n---\n\nWrite-up.\n' \
  > src/content/projects/a0-compiler.md
printf 'role: Rear Admiral\norganization: US Navy\nstart: 2020-01\nhighlights:\n  - Standardized programming languages.\n' \
  > src/content/experience/navy.yaml
printf 'qualification: PhD Mathematics\ninstitution: Yale University\nstart: 2010-09\nend: 2014-06\n' \
  > src/content/education/yale.yaml
printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">\n  <title>Grace Hopper</title>\n  <path d="M8 6v20M24 6v20M8 16h16" stroke="#ebcb8b" stroke-width="4" fill="none" />\n</svg>\n' \
  > public/favicon.svg
printf '# Grace Hopper\n\nMy portfolio.\n' > README.md
rm -rf AGENTS.md CLAUDE.md CONTEXT.md GLOSSARY.md docs test
mkdir -p src/pages && printf -- '---\n---\n\n<p>What I use.</p>\n' > src/pages/uses.astro
custom='.adopter-tweak { color: inherit; }'
printf '\n/* My own tweak. */\n%s\n' "$custom" >> src/styles/global.css
aube add dayjs >/dev/null
git add -A && git commit -q -m "Make the portfolio my own"
git tag "$old"
own_tag=$(git rev-parse "$old^{commit}")
filler_before=$(git show HEAD~1 --name-only --format= -- src/content/posts | grep '\.md$' | xargs -n1 basename | sed 's/\.md$//')

say "read the update steps from the README at $new"
git remote add --no-tags trial-source "${THEME_SOURCE:-https://github.com/$repo.git}"
git fetch -q trial-source "refs/tags/$new:refs/trial/new" 2>/dev/null \
  || git fetch -q trial-source "refs/heads/$new:refs/trial/new" 2>/dev/null \
  || git fetch -q trial-source "$( [ -d "${THEME_SOURCE:-}" ] && git -C "$THEME_SOURCE" rev-parse -q --verify "$new^{commit}" || echo "$new"):refs/trial/new" 2>/dev/null \
  || fail "no tag, branch or commit $new at ${THEME_SOURCE:-GitHub}"
git remote remove trial-source
readme=$(git show refs/trial/new:README.md)
section=$(printf '%s\n' "$readme" | awk '/^## Updating from the Theme/,/^## Commands/')
[ -n "$section" ] || fail 'README has no "Updating from the Theme" section'
from=$(printf '%s\n' "$section" | grep -oE 'update from v[0-9.]+ to v[0-9.]+' | head -1 | awk '{print $3}')
to=$(printf '%s\n' "$section" | grep -oE 'update from v[0-9.]+ to v[0-9.]+' | head -1 | awk '{print $5}')
[ -n "$from" ] && [ -n "$to" ] || fail 'README no longer says "update from vX to vY"'
blocks=$work/steps
mkdir -p "$blocks"
printf '%s\n' "$section" | awk -v dir="$blocks" '
  /^   ```sh/ { inside = 1; n++; next }
  /^   ```/ { inside = 0; next }
  inside { sub(/^   /, ""); print > (dir "/" n ".sh") }'
# The README's examples are its own versions, so swap in this trial's.
# Placeholders first, so a trial from the README's own "to" version works.
sed -i -e "s#theme/$to#@NEW@#g" -e "s#theme-$to#@BRANCH@#g" -e "s#theme/$from#@OLD@#g" "$blocks"/*.sh
sed -i -e "s#@NEW@#theme/trial-new#g" -e "s#@BRANCH@#theme-trial#g" -e "s#@OLD@#theme/$old#g" "$blocks"/*.sh
[ -f "$blocks/1.sh" ] && [ -f "$blocks/2.sh" ] && [ -f "$blocks/3.sh" ] || fail "README no longer has three command blocks"

say "step 1: fetch the Theme's releases"
bash "$blocks/1.sh" >/dev/null 2>&1
git tag theme/trial-new refs/trial/new
[ "$(git rev-parse "$old^{commit}")" = "$own_tag" ] || fail "the Theme's tags moved the Adopter's own $old"
git rev-parse -q --verify "refs/tags/theme/$old" >/dev/null || fail "theme/$old wasn't fetched"

say "step 2: apply the changes"
# git apply exits non-zero on conflicts too, so judge it by what it printed:
# a missing file refuses the whole patch, even after it reports conflicts.
bash "$blocks/2.sh" >"$work/apply.log" 2>&1 || true
if grep -q "does not exist in index" "$work/apply.log"; then
  [ -z "$(git status --porcelain)" ] || fail "a refused apply left changes behind"
  # The README's recovery: leave out what the Adopter deleted, rerun the diff.
  sed -e '/^git switch -c/d' -e "s#':!docs'#':!docs' ':!test'#" "$blocks/2.sh" > "$blocks/2b.sh"
  bash "$blocks/2b.sh" >"$work/apply.log" 2>&1 || true
fi
if grep -q '^error:' "$work/apply.log" || [ -z "$(git status --porcelain)" ]; then
  cat "$work/apply.log"; fail "git apply didn't apply the release"
fi

say "step 3: resolve the conflicts"
conflicts=$(git diff --name-only --diff-filter=U)
echo "conflicts: ${conflicts:-none}"
for file in $conflicts; do
  case $file in
    package.json)
      git show :2:package.json > "$work/ours.json"
      git checkout --theirs -- package.json
      node --input-type=module -e '
        import { readFileSync, writeFileSync } from "node:fs";
        const ours = JSON.parse(readFileSync(process.argv[1], "utf8"));
        const pkg = JSON.parse(readFileSync("package.json", "utf8"));
        pkg.name = ours.name;
        pkg.dependencies = { ...pkg.dependencies, dayjs: ours.dependencies.dayjs };
        writeFileSync("package.json", `${JSON.stringify(pkg, null, 2)}\n`);
      ' "$work/ours.json" ;;
    src/styles/global.css)
      git checkout --theirs -- "$file"
      printf '\n/* My own tweak. */\n%s\n' "$custom" >> "$file" ;;
    *) fail "unexpected conflict in $file: the README should warn Adopters about it" ;;
  esac
  git add "$file"
done

say "step 4: update the lockfile"
bash "$blocks/3.sh" >/dev/null 2>&1

say "step 5: check, lint and build"
aube run check >"$work/check.log" 2>&1 || { tail -20 "$work/check.log"; fail "type check"; }
aube run lint >"$work/lint.log" 2>&1 || { tail -20 "$work/lint.log"; fail "lint"; }
aube run build >"$work/build.log" 2>&1 || { tail -20 "$work/build.log"; fail "build"; }

say "check the result"
release_version=$(git show theme/trial-new:package.json | node -p 'JSON.parse(require("fs").readFileSync(0, "utf8")).version')
[ "$(node -p 'require("./package.json").version')" = "$release_version" ] || fail "package.json isn't at $release_version"
[ "$(node -p 'require("./package.json").name')" = my-portfolio ] || fail "package.json lost the Adopter's name"
node -p 'require("./package.json").dependencies.dayjs' | grep -q . || fail "the Adopter's dependency was dropped"
grep -qF "$custom" src/styles/global.css || fail "the Adopter's CSS was lost"
[ "$(head -1 README.md)" = "# Grace Hopper" ] || fail "the Theme's README came back"
[ ! -e test ] && [ ! -e AGENTS.md ] || fail "deleted Theme files came back"
grep -q 'Grace Hopper' dist/index.html || fail "the Adopter's Site config values were lost"
[ -e dist/blog/hello-world/index.html ] && [ -e dist/projects/a0-compiler/index.html ] || fail "the Adopter's content is missing"
for id in $filler_before; do [ ! -e "dist/blog/$id" ] || fail "filler Post $id came back"; done
# Every Theme file the release changed must now match the release, except
# the ones the Adopter owns or resolved by hand.
changed=$(git diff --name-only "theme/$old" theme/trial-new -- . \
  ':!src/content' ':!public' ':!aube-lock.yaml' ':!pnpm-lock.yaml' ':!README.md' \
  ':!AGENTS.md' ':!CLAUDE.md' ':!CONTEXT.md' ':!GLOSSARY.md' ':!docs' ':!test' \
  ':!package.json' ':!src/styles/global.css' ':!src/site.config.ts')
for file in $changed; do
  if git cat-file -e "theme/trial-new:$file" 2>/dev/null; then
    git diff --quiet theme/trial-new -- "$file" || fail "$file doesn't match the release"
  else
    [ ! -e "$file" ] || fail "$file was removed by the release but is still here"
  fi
done
grep -qF 'name: "Grace Hopper"' src/site.config.ts || fail "src/site.config.ts lost the Adopter's values"

trap - ERR
echo "PASSED: $old → $new as an Adopter, conflicts: ${conflicts:-none}. Work folder: $work"
