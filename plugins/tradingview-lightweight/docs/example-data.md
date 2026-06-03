# Example data

The Deephaven TradingView Lightweight package includes several built-in, deterministically generated tables for testing and example code. Each function returns a fresh `deephaven.table.Table` whose values are produced by closed-form expressions (no random data), so snapshot tests stay stable across runs.

Import the module under the `tvl` alias and call any of the functions below — every chart-type page in this documentation builds its examples on these fixtures.

## ohlc

A 90-row daily OHLCV table with a precomputed `Ema` column. Each row is one trading day starting 2024-01-01; Open / High / Low / Close follow a smoothed random walk around 100, Volume is correlated with the per-bar move, and `Ema` is a 20-tick EMA of `Close` for overlay examples. Designed for the `candlestick` and `bar` chart examples.

```python
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.ohlc
```

## stocks

A 120-row multi-symbol trade-style table. Three symbols (`AAA`, `BBB`, `CCC`) are interleaved round-robin via `ii % 3`, each with its own sine-wave price curve so by-grouped examples produce visually distinct series. Designed for the `line` / `area` / `baseline` "by group" examples.

```python
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.stocks
```

## volume

A 60-row single-column volume series. One row per day from 2024-01-01, with Volume around 1000 ± 300 via overlapping sines. Designed for the `histogram` chart examples where a single value column is plotted against time.

```python
import deephaven.plot.tradingview_lightweight as tvl

volume = tvl.data.volume()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.volume
```

## yields

An 11-point yield-curve snapshot. Tenors follow the canonical Treasury set (3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y, 40Y) and are emitted in months (3, 6, 12, 24, 36, 60, 84, 120, 240, 360, 480) — the unit LWC's yield-curve axis expects. The `Yield` column follows a smooth concave curve that rises quickly at the short end, peaks in the belly, and tapers off. Designed for the `yield_curve` chart examples.

```python
import deephaven.plot.tradingview_lightweight as tvl

yields = tvl.data.yields()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.yields
```

## options_chain

A 21-row symmetric options-chain snapshot. Strikes step by 5 from 50 to 150 (at-the-money = 100). Call and put prices follow a simplified intrinsic-plus-time-value shape so the typical "X" pattern of the options chart is visible. Designed for the `options_chart` examples.

```python
import deephaven.plot.tradingview_lightweight as tvl

options_chain = tvl.data.options_chain()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.options_chain
```

## values

A 90-row single-value time series. One row per day from 2024-01-01, with `Value` oscillating around 100 via two superimposed sines. Designed for the simplest `line` / `area` / `baseline` / `histogram` example pages where you want a single column over time.

```python
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.values
```

## large_prices

A 1,000,000-row intraday price series spanning ~10 years. Timestamps step uniformly (~315 seconds per row) starting 2020-01-01; the price curve is a low-frequency sine plus a higher-frequency wiggle, giving the downsampler something visually meaningful to thin out. Designed for the [downsampling](downsampling.md) and [large-data](large-data.md) examples.

```python
import deephaven.plot.tradingview_lightweight as tvl

large_prices = tvl.data.large_prices()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.large_prices
```
