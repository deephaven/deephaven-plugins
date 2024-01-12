#!/bin/bash -i

# This script is used to update the version of a given plugin in its source code.
# Because this differs for various plugins, this script is used to hide all that complexity
# behind a very simply API.  `update_version.sh <plugin-name> <new-version>`

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

all_plugins="$(cd "$ROOT_DIR/plugins" ; find ./ -mindepth 1 -maxdepth 1 -type d | sed  's|./||g')"

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
        --debug) ;&
        -d) set -o xtrace ;;
        --dev) dev=true ;;
        --help) ;&
        -h) usage ; exit 0 ;;
        *)
            if [ -z "$package" ]; then
                if grep -q "$1" <<< "$all_plugins"; then
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
    sed -i "s/${prefix}.*/${prefix}${version}${extra}${suffix}/g" "$ROOT_DIR/plugins/$file"
    git add "$ROOT_DIR/plugins/$file"
    git commit -m "chore(version): update $package to version $version${extra}"
}

extra=
[ "$dev" = true ] && extra=".dev0"
case "$package" in
        auth-keycloak)
            update_file auth-keycloak/src/js/package.json '"version": "' '",'
            ;;
        dashboard-object-viewer)
            update_file dashboard-object-viewer/src/js/package.json '"version": "' '",'
            ;;
        json)
            update_file json/src/deephaven/plugin/json/__init__.py '__version__ = "' '"' "$extra"
            ;;
        matplotlib)
            update_file matplotlib/setup.cfg 'version = ' '' "$extra"
            ;;
        plotly)
            update_file plotly/src/deephaven/plugin/plotly/__init__.py '__version__ = "' '"' "$extra"
            ;;
        plotly-express)
            update_file plotly-express/setup.cfg 'version = ' '' "$extra"
            ;;
        table-example)
            update_file table-example/src/js/package.json '"version": "' '",'
            ;;
        ui)
            update_file ui/src/deephaven/ui/__init__.py '__version__ = "' '"' "$extra"
            ;;
        *)
        {
            log_error "Unhandled plugin $package.  You will need to add wiring in $SCRIPT_NAME"
            exit 90
        }
esac

log_info "Done updating $package version to $version${extra}"
