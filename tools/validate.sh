#!/bin/bash -i

# This script is called as a cog pre-bump hook to validate that your runtime environment
# has the necessary programs installed, and github auth status to successful perform a release.

tab=$'\t'
log_prefix="$(id -un)$tab - "

set -o errexit
set -o nounset
set -o pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SCRIPT_NAME=$(basename "${BASH_SOURCE[0]}")

function log_error() {
    { echo -e "\033[31m$log_prefix $(date "+%Y-%m-%d %H:%M:%S")$tab |--- [ERROR] $* \033[0m" ; } 2> /dev/null
} 2>/dev/null

function log_info() {
    { echo "$log_prefix $(date "+%Y-%m-%d %H:%M:%S")$tab |--- $*" ; } 2>/dev/null
} 2>/dev/null

if ! which cog >/dev/null; then
    {
    log_error "cog command not found!"
    log_error "Installation instructions are here: https://github.com/cocogitto/cocogitto?tab=readme-ov-file#installation"
    log_error "mac users can install via brew; for other OSes, you should install cargo and then use cargo to install cocogitto (cog)"
    log_error "Note that cog must be on your PATH. An alias will not work."
    } 2>/dev/null
    exit 99
fi
if ! which gh >/dev/null; then
    {
    log_error "gh command not found!"
    log_error "Installation instructions are here: https://github.com/cli/cli?tab=readme-ov-file#installation"
    exit 98
    } 2>/dev/null
fi
if ! gh auth status; then
    {
    log_error "You must be logged into gh to continue!"
    log_error 'Run `gh auth login`'
    exit 97
    } 2>/dev/null
fi

# we need to run a gh command to ensure you've set the gh repo already.
# we also can't pipe the output of this command to /dev/null, or else gh will always exit with code 0
# so, we'll prepare the user for some noise.
echo
log_info "Listing previous release to ensure gh is setup correctly:"
if ! gh release list --limit 1 2>/dev/stdout; then
    {
    log_error "You must select the correct gh repo to continue!"
    log_error 'Run `gh repo set-default git@github.com:deephaven/deephaven-plugins.git`'
    exit 96
    } 2>/dev/null
fi
echo

if [ -n "$(git status --short)" ]; then
    {
        log_error "Detected uncommitted files via git status:"
        git status --short
        log_error "Releases can only be performed with a clean git status"
        log_error 'You must commit/stash your changes, or `git reset --hard` to erase them'
        exit 95
    } 2>/dev/null
fi

