# syntax=docker/dockerfile:1
# Dockerfile for starting up a deephaven-server with these latest plugins built and installed
# Expects to be run from the root of the deephaven-plugins repo
# First lets build and install the JS plugins
FROM node:18 AS playwright
WORKDIR /work/

# Update packages list and install python python
RUN set -eux; \
    apt-get update; \
    apt-get install python3-pip --yes;

# This is a workaround for copying all package.json files w/ directory structure
# without needing to list every file as a COPY command
# The copy --from=copy-plugins command will be a cache hit if the package.json files didn't change
FROM alpine AS copy-js-plugins
WORKDIR /work/
COPY . /tmp/deephaven-plugins
COPY requirements.txt package.json package-lock.json ./
# cd first so the cp doesn't include /tmp/deephaven-plugins in the paths
# RUN cd /tmp/deephaven-plugins && cp --parents ./plugins/*/package.json /work/ && cp --parents ./plugins/*/setup.* /work/
RUN cd /tmp/deephaven-plugins && cp --parents ./plugins/*/src/js/package.json /work/ && cp --parents ./plugins/*/setup.* /work/

FROM playwright as build
WORKDIR /work/
COPY --from=copy-js-plugins /work/ .

# Install the python requirements
RUN pip3 install -r requirements.txt --break-system-packages

# Install the npm packages
RUN npm ci

# Copy the web-client-ui src folder to the docker image
# We do this last because the source files are the most likely to change
# This requires the Dockerfile to be built in the context of the root of the web-client-ui repository
# https://stackoverflow.com/a/34300129
COPY . .

# Build the JS
RUN npm run build

# Now build the Python bundles
RUN find ./plugins -maxdepth 1 -mindepth 1 -type d -exec python3 -m build --wheel {} \;

FROM ghcr.io/deephaven/server:edge
COPY --link --from=build /work/ /opt/deephaven/config/plugins/
COPY --link docker-scripts/server/deephaven.prop /opt/deephaven/config/deephaven.prop
RUN pip install --force-reinstall /opt/deephaven/config/plugins/plugins/*/dist/*.whl

# RUN cd /tmp/deephaven-plugins && cp --parents ./plugins/*/src/js/package.json /work/ && cp --parents ./plugins/*/setup.* /work/

# Install the python requirements
# RUN pip install -r requirements.txt

# FROM alpine AS copy-plugins
# WORKDIR /work/
# COPY . /tmp/deephaven-plugins
# COPY requirements.txt package.json package-lock.json ./
# # cd first so the cp doesn't include /tmp/deephaven-plugins in the paths
# # RUN cd /tmp/deephaven-plugins && cp --parents ./plugins/*/package.json /work/ && cp --parents ./plugins/*/setup.* /work/
# RUN cd /tmp/deephaven-plugins && cp --parents ./plugins/*/src/js/package.json /work/ && cp --parents ./plugins/*/setup.* /work/

# # Copy the deephaven-plugins src folder to the docker image
# # We do this last because the source files are the most likely to change
# # This requires the Dockerfile to be built in the context of the root of the deephaven-plugins repository
# # https://stackoverflow.com/a/34300129
# COPY . .

# # Now build the Python bundles
# RUN find ./plugins -maxdepth 1 -mindepth 1 -type d -exec python -m build --wheel {} \;


# # FROM ghcr.io/deephaven/web-plugin-packager:latest as build
# # RUN ./pack-plugins.sh @deephaven/js-plugin-matplotlib

# FROM ghcr.io/deephaven/server:edge
# COPY --link --from=build /work/ /opt/deephaven/config/plugins/
# COPY --link docker-scripts/docker2/server/deephaven.prop /opt/deephaven/config/deephaven.prop