#!/bin/bash

# This script is used to update the version of a given plugin in its source code.
# Because this differs for various plugins, this script is used to hide all that complexity
# behind a very simple API.  `update_version.sh <plugin-name> <new-version>`

# You should not need to call this script directly.
# It is invoked for you when calling the release.sh script located next to this one.


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

all_plugins="$(cd "$ROOT_DIR/plugins" ; find . -mindepth 1 -maxdepth 1 -type d | sed  's|./||g')"

function usage() {
    log_info "Simple utility to update plugin file in order to change versions."
    log_info "This script accepts the following arguments:"
    log_info ""
    log_info "--help | -h $tab-> Prints this help message"
    log_info "--debug | -d $tab-> Turn on xtrace debugging"
    log_info "--dev     $tab-> Append .dev0 to python plugin versions"
    log_info "<plugin name> $tab-> The name of the plugin that we are going to set the version for"
    log_info "Valid <plugin name> choices are:
$all_plugins"
    log_info "<plugin version> $tab-> Specify the new version of the given plugin"

} 2> /dev/null

package=
version=
dev=false
while (( $# > 0 )); do
    case "$1" in
        --debug | -d)
            set -o xtrace ;;
        --dev)
            dev=true ;;
        --help | -h)
            usage ; exit 0 ;;
        *)
            if [ -z "$package" ]; then
                if grep -qE "^$1\$" <<< "$all_plugins"; then
                    package="$1"
                else
                    {
                        log_error "Illegal argument $1. Expected one of:
$all_plugins"
                    } 2>/dev/null
                    exit 93
                fi
            elif [ -z "$version" ]; then
                version="${1/v/}"
            else
                {
                    log_error "Illegal argument $1. Already saw package '$package' and version '$version'"
                    log_error "This script expects two and only two non -flag arguments, <package name> and <package version>"
                } 2>/dev/null
                exit 94
            fi
       ;;
    esac
    shift
done

if [ -z "$package" ]; then
    {
        log_error "Expected exactly two arguments <package name> <package version>"
        log_error "Valid choices for <package name> are:
$all_plugins"
    } 2>/dev/null
    exit 92
fi
if [ -z "$version" ]; then
    {
        log_error "Did not receive a second argument of a version to set $package to"
    } 2>/dev/null
    exit 91
fi

function update_file() {
    local file="$1"
    local prefix="$2"
    local suffix="$3"
    local extra="${4:-}"
    local expected="${prefix}${version}${extra}${suffix}"
    if ! grep -q "$expected" "$ROOT_DIR/plugins/$file"; then
    	# annoyingly, sed on mac is extremely old, so we have to handle it differently.
    	if [[ "$(uname)" == Darwin* ]]; then
            sed -e "s/${prefix}.*/${expected}/g" -i '' "$ROOT_DIR/plugins/$file"
        else
            sed -e "s/${prefix}.*/${expected}/g" -i "$ROOT_DIR/plugins/$file"
        fi
    fi
}

extra=
[ "$dev" = true ] && extra=".dev0"
case "$package" in
        ag-grid | json | matplotlib | pivot | plotly | plotly-express | python-remote-file-source | theme-pack | ui | utilities | packaging)
            update_file "${package}/setup.cfg" 'version = ' '' "$extra"
            ;;
        auth-keycloak | dashboard-object-viewer | table-example)
            # Packages that don't have any Python to publish, just ignore
            ;;
        *)
        {
            log_error "Unhandled plugin $package.  You will need to add wiring in $SCRIPT_NAME"
            exit 90
        }
esac

# We still need to bump these JS packages for Enterprise legacy reasons, even though they're packaged with Python
npm_version="${version}"
if [ "$dev" != true ]; then
    case "$package" in
        ag-grid | auth-keycloak | dashboard-object-viewer | matplotlib | pivot | plotly | plotly-express | python-remote-file-source | table-example |  theme-pack  | ui)
            # The working directory is already `plugins/<package-name>`, so we just specify workspace as `src/js` and it does the right thing
            npm version "$npm_version" --workspace=src/js
            ;;
        json | packaging | utilities)
            # Packages that don't have any JS to publish, just ignore
            ;;
        *)
        {
            log_error "Unhandled JS plugin $package.  You will need to add JS wiring in $SCRIPT_NAME"
            exit 90
        }
    esac
fi

log_info "Done updating $package version to $version${extra}"
