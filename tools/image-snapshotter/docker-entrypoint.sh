#!/usr/bin/env bash
#
# Pass 2 docs image-snapshotter entrypoint. Plugin-agnostic — the compose
# file, server container name, and fixture output dir are passed in via env.
#
# 1. Generate per-block app.d fixtures from /work/docs into a workspace dir
#    that's visible on the host (so the test server can bind-mount it).
# 2. `docker compose -f $SNAPSHOTTER_COMPOSE_FILE up -d server` against a
#    HOST-path bind-mount of those fixtures.
# 3. Poll the server URL until it returns 200 — app.d evaluation adds
#    startup time, so we allow up to 300s.
# 4. Run `npx playwright test` to capture widget PNGs / merge JSON envelopes.
# 5. Always tear the server back down before exiting, propagating
#    Playwright's exit code.
#
# Required env (set by docker-compose.docs-snapshots.yml):
#   SNAPSHOTTER_PLUGIN              Plugin short name; used in path slugs.
#   SNAPSHOTTER_COMPOSE_FILE        Path (inside /workspace) to the server compose file.
#   SNAPSHOTTER_SERVER_CONTAINER    Container name docker compose will create.
#   HOST_PWD                        $PWD as seen by the host (for bind-mount paths).
#   SNAPSHOTTER_PLUGIN_ROOT, SNAPSHOTTER_WIDGET_TYPE, SNAPSHOTTER_TARGET_SELECTOR
#                                   Consumed by the playwright spec.

set -u

: "${SNAPSHOTTER_PLUGIN:?SNAPSHOTTER_PLUGIN is required}"
: "${SNAPSHOTTER_COMPOSE_FILE:?SNAPSHOTTER_COMPOSE_FILE is required}"
: "${SNAPSHOTTER_SERVER_CONTAINER:?SNAPSHOTTER_SERVER_CONTAINER is required}"
: "${HOST_PWD:?HOST_PWD is required (parent compose must set HOST_PWD: \${PWD})}"

COMPOSE_FILE="${SNAPSHOTTER_COMPOSE_FILE}"
SERVER_URL="${SNAPSHOTTER_SERVER_HEALTH_URL:-http://server:10000/}"
SERVER_CONTAINER="${SNAPSHOTTER_SERVER_CONTAINER}"

# Where we write the generated app.d. /workspace == $HOST_PWD inside this
# container, so /workspace/snapshot-results/<plugin>-app.d is visible on the
# host at $HOST_PWD/snapshot-results/<plugin>-app.d.
APPD_CONTAINER_PATH="/workspace/snapshot-results/${SNAPSHOTTER_PLUGIN}-app.d"

# Mirror every line of output to a host-visible log file so post-mortems
# don't require `docker logs` access. The path also lands inside the
# bind-mounted /workspace so the file appears on the host at
# $HOST_PWD/snapshot-results/<plugin>-snapshotter.log.
LOG_DIR="/workspace/snapshot-results"
LOG_FILE="${LOG_DIR}/${SNAPSHOTTER_PLUGIN}-snapshotter.log"
mkdir -p "${LOG_DIR}"
# Truncate so the file always reflects only the latest run.
: > "${LOG_FILE}"
# Re-open fds so EVERY line written after this point goes to both the
# original terminal and the log file. tee runs in a process substitution so
# its lifetime is bound to this shell.
exec > >(tee -a "${LOG_FILE}") 2>&1
echo "[entrypoint] log mirrored to host: snapshot-results/${SNAPSHOTTER_PLUGIN}-snapshotter.log"

cleanup() {
    echo "[entrypoint] tearing down server..."
    if [ -f "${COMPOSE_FILE}" ]; then
        docker compose -f "${COMPOSE_FILE}" down --remove-orphans || true
    fi
}
trap cleanup EXIT

# --- 1. Generate fixtures ------------------------------------------------
echo "[entrypoint] generating per-block app.d fixtures..."
rm -rf "${APPD_CONTAINER_PATH}"
mkdir -p "${APPD_CONTAINER_PATH}"
if ! node /work/dist/generate-fixtures-cli.js \
        --docs /work/docs \
        --out "${APPD_CONTAINER_PATH}"; then
    echo "[entrypoint] fixture generation failed" >&2
    exit 1
fi

# --- 2. Resolve HOST path and bring server up ----------------------------
export PASS2_APPD_HOST_PATH="${HOST_PWD}/snapshot-results/${SNAPSHOTTER_PLUGIN}-app.d"
# Tell the spec where to find the prefix map (container-local path).
export SNAPSHOTTER_PREFIX_MAP="${APPD_CONTAINER_PATH}/prefix-map.json"

# Tear down any stale container left behind by an earlier crashed run.
docker rm -f "${SERVER_CONTAINER}" >/dev/null 2>&1 || true

echo "[entrypoint] starting test server via ${COMPOSE_FILE}..."
echo "[entrypoint]   PASS2_APPD_HOST_PATH=${PASS2_APPD_HOST_PATH}"
if ! docker compose -f "${COMPOSE_FILE}" up -d server; then
    echo "[entrypoint] failed to bring server up" >&2
    exit 1
fi

# --- 3. Wait for readiness ----------------------------------------------
echo "[entrypoint] waiting for ${SERVER_URL} to respond (up to 300s)..."
i=0
while [ $i -lt 150 ]; do
    i=$((i + 1))
    if curl --silent --fail --output /dev/null --connect-timeout 2 "${SERVER_URL}"; then
        echo "[entrypoint] server is ready."
        break
    fi
    state=$(docker inspect -f '{{.State.Status}}' "${SERVER_CONTAINER}" 2>/dev/null || echo "missing")
    if [ "$state" != "running" ]; then
        echo "[entrypoint] ${SERVER_CONTAINER} died during startup (state=$state)" >&2
        echo "[entrypoint] ---- last 200 lines of server logs ----" >&2
        docker logs --tail 200 "${SERVER_CONTAINER}" 2>&1 || true
        echo "[entrypoint] ---- end of server logs ----" >&2
        exit 1
    fi
    sleep 2
    if [ $i -eq 150 ]; then
        echo "[entrypoint] server failed to become ready at ${SERVER_URL} after 300s" >&2
        echo "[entrypoint] ---- last 200 lines of server logs ----" >&2
        docker logs --tail 200 "${SERVER_CONTAINER}" 2>&1 || true
        echo "[entrypoint] ---- end of server logs ----" >&2
        exit 1
    fi
done

# --- 4. Capture ----------------------------------------------------------
echo "[entrypoint] running playwright tests..."
echo "[entrypoint]   target selector : ${SNAPSHOTTER_TARGET_SELECTOR:-<unset>}"
echo "[entrypoint]   widget type     : ${SNAPSHOTTER_WIDGET_TYPE:-<unset>}"
echo "[entrypoint]   plugin root     : ${SNAPSHOTTER_PLUGIN_ROOT:-<unset>}"
echo "[entrypoint]   prefix map      : ${SNAPSHOTTER_PREFIX_MAP:-<unset>}"
# Pre-capture inventory so we can compare after the run.
SNAPSHOTS_HOST_DIR="${SNAPSHOTTER_PLUGIN_ROOT:-/work}/docs/snapshots"
PRE_PNG=$(find "${SNAPSHOTS_HOST_DIR}/assets" -maxdepth 1 -name '*.png' 2>/dev/null | wc -l)
PRE_ENV=$(find "${SNAPSHOTS_HOST_DIR}" -maxdepth 1 -name '*.json' 2>/dev/null | wc -l)
echo "[entrypoint]   pre-capture PNGs in docs/snapshots/assets/  : ${PRE_PNG}"
echo "[entrypoint]   pre-capture envelopes in docs/snapshots/    : ${PRE_ENV}"

npx playwright test
PLAYWRIGHT_EXIT=$?

POST_PNG=$(find "${SNAPSHOTS_HOST_DIR}/assets" -maxdepth 1 -name '*.png' 2>/dev/null | wc -l)
POST_ENV=$(find "${SNAPSHOTS_HOST_DIR}" -maxdepth 1 -name '*.json' 2>/dev/null | wc -l)
POST_IMG=$(grep -l '"image"' "${SNAPSHOTS_HOST_DIR}"/*.json 2>/dev/null | wc -l)
echo "[entrypoint] playwright finished with exit code ${PLAYWRIGHT_EXIT}."
echo "[entrypoint]   post-capture PNGs in docs/snapshots/assets/        : ${POST_PNG} (delta ${POST_PNG}-${PRE_PNG})"
echo "[entrypoint]   post-capture envelopes in docs/snapshots/          : ${POST_ENV} (delta ${POST_ENV}-${PRE_ENV})"
echo "[entrypoint]   post-capture envelopes referencing a PNG           : ${POST_IMG}"
if [ "${POST_PNG}" = "0" ] && [ "${PLAYWRIGHT_EXIT}" = "0" ]; then
    echo "[entrypoint] WARNING: playwright reported success but zero PNGs were written." >&2
    echo "[entrypoint] WARNING: most likely cause is that every chart.waitFor timed out" >&2
    echo "[entrypoint] WARNING: (panels never registered, or the widget selector doesn't match)." >&2
    echo "[entrypoint] WARNING: last 80 lines of server log follow:" >&2
    docker logs --tail 80 "${SERVER_CONTAINER}" 2>&1 || true
fi

# --- 5. Validate that every envelope image reference exists on disk -------
# This is Stage 2 of the snapshot validation pipeline. It catches the
# "envelope was written, asset was not" failure mode that the docs site
# would otherwise hit at MDX render time.
echo "[entrypoint] validating snapshot assets..."
if ! node /work/dist/validate-assets-cli.js "${SNAPSHOTS_HOST_DIR}"; then
    VALIDATE_EXIT=$?
    echo "[entrypoint] snapshot asset validation failed (exit ${VALIDATE_EXIT})." >&2
    # Prefer reporting the playwright failure if there was one, otherwise
    # surface the validator's exit code.
    if [ "${PLAYWRIGHT_EXIT}" = "0" ]; then
        exit "${VALIDATE_EXIT}"
    fi
fi

exit "${PLAYWRIGHT_EXIT}"
