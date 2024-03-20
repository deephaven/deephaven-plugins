#!/bin/bash

# Set pwd to this directory
pushd "$(dirname "$0")"

# Start the containers
if [[ -z "${CI}" ]]; then
  docker compose -f ../tests/docker-compose.yml run --service-ports --rm --build "$@"
  exit_code=$?
  docker compose -f ../tests/docker-compose.yml down
else
  docker compose -f ../tests/docker-compose.yml run --service-ports --rm --build -e CI=true "$@"
  exit_code=$?
  docker compose -f ../tests/docker-compose.yml stop deephaven-plugins-e2e
fi

# Reset pwd
popd
exit $exit_code
