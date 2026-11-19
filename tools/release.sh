#!/bin/bash

# This script is designed to automate the version bump + github release process.
# It requires for you to have installed both the [GitHub CLI tool](https://cli.github.com/) `gh` and the [cocogitto tool](https://github.com/cocogitto/cocogitto#installation) `cog`

tab=$'\t'
log_prefix="$(id -un)$tab - "

set -o errexit
set -o nounset
set -o pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SCRIPT_NAME=$(basename "${BASH_SOURCE[0]}")

# All git and gh checks must inspect the same checkout that cog releases from
cd "$ROOT_DIR"

function log_error() {
    { echo -e "\033[31m$log_prefix $(date "+%Y-%m-%d %H:%M:%S")$tab |--- [ERROR] $* \033[0m" ; } 2> /dev/null
} 2>/dev/null

function log_info() {
    { echo "$log_prefix $(date "+%Y-%m-%d %H:%M:%S")$tab |--- $*" ; } 2>/dev/null
} 2>/dev/null

if ! command -v cog >/dev/null; then
    {
    log_error "cog command not found!"
    log_error "Installation instructions are here: https://github.com/cocogitto/cocogitto?tab=readme-ov-file#installation"
    log_error "mac users can install via brew; for other OSes, you should install cargo and then use cargo to install cocogitto (cog)"
    log_error "Note that cog must be on your PATH. An alias will not work."
    } 2>/dev/null
    exit 99
fi
if ! command -v gh >/dev/null; then
    {
    log_error "gh command not found!"
    log_error "Installation instructions are here: https://github.com/cli/cli?tab=readme-ov-file#installation"
    } 2>/dev/null
    exit 98
fi

all_plugins="$(cd "$ROOT_DIR/plugins" ; find . -mindepth 1 -maxdepth 1 -type d | sed  's|./||g')"

function usage() {
    log_info "Simple utility to automate version bump + release process"
    log_info "This script accepts the following arguments:"
    log_info ""
    log_info "--help | -h $tab-> Prints this help message"
    log_info "--debug | -d $tab-> Turn on xtrace debugging"
    log_info "--remote | -r $tab-> Specify the git remote to push to and release in (default: the remote for gh's default repo)"
    log_info "<plugin name> $tab-> Runs the version bump + release for a given plugin"
    log_info "Valid <plugin name> choices are:
$all_plugins"
} 2> /dev/null

# Collect arguments
package=
remote=
while (( $# > 0 )); do
    case "$1" in
        --debug | -d)
            set -o xtrace ;;
        --help | -h)
            usage ; exit 0 ;;
        --remote | -r)
            shift
            if (( $# == 0 )); then
                log_error "--remote requires a value"
                exit 96
            fi
            remote="$1"
            ;;
        *)
            if [ -n "$package" ]; then
                {
                log_error "Illegal argument $1. Already requested release of package '$package'"
                log_error "You can only release one package at a time"
                } 2>/dev/null
                exit 94
            fi
            if grep -qxF -- "$1" <<< "$all_plugins"; then
                package="$1"
            else
                {
                log_error "Illegal argument $1. Expected one of:
$all_plugins"
                } 2>/dev/null
                exit 93
            fi
       ;;
    esac
    shift
done

# Validate arguments
if [ -z "$package" ]; then
    {
    log_error "Expected exactly one package name argument"
    log_error "Valid choices are:
$all_plugins"
    } 2>/dev/null
    exit 92
fi

if ! grep -qF "\"plugins/$package\"" "$ROOT_DIR/cog.toml"; then
    {
    log_error "Did not see plugins/$package in cog.toml"
    log_error "Make sure to list your plugins under the [plugins] section of cog.toml"
    } 2>/dev/null
    exit 91
fi

# Tags and main go to the push URL, which can differ from the fetch URL; a remote with several push URLs has no single repo
function remote_repo() {
    local urls
    urls="$(git remote get-url --push --all "$1")"
    if [ "$(wc -l <<< "$urls")" -ne 1 ]; then
        return 0
    fi
    sed -E 's#^(https://|ssh://)?([^@/]+@)?github\.com[:/]##; s#\.git$##; s#/$##' <<< "$urls" | tr '[:upper:]' '[:lower:]'
}

# Without --remote, release to gh's default repo through whichever remote points to it
if [ -z "$remote" ]; then
    if ! gh_repo="$(gh repo set-default --view 2>/dev/null | tr '[:upper:]' '[:lower:]')" || [ -z "$gh_repo" ]; then
        {
        log_error "No --remote given and gh has no default repo to release to"
        log_error "Set it with: gh repo set-default, or pass --remote"
        } 2>/dev/null
        exit 89
    fi
    for candidate in $(git remote); do
        if [ "$(remote_repo "$candidate")" = "$gh_repo" ]; then
            remote="$candidate"
            break
        fi
    done
    if [ -z "$remote" ]; then
        {
        log_error "No git remote points to '$gh_repo', the repo gh creates releases in"
        log_error "Add one with: git remote add upstream git@github.com:$gh_repo.git"
        log_error "Available remotes:"
        git remote -v
        } 2>/dev/null
        exit 89
    fi
elif ! git remote get-url "$remote" >/dev/null 2>&1; then
    {
    log_error "Git remote '$remote' does not exist"
    log_error "Available remotes:"
    git remote -v
    } 2>/dev/null
    exit 90
fi

# The GitHub release is created in the repo that $remote points to, so the tag, main, and release always land together
release_repo="$(remote_repo "$remote")"
if ! [[ "$release_repo" =~ ^[a-z0-9._-]+/[a-z0-9._-]+$ ]]; then
    {
    log_error "Could not determine the GitHub repo for remote '$remote' from its push URL: $(git remote get-url --push --all "$remote" | paste -sd ' ' -)"
    log_error "The remote must have exactly one github.com push URL"
    } 2>/dev/null
    exit 86
fi

if [ -n "$(git status --short)" ]; then
    {
        log_error "Detected uncommitted files via git status:"
        git status --short
        log_error "Releases can only be performed with a clean git status"
        log_error 'You must commit/stash your changes, or `git reset --hard` to erase them'
        exit 95
    } 2>/dev/null
fi

# cog commits and tags HEAD, but the bump hooks push `main`, so HEAD must be main and match the remote exactly
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    {
    log_error "Releases must be run from the main branch, but you are on '$(git rev-parse --abbrev-ref HEAD)'"
    log_error "Run: git checkout main"
    } 2>/dev/null
    exit 88
fi

{ log_info "Fetching $remote/main" ; } 2>/dev/null
git fetch --quiet "$remote" main
if [ "$(git rev-parse HEAD)" != "$(git rev-parse FETCH_HEAD)" ]; then
    {
    if git merge-base --is-ancestor HEAD FETCH_HEAD; then
        log_error "Local main is behind $remote/main"
        log_error "Run: git pull --ff-only $remote main"
    else
        log_error "Local main has commits that are not on $remote/main:"
        git --no-pager log --oneline FETCH_HEAD..HEAD
        log_error "Releases must be cut from $remote/main. Run: git reset --hard $remote/main"
    fi
    } 2>/dev/null
    exit 87
fi

# Perform release
{
log_info "Releasing package '$package'"
log_info "  Commit:  $(git --no-pager log -1 --format='%h %s')"
log_info "  Push to: $remote ($(git remote get-url --push "$remote"))"
log_info "  Release: https://github.com/$release_repo/releases"
} 2>/dev/null
RELEASE_REMOTE="$remote" RELEASE_REPO="$release_repo" cog bump --package "$package" --auto
