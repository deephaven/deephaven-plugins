#!/bin/bash

# Set pwd to this directory
pushd "$(dirname "$0")"

# Start the containers
docker compose up -d deephaven-plugins
docker compose up e2e-tests

# Close down
exit_code=$?
docker compose down

popd # Reset pwd
exit $exit_code
