# Deephaven Sample Data

Deterministic sample datasets for [Deephaven](https://deephaven.io). Each function returns a Deephaven table that ticks by default; pass `ticking=False` for a static table. The package only depends on Deephaven and the libraries it already uses, so any plugin or script can use them.

These datasets were previously part of the `deephaven-plugin-plotly-express` package as `deephaven.plot.express.data` and the `deephaven-plugin-tradingview-lightweight` package as `deephaven.plot.tradingview_lightweight.data`, both of which are now deprecated.

## Installation

```sh
pip install deephaven-sample-data
```

## Usage

```python
from deephaven import sample_data

iris = sample_data.iris()
ohlc = sample_data.ohlc(ticking=False)
```

### Available datasets

| Function        | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `iris`          | The classic Iris flower dataset.                                   |
| `jobs`          | Synthetic job/task timeline data, suitable for timeline charts.    |
| `marketing`     | Synthetic marketing funnel data, suitable for funnel charts.       |
| `stocks`        | Synthetic stock trade data across several symbols and exchanges.   |
| `tips`          | The restaurant Tips dataset.                                       |
| `election`      | 2013 Montreal mayoral election results by district.                |
| `wind`          | Wind strength frequencies by direction, suitable for wind roses.   |
| `gapminder`     | Gapminder country statistics, interpolated to monthly values.      |
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

## Data sources

`iris`, `tips`, `election`, `wind` and `gapminder` are based on public datasets that are vendored in this package, with synthetic ticking rows added. See [NOTICE](./NOTICE) for their sources and licenses. The other datasets are generated.

## Migrating from `deephaven.plot.express.data`

Replace `dx.data.<dataset>()` with `sample_data.<dataset>()`:

```python
# Before (deprecated)
from deephaven.plot import express as dx

iris = dx.data.iris()

# After
from deephaven import sample_data

iris = sample_data.iris()
```

## Migrating from `deephaven.plot.tradingview_lightweight.data`

Replace `tvl.data.<dataset>()` with `sample_data.<dataset>()`. `tvl.data.stocks()` is now `sample_data.stock_trades()`, since `sample_data.stocks()` is the Deephaven Express dataset.

```python
# Before (deprecated)
from deephaven.plot import tradingview_lightweight as tvl

trades = tvl.data.stocks()

# After
from deephaven import sample_data

trades = sample_data.stock_trades()
```
