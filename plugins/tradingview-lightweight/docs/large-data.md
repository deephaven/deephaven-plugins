<!-- coverage-seen-elsewhere:
  large_prices -> example-data.md
  values -> example-data.md
  auto_bin -> autobin.md
  bin_width -> autobin.md
-->

# Large Data

TVL is designed to chart tables that don't fit in the browser. This page is the orientation guide for working with multi-million-row tables: where the performance crossover lies, what costs each path adds, and how to pick between the two server-side strategies (min/max downsampling and aggregation autobinning).

The short version: for **Line / Area / Baseline series**, use the automatic min/max [downsampling](downsampling.md) path. For **Histogram / Candlestick / Bar series**, use [autobinning](autobin.md). Both run in the Deephaven query engine and ship only the post-aggregation buckets to the browser.

## What does "large" mean here?

- **Small (no downsampling needed):** Roughly the chart's pixel width × 1 row per pixel. For an 1800-pixel-wide chart, that's a few thousand rows. Below this, the renderer can draw every point without breaking a sweat.
- **Medium:** Tens of thousands to ~100k rows. Downsampling activates, but the cost is dominated by network ship time. Interactive performance is good.
- **Large:** 100k to several million rows. Both paths shine here — server-side aggregation reduces to ~viewport-width buckets, which is the actual data the renderer needs.
- **Huge:** 10M+ rows. Aggregations are still fast (Deephaven's engine is column-oriented and parallel), but you want to think about query-engine cost as well as render cost.

## What are the costs?

| Cost                       | Where it lives                       | Driven by                                              |
| -------------------------- | ------------------------------------ | ------------------------------------------------------ |
| Aggregation (server-side)  | Deephaven engine                     | Row count × bin reduction complexity                   |
| Serialization              | Server → client wire                 | Bin count (not row count after aggregation)            |
| Client-side rendering      | Browser, lightweight-charts          | Bin count, viewport pixel width, animation frame rate  |
| Re-aggregation on pan/zoom | Engine + wire                        | Bin count budget, range listener thresholds            |

The big win of the server-side paths is that **serialization and rendering cost scale with bin count, not row count**. A 10M-row table downsampled to a 2000-pixel-wide chart serializes ~2000 buckets — the same size as a 2000-row table without downsampling.

## Downsampling vs. autobinning: when to use which

| Series type | Path | Why |
|---|---|---|
| Line, Area, Baseline | Min/max downsampling | Min/max-per-pixel preserves spikes; cheaper than full aggregation |
| Candlestick, Bar | Autobinning (OHLC reduction) | OHLC requires first/max/min/last per bin |
| Histogram | Autobinning (sum/count/avg/last) | Bars need a true reduction; min/max would lose meaning |

You don't usually have to pick — `tvl.line()` uses downsampling, `tvl.histogram()` uses autobinning, etc. The choice is determined by the chart type.

## Examples

### Plot a 1M-row line with one call

`tvl.data.large_prices()` is a 1M-row intraday price fixture. The chart needs no special configuration — downsampling activates automatically.

```python order=chart,large
import deephaven.plot.tradingview_lightweight as tvl

large = tvl.data.large_prices()

chart = tvl.line(large, timestamp="Timestamp", value="Price")
```

Drag-zoom into a small window: the chart refetches a finer aggregation. Click "reset zoom" (double-click an axis if `handle_scale_axis_double_click_reset` is on): the coarse view returns.

### Autobin a histogram over a large table

For a histogram on a large table, switch to `tvl.histogram()` and let autobinning pick the bin width. Use `bin_count=` to control density without committing to a specific duration.

```python order=chart,large
import deephaven.plot.tradingview_lightweight as tvl

large = tvl.data.large_prices()

chart = tvl.histogram(
    large,
    timestamp="Timestamp",
    value="Price",
    auto_bin=True,
    bin_count=200,
    agg="avg",
)
```

The engine aggregates 1M rows down to ~200 average-per-bin rows; the chart renders 200 bars.

### Force a specific bin width

When you want a known cadence (e.g. "daily" or "hourly") regardless of viewport width, set `bin_width` explicitly. See [autobin](autobin.md) for the supported ISO-8601 grammar.

```python order=chart,large
import deephaven.plot.tradingview_lightweight as tvl

large = tvl.data.large_prices()

chart = tvl.histogram(
    large,
    timestamp="Timestamp",
    value="Price",
    auto_bin=True,
    bin_width="P1D",
    agg="sum",
)
```

Daily bins on a 1M-row, 10-year intraday series give ~3650 bars — well above the viewport budget but still cheap to ship and render.

### OHLC autobinning on raw ticks

For an OHLC chart over a tick-level table, autobinning reduces each bin to first/max/min/last. The four reductions happen in a single `agg_by` call in the engine.

```python order=chart,large
import deephaven.plot.tradingview_lightweight as tvl

# Pretend large_prices() is a tick table; build candles at 1-day cadence.
large = tvl.data.large_prices()
large_ohlc = large.update_view([
    "Open = Price",
    "High = Price + 1",
    "Low = Price - 1",
    "Close = Price",
])

chart = tvl.candlestick(
    large_ohlc,
    timestamp="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    auto_bin=True,
    bin_width="P1D",
)
```

OHLC reduction is fixed; the only choice is the cadence.

### Multiple downsampled series on one chart

Each series downsamples independently — overlaying two 1M-row series costs roughly twice as much wire bandwidth, not 1M × 1M. Bucket budgets are per-series.

```python order=chart,large
import deephaven.plot.tradingview_lightweight as tvl

large = tvl.data.large_prices()
shifted = large.update_view(["Price = Price + 10"])

chart = tvl.chart(
    tvl.line(large, timestamp="Timestamp", value="Price", color="#2563eb"),
    tvl.line(shifted, timestamp="Timestamp", value="Price", color="#dc2626"),
)
```

### Tune conflation precompute priority

The conflation pipeline has an optional precompute step. When `precompute_conflation_on_init=True`, the chart kicks off the precomputation as a browser-scheduled task; `precompute_conflation_priority` (typed as the `PrecomputeConflationPriority` Literal alias) tells the scheduler how aggressive that task should be. The three values map directly to the browser `Scheduler.postTask` levels: `"background"` runs whenever the main thread is idle, `"user-visible"` (the default) runs in front of background work, and `"user-blocking"` preempts most other browser work.

```python order=background_chart,visible_chart,blocking_chart,large
import deephaven.plot.tradingview_lightweight as tvl

large = tvl.data.large_prices()

# Let precompute run in the background; cheapest, gives up some warm-up time.
background_chart = tvl.chart(
    tvl.line(large, timestamp="Timestamp", value="Price"),
    enable_conflation=True,
    precompute_conflation_on_init=True,
    precompute_conflation_priority="background",
)

# Default tier — precompute runs ahead of background tasks.
visible_chart = tvl.chart(
    tvl.line(large, timestamp="Timestamp", value="Price"),
    enable_conflation=True,
    precompute_conflation_on_init=True,
    precompute_conflation_priority="user-visible",
)

# Highest priority — best for first-paint latency, costs the most main-thread time.
blocking_chart = tvl.chart(
    tvl.line(large, timestamp="Timestamp", value="Price"),
    enable_conflation=True,
    precompute_conflation_on_init=True,
    precompute_conflation_priority="user-blocking",
)
```

`enable_conflation` and `conflation_threshold_factor` control the conflation pipeline itself; the priority kwarg only matters when `precompute_conflation_on_init=True`.

## Benchmarking notes

The `AGENTS.md` in this plugin has a "Downsample Benchmarking" section describing how to run isolated `dh exec` benchmarks. The headline finding: each approach must run in its own process, because JVM warmup biases later runs. The reference fixture in those benchmarks is 10M rows with three value columns (`Price`, `Volume`, `Spread`), aggregated to 1000 bins.

The benchmark approach lets you compare alternatives — for example, `update_view` + `agg_by` (what TVL uses) against a hand-rolled `where` + `view` chain. For most users, the built-in path is what you want; the benchmarks are there for when you're tuning the engine layer.

To run them: write each candidate as a standalone script under `notes/`, then invoke with `dh exec notes/bench_<name>.py 2>&1 | grep "^RESULT:"`. The `notes/bench_isolated.sh` script automates the run-each-in-its-own-process pattern.

## Picking parameters

A few rules of thumb:

- **Pick `bin_count` to match what you actually want to show.** A bar chart with 200 visible bars is readable; 2000 is mush. Set `bin_count` close to your target density.
- **Use `bin_width` for predictable cadences.** When the chart is meant to show "daily bars," set `bin_width="P1D"` explicitly so the cadence doesn't drift with zoom.
- **Leave `auto_bin=None` on small inputs.** The default tri-state (`None` = auto-detect by size) means small tables skip aggregation, large tables get it. Explicitly setting `True` on small tables wastes a round-trip.

## API Reference

The per-type pages carry the full signature for each chart type that participates in large-data paths:

- [`tvl.line`](line.md#api-reference) — client-side downsampling.
- [`tvl.histogram`](histogram.md#api-reference), [`tvl.candlestick`](candlestick.md#api-reference), [`tvl.bar`](bar.md#api-reference) — server-side autobin.

The chart-level options that govern downsampling live on [`tvl.chart`](chart.md#api-reference).
