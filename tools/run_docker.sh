#!/bin/bash

COMPOSE_FILE=$1
shift

# Start the containers
if [[ "${CI}" == "1" || "${CI}" == "true" ]]; then
  # In CI, keep the container in case we need to dump logs in another
  # step of the GH action. It should be cleaned up automatically by the CI runner.
  docker compose -f "${COMPOSE_FILE}" run --service-ports --build -e CI=true "$@"
  exit_code=$?
  # stop instead of down to preserve container logs
  docker compose -f "${COMPOSE_FILE}" stop deephaven-plugins
else
  docker compose -f "${COMPOSE_FILE}" run --service-ports --rm --build "$@"
  exit_code=$?
  docker compose -f "${COMPOSE_FILE}" down
fi

exit $exit_code
