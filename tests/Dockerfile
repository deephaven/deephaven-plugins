# syntax=docker/dockerfile:1

# Dockerfile for running and updating snapshots locally and on CI
FROM mcr.microsoft.com/playwright:v1.41.2-jammy AS playwright
WORKDIR /work/

RUN npm install @playwright/test@1.41.2
COPY playwright.config.ts .
COPY playwright-docker.config.ts .
