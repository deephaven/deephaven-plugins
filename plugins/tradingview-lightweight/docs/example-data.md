# Example data

The Deephaven TradingView Lightweight package ships a handful of built-in tables for examples and tests. Each function returns a fresh `deephaven.table.Table` built from a fixed seed, so the same call always produces the same rows and snapshot tests stay stable across runs.

Import the module under the `tvl` alias and call any of the functions below. Every chart-type page builds its examples on these fixtures.

## Ticking and static tables

Every function takes a `ticking` argument, default `True`. A ticking table starts with a static seed block and then appends one new row per second, so an example updates live on its own. `yields` and `options_chain` refresh in place instead: their values move while the row count stays flat.

Pass `ticking=False` for a static table holding only the seed block. Use it when an example should hold still while you look at it, or when a fixture is big enough that appending to it is wasteful, as with `large_prices`.

```python
import deephaven.plot.tradingview_lightweight as tvl

live = tvl.data.values()  # 90 seed rows, then one row per second
snapshot = tvl.data.values(ticking=False)  # the 90 seed rows only
```

## The `Index` column

Each time-series fixture has an `Index` column: a `long` row counter that starts at zero and keeps counting as rows tick in. Read it when a formula needs a row position. The query-language `ii` pseudo-column is not refresh-safe on a ticking table.

```python
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
weekly = values.where("Index % 7 == 0")
```

The `yields` and `options_chain` snapshots are keyed by tenor and strike rather than by row, so they have no `Index` column.

## ohlc

90 daily OHLCV bars starting 2024-01-01, plus a precomputed `Ema` column (a 20-tick EMA of `Close`) for overlay examples. The `candlestick` and `bar` pages build on it.

Columns: `Timestamp`, `Open`, `High`, `Low`, `Close`, `Volume`, `Ema`, `Index`.

```python
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.ohlc
```

## stocks

360 trade-style rows across three symbols (`AAA`, `BBB`, `CCC`), 120 each, interleaved round-robin. Every symbol has its own price level and volatility, so a by-grouped example draws three clearly separate series. It backs the `line` / `area` / `baseline` "by group" examples.

Columns: `Timestamp`, `Sym`, `Price`, `Size`, `Index`.

```python
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.stocks
```

## volume

60 daily volume bars starting 2024-01-01, on a repeating cycle of heavier and lighter days so the histogram has visible structure. The `histogram` pages use it for a single value column against time.

Columns: `Timestamp`, `Volume`, `Index`.

```python
import deephaven.plot.tradingview_lightweight as tvl

volume = tvl.data.volume()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.volume
```

## yields

An 11-point Treasury yield curve: 3M, 6M, 1Y, 2Y, 3Y, 5Y, 7Y, 10Y, 20Y, 30Y, and 40Y, emitted in months (3, 6, 12, 24, 36, 60, 84, 120, 240, 360, 480), the unit LWC's yield-curve axis expects. The curve slopes upward, steeply at the short end and flattening out past ten years. It feeds the `yield_curve` examples.

Columns: `Tenor`, `Yield`.

```python
import deephaven.plot.tradingview_lightweight as tvl

yields = tvl.data.yields()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.yields
```

## options_chain

A 21-strike options chain with call and put quotes, stepping by 5 from 50 to 150 (at-the-money = 100). Calls fall and puts rise across the strikes, the "X" pattern the `options_chart` examples plot, and spreads widen at the wings.

Columns: `Strike`, `CallBid`, `CallAsk`, `PutBid`, `PutAsk`.

```python
import deephaven.plot.tradingview_lightweight as tvl

options_chain = tvl.data.options_chain()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.options_chain
```

## values

90 daily rows of a single `Value` column moving around 100, starting 2024-01-01. The simplest fixture: the `line` / `area` / `baseline` / `histogram` pages use it whenever an example needs one column over time.

Columns: `Timestamp`, `Value`, `Index`.

```python
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.values
```

## large_prices

A 1,000,000-row price series spanning ~10 years, one row every ~315 seconds from 2020-01-01. The price moves at two scales, a slow drift and a fast wiggle, so the downsampler has something to thin out. Pass `ticking=False` here: a million rows plus a live feed is a lot of table, and the downsampling examples have no use for the feed. It's the fixture behind [downsampling](downsampling.md) and [large-data](large-data.md).

Columns: `Timestamp`, `Price`, `Index`.

```python
import deephaven.plot.tradingview_lightweight as tvl

large_prices = tvl.data.large_prices(ticking=False)
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.data.large_prices
```
