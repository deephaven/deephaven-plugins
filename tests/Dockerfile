# syntax=docker/dockerfile:1

# Dockerfile for running and updating snapshots locally and on CI
FROM mcr.microsoft.com/playwright:v1.41.2-jammy AS playwright
WORKDIR /work/

# Update packages list and install some build tools.
# Installing fonts-dejavu-core so we have some common fonts with the GH actions
# runner that can be used to render unicode fonts. See README for more info.
RUN set -eux; \
    apt-get update; \
    apt-get install build-essential --yes; \
    apt-get install fonts-dejavu-core --yes;

RUN fc-list : family;

RUN npm install @playwright/test@1.41.2
COPY playwright.config.ts .
COPY playwright-docker.config.ts .
