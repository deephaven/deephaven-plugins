#!/bin/bash

set -o errexit
set -o nounset
set -o pipefail

# Clean out any old snapshots
rm -rf plugins/plotly-express/docs/build/markdown/snapshots
rm -rf plugins/ui/docs/build/markdown/snapshots

# Copy the new snapshots into the build directory
cp -r plugins/ui/docs/snapshots plugins/ui/docs/build/markdown/snapshots
cp -r plugins/plotly-express/docs/snapshots plugins/plotly-express/docs/build/markdown/snapshots
