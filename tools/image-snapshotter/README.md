# @deephaven/image-snapshotter

Pass 2 docs widget snapshotter. Plugin-agnostic — point it at any plugin
that follows the salmon docs convention (`docs/**/*.md` with `order=`
tagged Python blocks) and it will capture widget PNGs and merge them
into salmon-compatible JSON envelopes.

## What it does

For every fenced Python code block in `<plugin>/docs/**/*.md` that carries
an `order=name1,name2,...` info-string flag, this tool:

1. Generates a per-block Python fixture under
   `snapshot-results/<plugin>-app.d/block_<md5>.py` so each docs example
   becomes an importable Deephaven app.d panel.
2. Brings up a server compose file (`SNAPSHOTTER_COMPOSE_FILE`) bind-mounted
   against those fixtures, waits for the server to be reachable, then runs
   Playwright. The spec opens each named panel, waits for the widget
   matching `SNAPSHOTTER_TARGET_SELECTOR` to settle, screenshots, and
   merges the PNG path + dimensions into `docs/snapshots/<code_md5>.json`.
3. Deduplicates PNGs by content (sha256 filename).
4. Prunes orphan PNGs in `docs/snapshots/assets/` that no envelope
   references anymore.

This is the widget half of a two-pass docs-snapshot system. Pass 1 (handled
externally by salmon) writes table objects into the same `<code_md5>.json`
files; the merge is additive and never clobbers salmon-authored keys.

## Configuration (env vars)

Required:

- `SNAPSHOTTER_PLUGIN_ROOT` — plugin root; `docs/`, `docs/snapshots/` live under it.
- `SNAPSHOTTER_TARGET_SELECTOR` — CSS selector for the widget to screenshot (e.g. `.dh-tvl-chart`).
- `SNAPSHOTTER_WIDGET_TYPE` — widget type string stamped into envelopes.
- `SNAPSHOTTER_PLUGIN` — short slug used for output paths (e.g. `tradingview-lightweight`).
- `SNAPSHOTTER_COMPOSE_FILE` — server compose file (relative to `/workspace` in docker).
- `SNAPSHOTTER_SERVER_CONTAINER` — name of the server container compose will create.

Optional:

- `SNAPSHOTTER_BASE_URL` — IDE URL (default `http://localhost:10000/ide/`).
- `SNAPSHOTTER_APP_ID` — Deephaven app.d id stamped into the generated manifest (default `docs.examples`).
- `SNAPSHOTTER_APP_NAME` — human label for the app.d manifest (default `Docs Examples`).
- `SNAPSHOTTER_SERVER_HEALTH_URL` — readiness probe URL (default `http://server:10000/`).
- `SNAPSHOTTER_PREFIX_MAP` — path to the md5→prefix JSON; auto-set by the entrypoint.
- `DEEPHAVEN_PLUGINS_STATIC_DATA=1` — passed to the server so the bundled
  `data` generators emit deterministic static tables. Always set in Pass 2.

## md5 algorithm (contract)

Block hash is:

```
md5(code.strip() + "-python")   # hex, lowercase
```

This must stay byte-for-byte aligned with salmon's per-block hash. The
contract is documented at the top of `src/extract.ts` and pinned by
`tests/extract.test.ts`.

## Adding a new docs example

1. Edit (or create) a `.md` file under `<plugin>/docs/`.
2. Add a fenced block tagged with the variables you want to capture:

   ````markdown
   ```python order=my_chart
   from deephaven.plot import tradingview_lightweight as tvl
   t = tvl.data.values()
   my_chart = tvl.line(t, time="Timestamp", value="Value")
   ```
   ````

3. Re-run the snapshotter. The new envelope appears at
   `docs/snapshots/<md5>.json` and the PNG at
   `docs/snapshots/assets/<sha256>.png`. Commit both.

Skip markers:

- Put `# no-snapshot` on the **first line** of the block body, or
- Add `skip-test` (or `no-snapshot`) to the info string:
  ```` ```python order=helper skip-test ````

## Running locally (against a hand-started server)

```bash
cd tools/image-snapshotter
npm install
npm run build

export SNAPSHOTTER_PLUGIN_ROOT=$PWD/../../plugins/tradingview-lightweight
export SNAPSHOTTER_TARGET_SELECTOR=".dh-tvl-chart"
export SNAPSHOTTER_WIDGET_TYPE="deephaven.plot.tradingview_lightweight.TvlChart"

npx playwright test                         # capture only
node dist/cli.js --prune-only               # orphan cleanup
node dist/cli.js                            # full pipeline (capture + prune, fail on dirty git)
node dist/cli.js --update                   # accept changes
```

## Running in CI

The repo-root `docker-compose.docs-snapshots.yml` brings up the salmon
extractor / snapshotter / validator pipeline. The image-snapshotter service
in that compose file runs once per plugin with the appropriate
`SNAPSHOTTER_*` env block set.

## Unit tests

```bash
cd tools/image-snapshotter
npm install
npm test
```

Tests cover the `extract.ts` parser, `codeMd5` stability, and the
`fixtures.ts` generator. The Playwright spec itself is not run as a unit
test (it needs the docker stack).

## Layout

```
tools/image-snapshotter/
├── package.json
├── tsconfig.json
├── playwright.config.ts
├── README.md
├── src/
│   ├── extract.ts        code-block walker + codeMd5
│   ├── fixtures.ts       writes block_<md5>.py and tests.app manifest
│   ├── merge.ts          read/merge/write JSON envelopes (atomic)
│   ├── prune.ts          orphan asset cleanup
│   ├── generate-fixtures-cli.ts  app.d generator CLI
│   └── cli.ts            argparse + orchestrator
├── tests/
│   ├── docs-snapshots.spec.ts   Playwright capture pass
│   ├── extract.test.ts          vitest unit tests for the parser
│   └── fixtures.test.ts         vitest unit tests for the fixture writer
└── dist/                 (build artifact, gitignored)
```
