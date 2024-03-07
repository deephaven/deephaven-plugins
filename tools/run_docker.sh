#!/bin/bash

# Set pwd to this directory
pushd "$(dirname "$0")"

# Start the containers
docker compose run --service-ports --rm --build "$@"
exit_code=$?
docker logs deephaven-plugins > /tmp/server-log.txt 2>&1
docker compose down

# Reset pwd
popd
exit $exit_code
