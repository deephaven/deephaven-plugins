# deephaven-plugin-tradingview-lightweight

A Deephaven plugin for creating TradingView Lightweight Charts from Python.

## Usage

```python
from deephaven.plot import tradingview_lightweight as tvl

# Simple candlestick chart
chart = tvl.candlestick(
    ohlc_table,
    timestamp="Timestamp",
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
    crosshair=tvl.crosshair(mode="magnet"),
    time_scale=tvl.time_scale(time_visible=True),
)
```

## Docs

User-facing documentation lives in [`docs/`](./docs/README.md) and follows
the same structure plotly-express does: one Markdown page per chart type and
concept, ending with a `## API Reference` block that `dhautofunction` expands
from the Python docstrings.

### Build the docs locally

From this plugin's directory (`plugins/tradingview-lightweight/`):

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

### Doc snapshots

TVL has none. `docker-compose.docs-snapshots.yml` — which backs
`npm run update-doc-snapshots` and `plugin_builder.py --snapshots` — names only
`ui` and `plotly-express` in its extractor, snapshotter, and validator
services, so running either is a no-op for this plugin.

An earlier `docs/snapshots/` directory was removed: it had been produced by
out-of-repo tooling, nothing in CI could regenerate or validate it, and the
chart entries pointed at PNGs in a form Salmon has no renderer for. Wiring TVL
into the shared pipeline is follow-up work; snapshots should come back from
that pipeline rather than by hand.
