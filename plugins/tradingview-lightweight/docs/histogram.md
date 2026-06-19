<!-- coverage-seen-elsewhere:
  markers -> markers.md
  price_lines -> price-lines.md
  marker_spec -> markers.md
  on_press -> events.md
  on_double_press -> events.md
  auto_bin -> autobin.md
  bin_width -> autobin.md
  bin_count -> autobin.md
  crosshair_mode -> styling.md
  time_visible -> time-scale.md
  watermark_text -> watermark.md
-->

# Histogram Chart

A histogram in TVL is a column chart over a time axis: one vertical bar per time bucket, with the bar height set by a server-side aggregation of the rows in that bucket. The classic use is volume — sum the trade size per minute — but the same primitive renders any per-bucket quantity (trade count, average price, last seen value).

What makes the TVL histogram special is *server-side auto-binning*. Hand the chart a million-row trade table and it picks a bin width that matches the screen resolution, computes the aggregation in Deephaven (via `agg_by`), and ships only the rendered bars to the browser. Aggregation is selected with the `agg` parameter (`"sum"`, `"count"`, `"avg"`, `"last"`). The full auto-bin pipeline is documented separately in [autobin](autobin.md).

## What are histogram charts useful for?

- **Volume bars below a price chart**: The canonical use — render aggregated trade size as a histogram in a second pane below the price candles.
- **Per-bucket counts**: Set `agg="count"` to plot trades-per-minute, events-per-second, or any rate quantity directly from the raw event table. The count is computed by Deephaven via `agg_by`, so the browser never sees the raw rows.
- **Tape diagnostics**: A histogram of `last` per bucket is a quick way to see whether your binning matches the data's natural cadence.
- **Color-coded categorical bars**: With `color_column` each bar can be tinted by a per-row category (e.g. side = buy/sell), turning the histogram into a quick categorical breakdown.

## Examples

### A basic volume histogram

`tvl.data.volume()` is a 60-row daily volume table (columns `Timestamp` and `Volume`). Pass the value column explicitly because the chart defaults `value="Value"`; `timestamp` defaults to `"Timestamp"` which already matches.

```python order=histogram,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.volume()

histogram = tvl.histogram(data, timestamp="Timestamp", value="Volume")
```

A single bar rises from the baseline for each row in `data`.

### Customize the bar color

`color` sets a single fill color for every bar. Color kwargs accept a Deephaven theme color (e.g. `"positive"`, `"seafoam-500"`, `"accent-300"`), a hex code (`"#26a69a"`), a named CSS color (`"teal"`), or an `rgb()`/`rgba()` string for transparency. Theme colors adapt automatically when the user switches themes; hardcoded values do not.

```python order=histogram,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.volume()

histogram = tvl.histogram(
    data,
    timestamp="Timestamp",
    value="Volume",
    color="positive",
)
```

All bars are now drawn in the user's theme "positive" color.

### Per-bar colors with `color_column`

`color_column` points at a string column in the table whose values are CSS color strings. The histogram colors each bar with the color in that row — the typical pattern is to tag each row "green" or "red" depending on whether it was a buy or a sell.

```python order=histogram,volume_colored
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.volume()
volume_colored = data.update([
    'BarColor = (Volume > 1000) ? "positive" : "negative"',
])

histogram = tvl.histogram(
    volume_colored,
    timestamp="Timestamp",
    value="Volume",
    color_column="BarColor",
)
```

Bars above 1000 use the theme's `positive` color, the rest use `negative`. As with the chart-level `color` argument, any Deephaven theme color, hex code, named CSS color, or `rgb()`/`rgba()` string is valid. `color` still acts as the fallback if a row has a null in `color_column`.

### Change the aggregation

`agg` selects the server-side reduction used when the histogram bins are larger than one row each — Deephaven runs an `agg_by` per bin so the browser only receives the reduced bars. The options are `"sum"` (default), `"count"`, `"avg"`, and `"last"`.

To see each `agg` produce a visibly different chart, the input table needs *many* rows per bin and *variation* within each bin. `tvl.data.stocks()` ships one trade per day across three symbols, so a two-week bin aggregates ~14 trades.

```python order=hist_sum,hist_count,hist_avg,hist_last,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.stocks()

hist_sum = tvl.histogram(data, timestamp="Timestamp", value="Size", agg="sum", bin_width="P14D", auto_bin=True, title="sum (total per 14 days)")
hist_count = tvl.histogram(data, timestamp="Timestamp", value="Size", agg="count", bin_width="P14D", auto_bin=True, title="count (trades per 14 days)")
hist_avg = tvl.histogram(data, timestamp="Timestamp", value="Size", agg="avg", bin_width="P14D", auto_bin=True, title="avg (mean size per 14 days)")
hist_last = tvl.histogram(data, timestamp="Timestamp", value="Size", agg="last", bin_width="P14D", auto_bin=True, title="last (final size per 14 days)")
```

- `sum` totals every trade size in the bin — the tallest bars, scaled by ~14× the per-trade size.
- `count` is flat at ~14 because the demo trades arrive on a regular cadence.
- `avg` smooths the per-trade noise; with `sum = count × avg` and `count` ≈ constant, `avg` traces the same shape as `sum` at 1/14th the scale.
- `last` ignores the rest of the bin and shows whichever single trade happened to close it — a noisier point sample.

See [autobin](autobin.md) for the full story on when each value is the right pick.

### Set a chart title

`title` is the series legend label and shows up on hover. Use it when the chart is embedded next to other content where "Volume" alone is too generic.

```python order=histogram,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.volume()

histogram = tvl.histogram(data, timestamp="Timestamp", value="Volume", title="Daily traded volume")
```

The legend now reads "Daily traded volume".

## Auto-binning

When the input table is larger than `AUTO_BIN_THRESHOLD` (5000 rows) the histogram automatically aggregates server-side: pick a bin width that maps cleanly to the screen pixel grid, reduce each bin with `agg`, and stream only the resulting bars to the client. You can override the heuristic with three knobs:

- `auto_bin=True` — force auto-bin on, regardless of size.
- `auto_bin=False` — force it off (raw rows; can be slow on big tables).
- `bin_width="PT1M"` — set the bin width directly with an ISO-8601 duration.
- `bin_count=500` — request a target number of bins.

These knobs and the underlying pipeline are documented in detail in [autobin](autobin.md).

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.histogram
```
