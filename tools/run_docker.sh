#!/bin/bash

# Set pwd to this directory
pushd "$(dirname "$0")"

# Start the containers
if [[ -z "${CI}" ]]; then
  docker compose run --service-ports --rm --build "$@"
  exit_code=$?
  docker compose down
else
  docker compose run --service-ports --rm --build -e CI=true "$@"
  exit_code=$?
  docker compose stop deephaven-plugins
fi

# Reset pwd
popd
exit $exit_code
