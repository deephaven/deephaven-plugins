# syntax=docker/dockerfile:1

# Dockerfile for running and updating snapshots locally and on CI
FROM mcr.microsoft.com/playwright:v1.44.1-jammy AS playwright
ARG UID=0
ARG GID=0
# Set user so it owns the work directory
# Without this, we need to run snapshots as root and results are written as root
USER ${UID}:${GID}
WORKDIR /work/

# Reset to root user to install packages
USER 0:0
# Update packages list and install some build tools.
# Installing fonts-dejavu-core so we have some common fonts with the GH actions
# runner that can be used to render unicode fonts. See web-client-ui README for more info.
RUN set -eux; \
    apt-get update; \
    apt-get install build-essential --yes; \
    apt-get install fonts-dejavu-core --yes;

RUN fc-list : family;

# Copy just the .nvmrc first and install nvm/node/npm first as these will change the least often
# https://docs.docker.com/build/cache/
COPY .nvmrc .

# nvm needs to be run in a bash shell
SHELL ["/bin/bash", "--login", "-c"]
# The default `.bashrc` bails on the first line if not in interactive shell.
# We can just empty it so that the nvm install below will actually run when sourcing
# `.bashrc`
RUN echo "" > /root/.bashrc  
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
RUN source /root/.bashrc && nvm install

# Now clobber the default node installed by the playwright
# image so that the commands in docker compose entrypoint will 
# also use the correct version of node without running in bash
RUN ln -s $(which node) /usr/local/bin/nodejs
RUN ln -s $(which node) /usr/local/bin/node
RUN ln -s $(which npm) /usr/local/bin/npm

# Confirm node version is correct for debugging
RUN node --version

RUN npm install @playwright/test@1.44.1
COPY playwright.config.ts .
COPY playwright-docker.config.ts .
