#!/bin/bash

# This script checks which plugins have changes since their last tagged release.
# It is useful for determining which plugins need to be released.

set -o errexit
set -o nounset
set -o pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Get all plugins from the plugins directory (exclude hidden dirs like .tox)
all_plugins="$(cd "$ROOT_DIR/plugins" ; find . -mindepth 1 -maxdepth 1 -type d -not -name '.*' | sed 's|./||g' | sort)"

verbose=false
show_commits=false

function usage() {
    echo "Check which plugins have changes since their last tagged release."
    echo ""
    echo "Usage: $0 [options] [plugin...]"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help message"
    echo "  -v, --verbose   Show detailed information about changes"
    echo "  -c, --commits   Show commit messages for changed plugins"
    echo ""
    echo "If no plugins are specified, all plugins will be checked."
}

# Parse arguments
plugins_to_check=()
while (( $# > 0 )); do
    case "$1" in
        --help | -h)
            usage
            exit 0
            ;;
        --verbose | -v)
            verbose=true
            ;;
        --commits | -c)
            show_commits=true
            ;;
        *)
            if grep -qE "^$1\$" <<< "$all_plugins"; then
                plugins_to_check+=("$1")
            else
                echo -e "${RED}Unknown plugin: $1${NC}"
                echo "Valid plugins are:"
                echo "$all_plugins"
                exit 1
            fi
            ;;
    esac
    shift
done

# If no plugins specified, check all
if [ ${#plugins_to_check[@]} -eq 0 ]; then
    mapfile -t plugins_to_check <<< "$all_plugins"
fi

cd "$ROOT_DIR"

changed_plugins=()
unchanged_plugins=()
untagged_plugins=()

for plugin in "${plugins_to_check[@]}"; do
    # Skip empty lines
    [ -z "$plugin" ] && continue
    
    plugin_path="plugins/$plugin"
    
    # Check if plugin directory exists
    if [ ! -d "$plugin_path" ]; then
        if $verbose; then
            echo -e "${YELLOW}Skipping $plugin: directory not found${NC}"
        fi
        continue
    fi
    
    # Find the latest tag for this plugin
    latest_tag=$(git tag --list "${plugin}-v*" --sort=-v:refname | head -1)
    
    if [ -z "$latest_tag" ]; then
        untagged_plugins+=("$plugin")
        if $verbose; then
            echo -e "${YELLOW}$plugin: No tags found${NC}"
        fi
        continue
    fi
    
    # Count commits to the plugin directory since the last tag
    # Exclude version bump commits (chore(version): update ... version to *.dev0)
    commit_count=$(git log --oneline "${latest_tag}..HEAD" -- "$plugin_path" | grep -cvE "^[a-f0-9]+ chore\(version\): update .* version to .*\.dev0$" || true)
    
    if [ "$commit_count" -gt 0 ]; then
        changed_plugins+=("$plugin")
        if $verbose; then
            echo -e "${GREEN}$plugin: $commit_count commit(s) since $latest_tag${NC}"
        fi
        if $show_commits; then
            echo -e "${CYAN}  Commits since $latest_tag:${NC}"
            git log --oneline "${latest_tag}..HEAD" -- "$plugin_path" | grep -vE "^[a-f0-9]+ chore\(version\): update .* version to .*\.dev0$" | sed 's/^/    /'
            echo ""
        fi
    else
        unchanged_plugins+=("$plugin")
        if $verbose; then
            echo -e "${NC}$plugin: No changes since $latest_tag${NC}"
        fi
    fi
done

# Summary
echo ""
echo "========================================"
echo "           Summary"
echo "========================================"

if [ ${#changed_plugins[@]} -gt 0 ]; then
    echo -e "${GREEN}Plugins with changes (${#changed_plugins[@]}):${NC}"
    for plugin in "${changed_plugins[@]}"; do
        latest_tag=$(git tag --list "${plugin}-v*" --sort=-v:refname | head -1)
        commit_count=$(git log --oneline "${latest_tag}..HEAD" -- "plugins/$plugin" | grep -cvE "^[a-f0-9]+ chore\(version\): update .* version to .*\.dev0$" || true)
        echo -e "  ${GREEN}✓${NC} $plugin ($commit_count commits since $latest_tag)"
    done
    echo ""
fi

if [ ${#untagged_plugins[@]} -gt 0 ]; then
    echo -e "${YELLOW}Plugins without any tags (${#untagged_plugins[@]}):${NC}"
    for plugin in "${untagged_plugins[@]}"; do
        echo -e "  ${YELLOW}?${NC} $plugin"
    done
    echo ""
fi

if [ ${#unchanged_plugins[@]} -gt 0 ] && $verbose; then
    echo -e "Plugins with no changes (${#unchanged_plugins[@]}):"
    for plugin in "${unchanged_plugins[@]}"; do
        latest_tag=$(git tag --list "${plugin}-v*" --sort=-v:refname | head -1)
        echo "  - $plugin (latest: $latest_tag)"
    done
    echo ""
fi

# Suggest release commands
if [ ${#changed_plugins[@]} -gt 0 ]; then
    echo "========================================"
    echo "        Suggested Release Commands"
    echo "========================================"
    for plugin in "${changed_plugins[@]}"; do
        echo "  tools/release.sh $plugin"
    done
    echo ""
fi
