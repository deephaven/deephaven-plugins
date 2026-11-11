# Deephaven Sample Data

Deterministic sample datasets for [Deephaven](https://deephaven.io). Each function returns a Deephaven table that ticks by default; pass `ticking=False` for a static table. The datasets only depend on Deephaven itself, so any plugin or script can use them.

## Installation

```sh
pip install deephaven-sample-data
```

## Usage

```python
from deephaven import sample_data

stocks = sample_data.stocks()
ohlc = sample_data.ohlc(ticking=False)
```

### Available datasets

| Function        | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `jobs`          | Synthetic job/task timeline data, suitable for timeline charts.    |
| `marketing`     | Synthetic marketing funnel data, suitable for funnel charts.       |
| `stocks`        | Synthetic stock trade data across several symbols and exchanges.   |
| `fish_market`   | Synthetic fish market data.                                        |
| `outages`       | Synthetic power outage data with locations, suitable for maps.     |
| `flights`       | Synthetic flight path data with locations, suitable for maps.      |
| `ohlc`          | Daily OHLCV bars with a precomputed EMA column.                    |
| `stock_trades`  | Trade-style rows across three symbols with separate price levels.  |
| `volume`        | Daily volume bars on a repeating heavy/light cycle.                |
| `yields`        | An 11-point Treasury yield curve, refreshing in place.             |
| `options_chain` | A 21-strike options chain with call and put quotes.                |
| `values`        | Daily rows of a single `Value` column moving around 100.           |
| `large_prices`  | A 1,000,000-row price series for downsampling demos.               |

The `OUTAGE_CENTER` and `FLIGHT_CENTER` constants provide map centers for the `outages` and `flights` datasets.

Setting the environment variable `DEEPHAVEN_PLUGINS_STATIC_DATA=1` forces `ohlc`, `stock_trades`, `volume`, `yields`, `options_chain`, `values` and `large_prices` to be static.

Deephaven Express (`deephaven-plugin-plotly-express`) re-exports `jobs`, `marketing`, `stocks`, `fish_market`, `outages` and `flights` from `deephaven.plot.express.data`, alongside datasets built from plotly's bundled data.

## Migrating from `deephaven.plot.tradingview_lightweight.data`

The TradingView Lightweight example tables have moved here, and `deephaven.plot.tradingview_lightweight.data` is deprecated. Replace `tvl.data.<dataset>()` with `sample_data.<dataset>()`. `tvl.data.stocks()` is now `sample_data.stock_trades()`, since `sample_data.stocks()` is the Deephaven Express dataset.

```python
# Before (deprecated)
from deephaven.plot import tradingview_lightweight as tvl

trades = tvl.data.stocks()

# After
from deephaven import sample_data

trades = sample_data.stock_trades()
```
