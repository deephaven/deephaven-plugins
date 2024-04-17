# syntax=docker/dockerfile:1

# Dockerfile for running and updating snapshots locally and on CI
FROM mcr.microsoft.com/playwright:v1.43.1 AS playwright
WORKDIR /work/

RUN npm install @playwright/test@1.43.1
COPY playwright.config.ts .
COPY playwright-docker.config.ts .
