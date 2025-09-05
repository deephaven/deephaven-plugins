# syntax=docker/dockerfile:1
# Dockerfile for starting up a deephaven-server with these latest plugins built and installed
# Expects to be run from the root of the deephaven-plugins repo
# First lets build and install the JS plugins
FROM node:20.13.1 AS base
WORKDIR /work/

# Update packages list and install python python
RUN set -eux; \
    apt-get update; \
    apt-get install python3-pip --yes;

# This is a workaround for copying all package.json files w/ directory structure
# without needing to list every file as a COPY command
# The copy --from=copy-plugins command will be a cache hit if the package.json files didn't change
FROM alpine AS copy-plugins
WORKDIR /work/
COPY plugins /tmp/deephaven-plugins
COPY package.json package-lock.json requirements.txt ./
# cd first so the cp doesn't include /tmp/deephaven-plugins in the paths
RUN cd /tmp/deephaven-plugins && cp --parents ./*/src/js/package.json /work/ && cp --parents ./*/setup.* /work/

FROM base AS build
WORKDIR /work/
COPY --from=copy-plugins /work/ .

# Install the python requirements
RUN pip3 install -r requirements.txt --break-system-packages

# Install the npm packages
RUN npm ci

COPY babel.config.js lerna.json nx.json tsconfig.json ./

# Copy the deephaven-plugins source files to the docker image
# We do this last because the source files are the most likely to change
# This requires the Dockerfile to be built in the context of the root of the deephaven-plugins repository
# https://stackoverflow.com/a/34300129
COPY plugins plugins
# delete the plotly plugin as it's deprecated
RUN rm -rf plugins/plotly

# Build the JS
RUN npm run build

# Now build the Python bundles
RUN find ./plugins -maxdepth 1 -mindepth 1 -type d -exec python3 -m build --wheel {} \;

FROM ghcr.io/deephaven/server:edge
COPY --link --from=build /work/ /opt/deephaven/config/plugins/
# Tagging with all ensures that every optional package is installed
RUN find /opt/deephaven/config/plugins/plugins/*/dist/*.whl | xargs -I {} pip install {}[all]

COPY --link docker/config/deephaven.prop /opt/deephaven/config/deephaven.prop

# We copy our data directory in from the data container in case we're publishing the image
# However, you can mount a volume to override this in the docker-compose.override.yml
COPY --link docker/data /data

# Set the environment variable to enable the JS plugins embedded in Python
ENV DEEPHAVEN_ENABLE_PY_JS=true

HEALTHCHECK --interval=3s --retries=3 --timeout=11s CMD /opt/grpc_health_probe/grpc_health_probe -addr=localhost:10000 -connect-timeout=10s || exit 1
