#!/bin/bash

# Set pwd to this directory
pushd "$(dirname "$0")"

# Start the containers
if [[ -z "${CI}" ]]; then
  docker compose run --service-ports --rm --build "$@"
else
  docker compose run --service-ports --rm --build -e CI=true "$@"
fi
exit_code=$?
docker compose down

# Reset pwd
popd
exit $exit_code
