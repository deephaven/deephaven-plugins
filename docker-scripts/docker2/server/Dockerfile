# syntax=docker/dockerfile:1
# Dockerfile for updating the snapshots.
# Expects to be run from the root of the deephaven-plugins repo
FROM mcr.microsoft.com/playwright:v1.37.1-jammy AS playwright
WORKDIR /work/

# Update packages list and install some build tools.
# Installing fonts-dejavu-core so we have some common fonts with the GH actions
# runner that can be used to render unicode fonts. See README for more info.
RUN set -eux; \
    apt-get update; \
    apt-get install build-essential --yes; \
    apt-get install fonts-dejavu-core --yes;

RUN fc-list : family;

# Copy just the .nvmrc first and install nvm/node/npm first as these will change the least often
# https://docs.docker.com/build/cache/
COPY .nvmrc .

# Set the default shell so the correct node/npm is used after install
# https://stackoverflow.com/a/60137919
SHELL ["/bin/bash", "--login", "-i", "-c"]
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
RUN source /root/.bashrc && nvm install
SHELL ["/bin/bash", "--login", "-c"]

# This is a workaround for copying all package.json files w/ directory structure
# without needing to list every file as a COPY command
# The copy --from=copy-plugins command will be a cache hit if the package.json files didn't change
FROM alpine AS copy-plugins
WORKDIR /work/
COPY . /tmp/deephaven-plugins
COPY requirements.txt package.json package-lock.json ./
# cd first so the cp doesn't include /tmp/deephaven-plugins in the paths
# RUN cd /tmp/deephaven-plugins && cp --parents ./plugins/*/package.json /work/ && cp --parents ./plugins/*/setup.* /work/
RUN cd /tmp/deephaven-plugins && cp --parents ./plugins/*/src/js/package.json /work/ && cp --parents ./plugins/*/setup.* /work/

FROM playwright AS build
WORKDIR /work/
COPY --from=copy-plugins /work/ .

# Install the python requirements
RUN pip install -r requirements.txt

# Install the npm packages
RUN npm ci

# Copy the deephaven-plugins src folder to the docker image
# We do this last because the source files are the most likely to change
# This requires the Dockerfile to be built in the context of the root of the deephaven-plugins repository
# https://stackoverflow.com/a/34300129
COPY . .

# Build the JS
RUN npm run build

# Now build the Python bundles
RUN find ./plugins -maxdepth 1 -mindepth 1 -type d -exec python -m build --wheel {} \;


# FROM ghcr.io/deephaven/web-plugin-packager:latest as build
# RUN ./pack-plugins.sh @deephaven/js-plugin-matplotlib

FROM ghcr.io/deephaven/server:edge
COPY --link --from=build /work/ /opt/deephaven/config/plugins/
COPY --link docker-scripts/docker2/server/deephaven.prop /opt/deephaven/config/deephaven.prop