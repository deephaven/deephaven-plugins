# Pass 2 docs image-snapshotter image. Plugin-agnostic — the target widget
# selector, server compose file, and server container name come from
# SNAPSHOTTER_* env vars passed in by docker-compose.docs-snapshots.yml.
#
# The container brings up the test server via the mounted docker socket
# (`docker compose -f $SNAPSHOTTER_COMPOSE_FILE up -d server`), waits for it
# to be reachable on the shared `deephaven-plugins-docs-snapshot-network`,
# runs the Playwright suite, and tears the server back down.
#
# Pinned to Playwright v1.44.1-jammy so the chromium binary matches what
# `@playwright/test@1.44.1` (from package.json) expects.
FROM mcr.microsoft.com/playwright:v1.44.1-jammy

# Install the Docker CLI + compose plugin so this container can talk to the
# mounted /var/run/docker.sock and run `docker compose ... up -d server`.
# The base image is Ubuntu jammy, so use the official Docker apt repo.
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
        lsb-release; \
    install -m 0755 -d /etc/apt/keyrings; \
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg; \
    chmod a+r /etc/apt/keyrings/docker.gpg; \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu \
        $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" \
        > /etc/apt/sources.list.d/docker.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        docker-ce-cli \
        docker-compose-plugin; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /work

# Install JS deps first so they cache across source-only changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy build inputs.
COPY tsconfig.json playwright.config.ts ./
COPY src ./src
COPY tests ./tests

RUN npm run build

# Entrypoint script: brings up the server, waits for it, runs Playwright,
# tears the server down, exits with Playwright's exit code.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
