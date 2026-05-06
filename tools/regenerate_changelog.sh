#!/usr/bin/env bash
# Regenerate plugins/<package>/CHANGELOG.md from scratch by replaying every
# released tag through `cog bump --package` in an isolated clone, then copying
# the resulting CHANGELOG.md back into the source tree.
#
# All side effects (auto-commits, auto-tags, hooks) are confined to the clone,
# which is deleted at the end. Pre/post bump hooks (confirm.sh, validate.sh,
# update_version.sh, gh release, push, etc.) are stripped from the cloned
# cog.toml before any bump runs.
#
# Usage from repo root:
#   ./tools/regenerate_changelog.sh plotly-express
#   ./tools/regenerate_changelog.sh ui

set -euo pipefail

if [ $# -ne 1 ]; then
    echo "Usage: $0 <package>" >&2
    exit 1
fi

package="$1"
src_repo="$(pwd)"
src_changelog="${src_repo}/plugins/${package}/CHANGELOG.md"

if [ ! -f "$src_changelog" ]; then
    echo "No CHANGELOG.md at $src_changelog (run from repo root)" >&2
    exit 1
fi

# Capture original tag SHAs from the source repo *before* we clone, so we have
# an authoritative oldest->newest list independent of anything we mutate later.
mapfile -t tags < <(git tag --list "${package}-v*" --sort=v:refname)
if [ ${#tags[@]} -eq 0 ]; then
    echo "No tags found matching ${package}-v*" >&2
    exit 1
fi
declare -A tag_sha
for t in "${tags[@]}"; do
    tag_sha[$t]=$(git rev-list -n 1 "$t")
done
echo "Found ${#tags[@]} tags for ${package} (oldest: ${tags[0]}, newest: ${tags[-1]})"

clone="$(mktemp -d -t cog-regen-${package}-XXXX)"
trap 'rm -rf "$clone"' EXIT

git clone --no-hardlinks --quiet "$src_repo" "$clone"
# Pull in any uncommitted edits to cog.toml or the template from the working
# tree of the source repo so local-but-not-committed changes propagate.
cp "${src_repo}/deephaven-changelog-template" "${clone}/deephaven-changelog-template"
cp "${src_repo}/cog.toml" "${clone}/cog.toml"
cd "$clone"
git config user.email regen@local
git config user.name regen
# cog requires the active branch to be in branch_whitelist (main / release/*).
git branch -m main 2>/dev/null || true

# Strip destructive hooks and ensure package_template is set.
python3 - <<'PY'
import re
with open('cog.toml') as f: t = f.read()
t = re.sub(r'pre_package_bump_hooks = \[[^\]]*\]', 'pre_package_bump_hooks = []', t, flags=re.DOTALL)
t = re.sub(r'post_package_bump_hooks = \[[^\]]*\]', 'post_package_bump_hooks = []', t, flags=re.DOTALL)
if 'package_template' not in t:
    t = t.replace('template = "deephaven-changelog-template"',
                  'template = "deephaven-changelog-template"\npackage_template = "deephaven-changelog-template"')
with open('cog.toml', 'w') as f: f.write(t)
PY
git add cog.toml deephaven-changelog-template
git commit --quiet -m "tmp: regen config" || true

# We'll iterate oldest -> newest. For each tag, reset the working tree to the
# parent of the original tag commit (so cog sees the package's actual commits
# in range and our patched cog.toml/template are present), restore the
# accumulator into CHANGELOG.md, then run `cog bump --package`.
header='# Changelog

All notable changes to this project will be documented in this file. See [conventional commits](https://www.conventionalcommits.org/) for commit guidelines.

- - -
'
# Snapshot files live outside the clone so `git add -A` / `git reset --hard`
# in the loop doesn't sweep them up.
snap_dir="$(mktemp -d -t cog-regen-snap-XXXX)"
trap 'rm -rf "$clone" "$snap_dir"' EXIT
accumulator_file="${snap_dir}/changelog"
cog_toml_snapshot="${snap_dir}/cog.toml"
template_snapshot="${snap_dir}/template"
printf '%s' "$header" > "$accumulator_file"
cp cog.toml "$cog_toml_snapshot"
cp deephaven-changelog-template "$template_snapshot"

# Wipe ALL package tags up front. Cog's "what's the previous version" lookup
# is by semver, not graph ancestry, so any leftover higher-version tag causes
# `cog bump --version <v>` to error with "version must be greater than current".
for t in "${tags[@]}"; do
    git tag -d "$t" >/dev/null 2>&1 || true
done

prev_tag=""
for tag in "${tags[@]}"; do
    sha="${tag_sha[$tag]}"
    version="${tag#${package}-v}"
    echo "==> Replaying ${tag} (commit ${sha:0:7})"

    git reset --quiet --hard "$sha"

    # Force the previous tag (if any) to sit on its ORIGINAL commit (an
    # ancestor of the current HEAD) so cog locates it via revwalk and scopes
    # the commit range to v_{N-1}..v_N. Cog also uses semver to validate
    # `--version <v>` against existing tags, so the only package tag we leave
    # in place is the immediately-previous one.
    if [ -n "$prev_tag" ]; then
        git tag -d "$prev_tag" >/dev/null 2>&1 || true
        git tag "$prev_tag" "${tag_sha[$prev_tag]}"
    fi

    cp "$cog_toml_snapshot" cog.toml
    cp "$template_snapshot" deephaven-changelog-template
    cp "$accumulator_file" "plugins/${package}/CHANGELOG.md"
    git add -A

    # Cog reads the rendered `date` from HEAD's commit time (HEAD is the prep
    # commit at this point, since cog hasn't created the bump commit yet).
    # libgit2 (cog) ignores GIT_*_DATE env vars, but git CLI honors them — so
    # we stamp the prep commit's date to match the original tag's commit date.
    tag_date=$(git -C "$src_repo" log -1 --format=%cI "$sha")
    GIT_AUTHOR_DATE="$tag_date" GIT_COMMITTER_DATE="$tag_date" \
        git commit -m "tmp: prep ${tag}" || true

    if ! cog bump --package "$package" --version "$version" 2>&1 | tail -3; then
        echo "cog bump failed for ${tag}" >&2
        exit 1
    fi

    # Cog stamps the rendered version header with `Utc::now()` (see
    # release.rs:54-59 — `from_timestamp` returns None in this code path and
    # falls through to `now`). Patch the just-prepended `## <tag> - <date>`
    # line to use the original tag's date instead.
    tag_day="${tag_date:0:10}"
    sed -i "0,/^## ${tag} - /s/^## ${tag} - .*/## ${tag} - ${tag_day}/" \
        "plugins/${package}/CHANGELOG.md"

    cp "plugins/${package}/CHANGELOG.md" "$accumulator_file"
    prev_tag="$tag"
done

# Each iteration's `cog bump` leaves the previous section's leading newline in
# the file, which compounds with cog's own step-1 \n insert for the next
# iteration — yielding an extra blank line between `---` and the next `##`.
# Per-bump output (the going-forward case) is correct; this collapses the
# regen-only chaining artifact.
python3 -c "
import re
with open('$accumulator_file') as f: t = f.read()
t = re.sub(r'\n{3,}', '\n\n', t)
with open('$accumulator_file', 'w') as f: f.write(t)
"

cp "$accumulator_file" "$src_changelog"
echo "Wrote $src_changelog"
