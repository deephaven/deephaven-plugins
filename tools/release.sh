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

all_plugins="$(cd "$ROOT_DIR/plugins" ; find . -mindepth 1 -maxdepth 1 -type d | sed  's|./||g')"

function usage() {
    log_info "Simple utility to automate version bump + release process"
    log_info "This script accepts the following arguments:"
    log_info ""
    log_info "--help | -h $tab-> Prints this help message"
    log_info "--debug | -d $tab-> Turn on xtrace debugging"
    log_info "--remote | -r $tab-> Specify the git remote to push to (default: origin)"
    log_info "<plugin name> $tab-> Runs the version bump + release for a given plugin"
    log_info "Valid <plugin name> choices are:
$all_plugins"
} 2> /dev/null

if [ -n "$(git status --short)" ]; then
    {
        log_error "Detected uncommitted files via git status:"
        git status --short
        log_error "Releases can only be performed with a clean git status"
        log_error 'You must commit/stash your changes, or `git reset --hard` to erase them'
        exit 95
    } 2>/dev/null
fi

# Collect arguments
package=
remote="origin"
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
            if grep -qE "^$1\$" <<< "$all_plugins"; then
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

if ! grep -q "plugins/$package" "$ROOT_DIR/cog.toml"; then
    {
    log_error "Did not see plugins/$package in cog.toml"
    log_error "Make sure to list your plugins under the [plugins] section of cog.toml"
    } 2>/dev/null
    exit 91
fi

# Validate remote exists
if ! git remote get-url "$remote" >/dev/null 2>&1; then
    {
    log_error "Git remote '$remote' does not exist"
    log_error "Available remotes:"
    git remote -v
    } 2>/dev/null
    exit 90
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

# Perform release
{ log_info "Releasing package '$package' using remote '$remote'" ; } 2>/dev/null
(
cd "$ROOT_DIR"
RELEASE_REMOTE="$remote" cog bump --package "$package" --auto
)
