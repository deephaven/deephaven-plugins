# deephaven-plugin-tradingview-lightweight

A Deephaven plugin for creating TradingView Lightweight Charts from Python.

## Usage

```python
from deephaven.plot import tradingview_lightweight as tvl

# Simple candlestick chart
chart = tvl.candlestick(
    ohlc_table,
    time="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
)

# Multi-series chart
chart = tvl.chart(
    tvl.candlestick(
        ohlc_table,
        timestamp="Timestamp",
        open="Open",
        high="High",
        low="Low",
        close="Close",
    ),
    tvl.line(
        sma_table,
        timestamp="Timestamp",
        value="SMA_20",
        color="#2962FF",
        title="SMA 20",
    ),
    crosshair_mode="magnet",
    time_visible=True,
)
```

## Docs

User-facing documentation lives in [`docs/`](./docs/README.md) and follows
the same structure plotly-express does: one Markdown page per chart type and
concept, ending with a `## API Reference` block that `dhautofunction` expands
from the Python docstrings.

### Build the docs locally

From the repo root:

```shell
pip install -r ../../sphinx_ext/sphinx-requirements.txt
pip install dist/deephaven_plugin_tradingview_lightweight-*.whl
python make_docs.py
```

The rendered Markdown lands in `docs/build/markdown/`. Don't commit it —
`docs/build/` is gitignored.

### Use `plugin_builder.py` (recommended)

The same `plugin_builder.py` workflow used for `ui` and `plotly-express`
works here. From the repo root:

```shell
# Reinstall the wheel, then build docs.
python tools/plugin_builder.py --docs --reinstall tradingview-lightweight

# Build docs and regenerate Pass-1 (table) snapshots.
python tools/plugin_builder.py --docs --snapshots --reinstall tradingview-lightweight
```

### Preview the docs

```shell
# Live preview at http://localhost:3001 (uses source markdown, no API reference).
npm run docs

# Or, after running `python tools/plugin_builder.py --docs tradingview-lightweight`:
BUILT=true npm run docs
```

### Snapshot pipeline

Doc snapshots are split into two passes:

1. **Pass 1 — salmon snapshotter.** Walks `docs/*.md`, executes each
   `python order=...` code block against a test Deephaven server, and writes
   `docs/snapshots/<code_md5>.json` for the `Table` objects in `order=`.
   `TvlChart` objects are skipped with a warning — Pass 1 doesn't know how
   to render canvas-based charts.

2. **Pass 2 — image-snapshotter.** Lives at `tools/image-snapshotter/` at
   the repo root (shared across plugins). Drives Playwright against a live
   DH server, screenshots every `TvlChart` in the docs (selector and widget
   type are passed in via `SNAPSHOTTER_TARGET_SELECTOR` /
   `SNAPSHOTTER_WIDGET_TYPE`), hashes the PNG, writes
   `docs/snapshots/assets/<image_sha>.png`, and merges the chart entry
   into the same `<code_md5>.json` file Pass 1 wrote.

Both passes are wired into the repo-root docker pipeline. From the repo
root run:

```shell
npm run update-doc-snapshots
```

or equivalently:

```shell
python tools/plugin_builder.py --snapshots tradingview-lightweight
```

This brings up the salmon extractor + snapshotter + validator, and then a
fourth service (`deephaven-plugins-docs-image-snapshotter-tvl`) that runs
Pass 2 inside Playwright's official Docker image against a fresh server.
No hand-started DH server is required.

The merged JSON envelope carries both the Pass-1 `Table` entries and the
Pass-2 `TvlChart` entries, keyed by the `order=` symbol names. Salmon
renders the table entries directly; the chart entries point at the
content-addressed PNG asset.

#### Local iteration (no docker)

The plugin-local `make docs-snapshots` target still exists for tight
iteration loops against a hand-started server, but it is **not** how CI
generates snapshots — use the repo-root command above for anything that
needs to match CI.

```shell
python tools/plugin_builder.py --plugin tradingview-lightweight   # separate terminal
make docs-snapshots                                                # build + run Playwright + prune orphans
```

Or, even more manually:

```shell
cd tools/image-snapshotter
npm install
npx playwright install chromium   # one-time
npm run build
SNAPSHOTTER_PLUGIN_ROOT=$PWD/../../plugins/tradingview-lightweight \
  SNAPSHOTTER_TARGET_SELECTOR=.dh-tvl-chart \
  SNAPSHOTTER_WIDGET_TYPE=deephaven.plot.tradingview_lightweight.TvlChart \
  node dist/cli.js --update         # local; `--check` for CI gate
```
