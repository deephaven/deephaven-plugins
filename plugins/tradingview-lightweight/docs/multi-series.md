# Multi-Series Charts

A multi-series TradingView Lightweight chart is a single chart that hosts two or more independent series, for example a candlestick price series with a moving-average line drawn on top. Use it to overlay related data on shared axes rather than stacking it into separate panes.

There are two ways to end up with multiple series. The explicit pattern, used for most of this page, is to call one per-type constructor per series to build a single-series TvlChart and pass them positionally to [`tvl.chart()`](#api-reference); use this when you mix series *types* or pull series from different tables. The shortcut, when the series share a type and a single table and differ only by a partition column, is to pass `by="Column"` to one constructor and let the chart fan it out into one series per key (see [Create one series per group with `by`](#create-one-series-per-group-with-by) below). Either way there is no `add_series()` method on `TvlChart`; series are immutable once the chart is constructed.

<!-- coverage-seen-elsewhere:
  pane_index -> multi-pane.md
  price_scale_id -> multiple-axes.md
  default_visible_price_scale_id -> multiple-axes.md
  pane_stretch_factors -> multi-pane.md
  pane_preserve_empty -> multi-pane.md
  watermark_* -> watermark.md
  markers -> markers.md
  price_lines -> price-lines.md
  marker_spec -> markers.md
  price_format -> price-formats.md
  *_formatter -> price-formats.md
  base_resolution / minimum_time_range / start_time_range -> yield-curve.md
  auto_bin / bin_width / bin_count / agg -> autobin.md
-->

## What are multi-series charts useful for?

- **Overlaying indicators**: Plot a moving average, VWAP, or Bollinger band on top of a candlestick chart so traders can read price and signal together.
- **Comparing instruments**: Show two line series on a single axis to compare prices for related symbols (e.g. an ETF and its benchmark).
- **Mixing chart types**: Combine a candlestick body with a histogram volume series so price action and traded size share a horizontal time scale.
- **Layering events on data**: Use markers and price lines on the same series to annotate trades or thresholds without losing the underlying price curve.

## Examples

### Pick the chart-type backend explicitly

`tvl.chart()` accepts a `chart_type` kwarg, typed as the `ChartType` literal alias. The default value is `"standard"`, which is what every example below relies on. The other three values (`"yield_curve"`, `"options"`, and `"custom_numeric"`) are already used by the convenience factories `tvl.yield_curve()`, `tvl.options_chart()`, and `tvl.custom_numeric()`, so you rarely call `chart()` with them directly; mostly you set `chart_type="standard"` explicitly when you want to lock the backend against future default changes.

```python order=chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

# chart_type defaults to "standard"; the other values ("yield_curve",
# "options", "custom_numeric") are surfaced via tvl.yield_curve(),
# tvl.options_chart(), and tvl.custom_numeric() respectively.
chart = tvl.chart(
    tvl.candlestick(ohlc),
    chart_type="standard",
)
```

### Build a chart from a list of series

`tvl.chart()` takes one or more TvlChart objects as positional arguments. Each per-type constructor binds a Deephaven table to a series type, with no plotting until `tvl.chart()` is called.

```python order=multi_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(
    ohlc, timestamp="Timestamp", open="Open", high="High", low="Low", close="Close",
)
volume = tvl.histogram(
    ohlc, timestamp="Timestamp", value="Volume", color="rgba(76,175,80,0.5)",
)

multi_chart = tvl.chart(price, volume)
```

Both series share one chart: they sit on the same time axis and the same price axis by default. Push the volume to a separate pane or scale using `pane` or `price_scale_id` (see [multi-pane](multi-pane.md) and [multiple-axes](multiple-axes.md)).

### Overlay a moving-average line on a candlestick

The "price + indicator" pattern: a candlestick series for the bars and a line series for a derived signal. The line is computed in a Deephaven `update_view` so it ticks along with the source table.

```python order=overlay_chart,ohlc_with_sma,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()
ohlc_with_sma = ohlc.update_view([
    "Sma = (Close + Close_[i-1] + Close_[i-2]) / 3",
])

bars = tvl.candlestick(ohlc_with_sma)
sma = tvl.line(
    ohlc_with_sma, timestamp="Timestamp", value="Sma",
    color="#ff9800", line_width=2,
)

overlay_chart = tvl.chart(bars, sma, watermark_text="Price + SMA(3)")
```

The candlestick TvlChart provides the price axis; the SMA line draws on the same scale.

### Compare two line series on one axis

For pure comparison, build one `line` per group and pass both to `tvl.chart()`. Each series is given an explicit `title` so the legend distinguishes them.

```python order=compare_chart,aaa,bbb,stocks
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()
aaa = stocks.where("Sym = `AAA`")
bbb = stocks.where("Sym = `BBB`")

s_aaa = tvl.line(aaa, timestamp="Timestamp", value="Price",
                       color="#1976d2", title="AAA")
s_bbb = tvl.line(bbb, timestamp="Timestamp", value="Price",
                       color="#d32f2f", title="BBB")

compare_chart = tvl.chart(s_aaa, s_bbb)
```

Two line series share one chart, one time axis, and one price axis.

### Mix a line with a histogram

A line series plotted against a histogram series is useful when you need to read a continuous quantity (price) against a discrete count (volume) on a shared time axis.

```python order=mix_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

closes = tvl.line(ohlc, timestamp="Timestamp", value="Close",
                        color="#2e7d32", line_width=2)
vols = tvl.histogram(ohlc, timestamp="Timestamp", value="Volume",
                            color="rgba(120,120,120,0.45)",
                            price_scale_id="vol")

mix_chart = tvl.chart(closes, vols)
```

The histogram lives on an overlay scale (`price_scale_id="vol"`) so its magnitudes don't crush the line's price range. See [multiple-axes](multiple-axes.md) for the full pattern.

### Create one series per group with `by`

The comparisons above build each series by hand, one constructor call per symbol. When the series differ only by a partition key in a single table, set `by` to that column instead and the chart draws one series per unique value, auto-assigning each a distinct color from the user's theme palette. New keys that show up at runtime (in a ticking table) add new series on the fly.

`by` is accepted by every per-type constructor (`tvl.line`, `tvl.area`, `tvl.baseline`, `tvl.candlestick`, `tvl.bar`, `tvl.histogram`), so this single-table-to-many-series shortcut works regardless of series type.

```python order=by_chart,stocks
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()

# One line per symbol, colored automatically — no per-series construction.
by_chart = tvl.line(stocks, timestamp="Timestamp", value="Price", by="Sym")
```

`tvl.data.stocks()` is a three-symbol (`AAA`, `BBB`, `CCC`) walk, so this single `tvl.line` call yields three independently colored series on one axis, the same result as the [two-line comparison](#compare-two-line-series-on-one-axis) above, but driven by the data rather than spelled out series by series. For per-type notes on `by`, see [line](line.md#one-line-per-group-with-by) and [area](area.md#one-area-per-group-with-by).

## API Reference

For the full `tvl.chart` signature, see the [Chart container](chart.md#api-reference) page. The per-type constructor signatures (`tvl.line`, `tvl.candlestick`, `tvl.area`, `tvl.bar`, `tvl.baseline`, `tvl.histogram`) live on their own pages.
