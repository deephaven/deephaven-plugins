<!-- coverage-seen-elsewhere:
  large_prices -> example-data.md
  values -> example-data.md
  volume -> example-data.md
-->

# Autobinning

Autobinning is TVL's server-side time-bucket aggregation for histograms, candlesticks, and bars. Unlike the min/max downsampling used by Line / Area / Baseline (see [downsampling](downsampling.md)), OHLC and histogram series can't be thinned out by dropping points — they need true aggregation. Autobinning runs that aggregation in the Deephaven query engine: `update_view` to compute a bin column, `agg_by` to reduce, snap the result back to the original time column name, and ship it to the chart.

Use this page when you have a high-rate tick stream and want a histogram or candlestick chart over an automatically-chosen bin width — or when you want to override the chosen bin width manually.

## What is autobinning useful for?

- **Histograms over raw ticks**: A raw trade stream can be aggregated server-side to per-minute volume bars without writing the binning by hand.
- **Candle / bar charts at arbitrary cadences**: Pass a raw price tick table; the chart aggregates first/max/min/last per bin for you.
- **Zoom-responsive cadence**: As the user zooms in, the bin width auto-refines to a finer "nice" duration so the chart stays informative without showing sub-pixel bars.
- **Server-side cost**: All aggregation happens in the Deephaven engine, so the browser never sees the raw ticks.

## API surface

Every aggregating series — `histogram`, `histogram`, `candlestick`, `candlestick`, `bar`, `bar` — accepts three parameters:

| param | meaning |
|---|---|
| `auto_bin` | Tri-state: `None` (default) auto-detects; `True` forces autobinning on; `False` opts out. |
| `bin_width` | ISO-8601 duration override (e.g. `"PT1S"`, `"PT5M"`, `"PT1H"`, `"P1D"`). |
| `bin_count` | Target number of bins (default 5000). |
| `agg` | (Histogram only) Reduction mode: `"sum"`, `"count"`, `"avg"`, `"last"`. |

Default policy: when `auto_bin is None`, the chart auto-enables binning if the input table exceeds the `AUTO_BIN_THRESHOLD` (5000 rows). When `auto_bin=True`, binning is forced regardless of row count. When `auto_bin=False`, the chart uses the table as-is and assumes it's already aggregated.

## Algorithm

The source of truth is `src/deephaven/plot/tradingview_lightweight/auto_bin.py`. The pipeline is:

1. **`target_bins_for_width(width_px, actual_width_px)`** — compute the number of bins the chart can usefully show, based on the chart's pixel width and a target bar-pixel-width of `BAR_PX = 8`. Defaults to `TARGET_BINS = DEFAULT_WIDTH_PX // BAR_PX = 2000 // 8 = 250` when the width isn't known. Clamps by `actual_width_px / MIN_BAR_PX (=5)` so each bar stays above 5px even when the cached pixel-width-bucket overshoots.
2. **`nice_bin_width(range_ns, target_bins)`** — divide the time range by the target bin count, then snap the result up to the next "nice" duration from `NICE_BIN_WIDTHS_NS` (1ns, 100ns, 1µs, 100µs, 1ms, 10ms, 100ms, 1s, 5s, 15s, 30s, 1m, 5m, 15m, 30m, 1h, 4h, 12h, 1d, 7d, 30d, 90d, 365d).
3. **`build_histogram_view` / `build_ohlc_view`** — apply `upperBin(time, bin_width)` then `agg_by` over each bin, restore the time column name, sort by time. When the visible window is strictly inside the data range, the view is built as `head_anchor + body + tail_anchor` so `fix_left_edge` / `fix_right_edge` have something to clamp to.

The visible range listener triggers a re-aggregation when the bin count drifts outside the range `[MIN_VISIBLE_BINS=80, target_bins * MAX_VISIBLE_BINS_RATIO=2x]`.

## Examples

### Build a histogram over a value-time series

Pass a raw value-by-time table to `histogram()`. With default `auto_bin=None` and a small (90-row) `tvl.data.values()` table, autobinning stays off and each row becomes a bar. Force `auto_bin=True` to opt in.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.histogram(values, timestamp="Timestamp", value="Value", auto_bin=True, agg="sum")
```

Without `auto_bin=True`, the small table renders without aggregation; the parameter is most useful on tables that genuinely tick fast.

### Override the bin width

Set `bin_width` to an ISO-8601 duration string (`"PT5M"` = 5 minutes; `"P1D"` = 1 day) to force a specific cadence. This bypasses `nice_bin_width()` and uses the duration exactly.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.histogram(
    values,
    timestamp="Timestamp",
    value="Value",
    auto_bin=True,
    bin_width="P1D",
    agg="sum",
)
```

Valid duration patterns: `PnD`, `PTnHnMnS` — e.g. `"PT1S"`, `"PT5M"`, `"PT1H"`, `"P1D"`.

### Override the bin count

`bin_count` sets the target number of bins; the algorithm divides the data's time range by `bin_count` and snaps the result up to a "nice" duration. Use it to control density without committing to a specific cadence.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.histogram(
    values,
    timestamp="Timestamp",
    value="Value",
    auto_bin=True,
    bin_count=20,
    agg="sum",
)
```

`bin_count` and `bin_width` are mutually exclusive in effect — if both are set, `bin_width` wins.

### Pick an aggregation reduction

The `agg` parameter on `histogram` / `histogram` selects the per-bin reduction. `"sum"` (default) sums the value column; `"count"` counts the rows per bin (the value column is ignored for the reduction); `"avg"` averages; `"last"` takes the most recent value per bin.

```python order=sum_chart,count_chart,avg_chart,last_chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

sum_chart = tvl.histogram(values, timestamp="Timestamp", value="Value", auto_bin=True, agg="sum")
count_chart = tvl.histogram(values, timestamp="Timestamp", value="Value", auto_bin=True, agg="count")
avg_chart = tvl.histogram(values, timestamp="Timestamp", value="Value", auto_bin=True, agg="avg")
last_chart = tvl.histogram(values, timestamp="Timestamp", value="Value", auto_bin=True, agg="last")
```

Use `"sum"` for volume bars; `"count"` for trade counts; `"avg"` for mid-price binning; `"last"` for last-tick-per-bin snapshots.

### Aggregating OHLC bars

Candlestick and bar charts use a fixed reduction — `first(open)`, `max(high)`, `min(low)`, `last(close)` per bin. The `agg` parameter doesn't exist here. Use `auto_bin=True` and `bin_width=` to control the cadence.

```python order=chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

chart = tvl.candlestick(ohlc, auto_bin=True, bin_width="P1D")
```

For high-rate tick input, this is the canonical way to render a candle chart at a user-selected cadence.

### Opt out of autobinning

`auto_bin=False` disables the path entirely — the chart consumes the input table as-is. Use this when you've already aggregated upstream (e.g. via a Deephaven `time_window` view) and don't want the chart to re-aggregate.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.histogram(values, timestamp="Timestamp", value="Value", auto_bin=False)
```

Be aware: with `auto_bin=False` on a large raw tick table, the browser receives every row, and rendering performance degrades.

## Current status

`notes/todo.md` previously noted "autobin histogram not working yet." Inspecting `auto_bin.py` against the current series wiring, the `build_histogram_view` and `build_ohlc_view` functions are fully implemented (whitespace-anchored head/body/tail merge, ISO-8601 parsing, nice-bin-width snapping). The recent commits `62c568ea` ("whitespace downsample works okay") and `f45886bb` ("autobin histogram") indicate the path landed. The Python-side aggregation is wired through `histogram` (line 984+ of `series.py` references `HIST_AGGS`) and through both `candlestick` and `bar`. End-to-end the path appears working as of the current commit; if you hit a regression, file an issue and capture the relevant `auto_bin.py` invocation in the bug report.

## How tunables compose

- **`width` on `chart()`** indirectly controls `target_bins_for_width`, since the client passes the chart's pixel width to the server's `target_bins` computation.
- **`bin_count`** overrides the computed target.
- **`bin_width`** bypasses the snapping logic and uses the user's duration directly.
- **`fix_left_edge` / `fix_right_edge`** are honored — the head/tail anchor rows give them something to clamp to even when the visible window is inside the data range.

For the cost trade-offs (server-side aggregation vs. client-side rendering), see [large-data](large-data.md).

## API Reference

The `auto_bin`, `bin_width`, `bin_count`, and `agg` parameters are accepted by each binnable chart type. See the per-type API references for the full signatures:

- [`tvl.histogram`](histogram.md#api-reference)
- [`tvl.candlestick`](candlestick.md#api-reference)
- [`tvl.bar`](bar.md#api-reference)
