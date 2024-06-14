#!/bin/bash

# Set pwd to this directory
pushd "$(dirname "$0")"

# Start the containers
if [[ "${CI}" == "1" || "${CI}" == "true" ]]; then
  # In CI, keep the container in case we need to dump logs in another
  # step of the GH action. It should be cleaned up automatically by the CI runner.
  docker compose -f ../tests/docker-compose.yml run --service-ports --build -e CI=true "$@"
  exit_code=$?
  # stop instead of down to preserve container logs
  docker compose -f ../tests/docker-compose.yml stop deephaven-plugins
else
  docker compose -f ../tests/docker-compose.yml run --service-ports --rm --build "$@"
  exit_code=$?
  docker compose -f ../tests/docker-compose.yml down
fi

# Reset pwd
popd
exit $exit_code
