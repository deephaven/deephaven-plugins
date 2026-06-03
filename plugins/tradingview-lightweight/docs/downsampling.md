<!-- coverage-seen-elsewhere:
  auto_bin -> autobin.md
  bin_width -> autobin.md
  bin_count -> autobin.md
  large_prices -> example-data.md
-->

# Downsampling

Downsampling is what makes TVL feel fluid on multi-million-row tables. The Line, Area, and Baseline series automatically thin out points as the user pans and zooms so the renderer never tries to draw more bars than the chart has pixels — yet the visible curve still includes every local minimum and maximum, so spikes and dips never disappear.

This page is the conceptual reference: what downsampling is, when it kicks in, how to tune it, and (briefly) when to turn it off.

## What is downsampling useful for?

- **Smooth interaction on big tables**: A 1M-row line is unplayable if every pan ships 1M points to the browser; downsampling brings it down to ~viewport-width points and keeps interaction snappy.
- **Faithful min/max preservation**: The downsampler picks the highest and lowest point in each pixel column, so a tall single-row spike survives even when nine of its neighbors are dropped.
- **Zero authoring cost**: There's no separate "downsampled chart" mode — write `tvl.line(table, ...)` against a 1M-row table and it Just Works.
- **Whitespace fills**: Recent commits (`62c568ea`, `f45886bb`) add whitespace-aware aggregation so leading/trailing gaps don't compress the visible region.

## How it activates

TVL has two server-side / client-side cooperating paths:

1. **JS-side viewport downsampling** (Line / Area / Baseline). When a series has more points than the viewport has bars, the client requests a downsampled view from the server, asking for "give me the min and the max for each pixel column in the visible time range." The aggregation runs in the Deephaven query engine via `agg_by` with `first` / `last` / `sorted_first` / `sorted_last` reductions per bucket. On pan and zoom the client re-requests with the new range; on data ticks the buckets refresh.
2. **Server-side autobinning** (Candlestick / Bar / Histogram). OHLC and histogram series can't be downsampled by min/max — they need a true aggregation. See [autobin](autobin.md) for that path.

> **Numeric-axis charts don't downsample.** Viewport downsampling is gated to `chart_type == "standard"` and reads a hard-coded `time` column. `tvl.custom_numeric`, `tvl.options_chart`, and `tvl.yield_curve` therefore ship raw rows to the client — keep their input tables modest (tens of thousands of rows) or pre-aggregate server-side.

### What activates it

- **Row count threshold.** Tables with more rows than the downsampler's per-series budget activate the path automatically. The exact threshold is the chart's pixel width (rounded up to a 1000-pixel bucket for cache friendliness) divided by the target bar-pixel-width.
- **Viewport width.** The client tells the server how many pixels wide the chart is; the server returns at most ~one bucket per pixel.
- **Whitespace edges.** When the visible window doesn't cover the entire table, the server returns the body of the visible range at full resolution plus single "anchor" rows at the head and tail so `fix_left_edge` / `fix_right_edge` have something to clamp against.

## What it preserves

For Line / Area / Baseline series, each bucket reduces to (at most) four points: first time, last time, sorted-first value, sorted-last value. That guarantees:

- **The min and the max of every bucket survive.** Spikes are not averaged away.
- **The bucket boundaries are real data points**, not interpolated midpoints — so hovering still shows actual timestamps and values.
- **Vertical order is preserved within each bucket** by drawing the four points in time order, so the rendered polyline respects the rise/fall of the underlying data.

For OHLC and histogram series, downsampling reduces each bucket via `first(open)`, `max(high)`, `min(low)`, `last(close)` (candlestick / bar) or `sum` / `count` / `avg` / `last` (histogram) — see [autobin](autobin.md).

## Examples

### A 1M-row line chart

The `tvl.data.large_prices()` fixture is a 1,000,000-row intraday price series. Plotting it with `tvl.line()` works exactly like plotting a 100-row table — TVL handles the downsampling transparently.

```python order=chart,large
import deephaven.plot.tradingview_lightweight as tvl

large = tvl.data.large_prices()

chart = tvl.line(large, timestamp="Timestamp", value="Price")
```

Pan and zoom the chart: the curve refines as you zoom in. Local minima and maxima stay visible at every zoom level.

### Compare a small vs. large table

Plot the same series on a small (`values()`) and a large (`large_prices()`) table side by side. The small table is below the downsampler's threshold and renders every point as-is; the large table is downsampled, but visually the curve is faithful.

```python order=small_chart,large_chart,values,large
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
large = tvl.data.large_prices()

small_chart = tvl.line(values, timestamp="Timestamp", value="Value")
large_chart = tvl.line(large, timestamp="Timestamp", value="Price")
```

The threshold matters but is rarely the thing you tune — chart width drives it more than row count, and the chart sizes to its container automatically.

### Combine downsampling with multiple overlays

Multiple series each downsample independently — overlaying a fine-grained line and a coarse moving average doesn't push either off the optimal path. Each series' bucket budget is its own.

```python order=chart,large
import deephaven.plot.tradingview_lightweight as tvl

large = tvl.data.large_prices()

chart = tvl.chart(
    tvl.line(large, timestamp="Timestamp", value="Price", color="#2563eb"),
    tvl.line(
        large.update_view(["Price = Price + 5"]),
        timestamp="Timestamp",
        value="Price",
        color="#dc2626",
    ),
)
```

Both lines stay smooth under interaction; each gets its own server-side aggregation.

### Use bar spacing to control downsampling density

`bar_spacing` (pixels per bar) and `min_bar_spacing` / `max_bar_spacing` (zoom limits) shape the downsampler's bucket size indirectly. Larger `bar_spacing` means fewer buckets per pixel, which gives the renderer more breathing room.

```python order=chart,large
import deephaven.plot.tradingview_lightweight as tvl

large = tvl.data.large_prices()

chart = tvl.chart(
    tvl.line(large, timestamp="Timestamp", value="Price"),
    bar_spacing=4,
    min_bar_spacing=1,
    max_bar_spacing=20,
)
```

These knobs matter most when the rendered bars start dropping below a single pixel — bump `min_bar_spacing` to keep them visible.

## Turning it off (and why you probably shouldn't)

There is no chart-level "disable downsampling" boolean for Line / Area / Baseline series. The reason is that disabling it is almost always wrong:

- **Browsers can't render 1M points in a polyline at 60fps.** Even on fast hardware, building and laying out the SVG / canvas path is bottlenecked on point count.
- **The downsampled view is faithful.** Min and max per bucket survive — the only thing you lose is rendering every individual point, which the chart couldn't show anyway because each one is sub-pixel.

If you have a table that's small enough that downsampling wouldn't help and you don't want to pay the round-trip overhead, just plot the table directly — TVL only activates the downsampling path when the chart pixel budget is smaller than the row count.

For OHLC and histogram series, the equivalent toggle exists (`auto_bin=False`) — see [autobin](autobin.md). The same advice applies: disable it only when the table is already small.

## Tunables

The downsampler is mostly automatic, but a few knobs on `chart()` and the series factories influence it:

- **`width` / `height` on `chart()`** — pin the pixel budget, which sets the bucket target.
- **`bar_spacing` / `min_bar_spacing` / `max_bar_spacing`** — pixels per bar, which drives the bucket count.
- **`auto_bin` / `bin_width` / `bin_count`** (Candlestick / Bar / Histogram) — see [autobin](autobin.md).
- **`fix_left_edge` / `fix_right_edge`** — anchor the visible range to the data edges. The downsampler emits single-row anchors at the head and tail when the visible window is strictly inside the data range so these clamps work.

For benchmarking comparisons (server-side autobin vs. client-side rendering cost), see [large-data](large-data.md).

## API Reference

The downsample-related options (`downsample`, `downsample_threshold`, `downsample_target_buckets`, `downsample_min_pixel_step`) live on [`tvl.chart`](chart.md#api-reference). For the line-specific surface, see [`tvl.line`](line.md#api-reference).
