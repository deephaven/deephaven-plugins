#!/bin/bash

IS_CI=0
if [[ "${CI}" == "1" || "${CI}" == "true" ]]; then
  IS_CI=1
fi

# Create directories if they don't exist
# Otherwise, Docker will create them owned by root
createDirectory () {
  if [[ ! -d "$1" ]]; then
    echo "Creating $1 directory"
    mkdir $1
  fi
  if [[ $IS_CI -eq 0 && ! -O "$1" ]]; then
    echo "$1 directory not owned by current user"
    echo "Running 'sudo chown -R $(id -u):$(id -g) $1' to take ownership"
    echo "Please enter your password if prompted"
    echo ""
    sudo chown -R $(id -u):$(id -g) $1
  fi
}

createDirectory "./test-results"
createDirectory "./playwright-report"

# Set pwd to this directory
pushd "$(dirname "$0")"

export DOCKER_UID=$(id -u)
export DOCKER_GID=$(id -g)

# Start the containers
if [[ $IS_CI -eq 1 ]]; then
  # In CI, keep the container in case we need to dump logs in another
  # step of the GH action. It should be cleaned up automatically by the CI runner.
  docker compose -f ../tests/docker-compose.yml run --service-ports --build -e CI=true "$@"
  exit_code=$?
  # stop instead of down to preserve container logs
  docker compose -f ../tests/docker-compose.yml stop deephaven-plugins
else
  # Use current user/group ID so docker doesn't write files as root
  docker compose -f ../tests/docker-compose.yml run --service-ports --rm --build "$@"
  exit_code=$?
  docker compose -f ../tests/docker-compose.yml down
fi

# Reset pwd
popd
exit $exit_code
