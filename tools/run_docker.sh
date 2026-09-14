#!/bin/bash

COMPOSE_FILE=$1
shift

# Resolve the host Docker socket so containers that need Docker access work with
# rootless Docker (socket lives under $XDG_RUNTIME_DIR) as well as rootful Docker.
if [[ -z "${DOCKER_SOCKET}" ]]; then
  docker_host=${DOCKER_HOST:-$(docker context inspect --format '{{.Endpoints.docker.Host}}' 2>/dev/null)}
  if [[ "${docker_host}" == unix://* ]]; then
    DOCKER_SOCKET=${docker_host#unix://}
  else
    DOCKER_SOCKET=/var/run/docker.sock
  fi
fi
export DOCKER_SOCKET

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
