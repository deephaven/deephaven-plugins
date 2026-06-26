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
  visible -> titles-legends.md
  last_value_visible -> titles-legends.md
  price_scale_id -> price-scale.md
  price_format -> price-formats.md
  price_line_visible -> price-lines.md
  price_line_source -> price-lines.md
  price_line_width -> price-lines.md
  price_line_color -> price-lines.md
  price_line_style -> price-lines.md
  base_line_visible -> price-scale.md
  base_line_color -> price-scale.md
  base_line_width -> price-scale.md
  base_line_style -> price-scale.md
  auto_scale -> price-scale.md
  scale_margin_top -> price-scale.md
  scale_margin_bottom -> price-scale.md
  scale_mode -> price-scale.md
  scale_invert -> price-scale.md
  scale_align_labels -> price-scale.md
  scale_border_visible -> price-scale.md
  scale_border_color -> price-scale.md
  scale_text_color -> price-scale.md
  scale_entire_text_only -> price-scale.md
  scale_visible -> price-scale.md
  scale_ticks_visible -> price-scale.md
  scale_minimum_width -> price-scale.md
  scale_ensure_edge_tick_marks_visible -> price-scale.md
  pane -> multi-pane.md
  by -> multi-series.md
-->

# Candlestick Chart

A candlestick chart shows the open, high, low, and close (OHLC) of a price series as a stack of rectangular bodies with thin "wick" lines, giving a compact view of where price ranged within each interval. Use it when you have time-bucketed OHLC bars and need to read direction and range at a glance.

In a bullish (up) candle the close sits above the open and the body is typically rendered green; in a bearish (down) candle the close sits below the open and the body is typically red. The wick (or "shadow") extends from the body to the period's high and low, so wick length communicates intra-bar volatility.

## What are candlestick charts useful for?

- **Reading short-term price action**: Bodies and wicks make direction and intra-bar range readable at a glance, which is why candlesticks are common on technical-analysis screens.
- **Spotting reversal and continuation patterns**: Many classical patterns (engulfings, hammers, dojis) rely on the relative size of body and wicks, and candlesticks are the only chart type that surfaces both.
- **Comparing volatility regimes**: Long wicks with small bodies signal indecision; tall bodies with short wicks signal momentum. Switching between regimes is easy to see.
- **Confirming aggregations**: Because TVL aggregates OHLC server-side when the table is large, a candlestick chart is also a quick check that your binning matches what you expected.

## Examples

### A basic candlestick chart

Hand the chart a Deephaven table that already contains OHLC columns and the rest is automatic. The defaults (`timestamp="Timestamp"`, `open="Open"`, `high="High"`, `low="Low"`, `close="Close"`) match the columns produced by `tvl.data.ohlc()`, so for the demo dataset you only need the table itself.

```python order=candlestick,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

candlestick = tvl.candlestick(data)
```

Each candle covers one row in `data`; green bodies are up days and red bodies are down days. `tvl.candlestick()` doesn't carry the last-price pulse animation that line / area / baseline series do. See [line](line.md) and [styling](styling.md) for the `LastPriceAnimationMode` examples.

When `up_color` / `down_color` are not provided, the chart adapts to the active theme automatically. Light and dark themes both render correctly without code changes.

### Map non-default OHLC column names

If your table uses different column names, for example lowercase columns coming from a feed or a different timestamp column, pass them explicitly. Every column kwarg is just a string column name.

```python order=candlestick,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc().rename_columns(["Ts=Timestamp", "O=Open", "H=High", "L=Low", "C=Close"])

candlestick = tvl.candlestick(
    data,
    timestamp="Ts",
    open="O",
    high="H",
    low="L",
    close="C",
)
```

### Customize up and down colors

Override the default green/red palette with `up_color` and `down_color`. Use this to match a brand palette, build a color-blind-friendly variant, or to dim the candles before overlaying markers and price lines.

```python order=candlestick,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

candlestick = tvl.candlestick(
    data,
    up_color="seafoam-800",
    down_color="magenta-600",
)
```

All color kwargs (`up_color`, `down_color`, `border_*_color`, `wick_*_color`) accept a Deephaven theme color (e.g. `"seafoam-800"`, `"accent-300"`), a hex code (`"#1f8a70"`), a named CSS color (`"crimson"`), or an `rgb()`/`rgba()` string for transparency. Theme colors adapt automatically when the user switches themes; hardcoded values do not. Leaving the up/down colors unset inherits the active theme's OHLC palette.

### Outline-only candles via border colors

`border_up_color` and `border_down_color` set the outline color of each candle independently of the body fill. Setting a border to `"transparent"` removes that border entirely, leaving only the body fill. Combine this with a neutral body fill and a single visible up border to get a "pavement" two-tone candle.

```python order=candlestick,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

candlestick = tvl.candlestick(
    data,
    up_color="gray-500",
    down_color="gray-500",
    border_up_color="gray-500",
    border_down_color="transparent",
)
```

Up candles use a neutral grey throughout; down candles drop their border so only the grey body remains.

### Recolor the wicks

`wick_up_color` and `wick_down_color` set the wick color separately from the body. Use this to dim the wicks while keeping bright bodies (for marker visibility), or to brighten the wicks on a dark background.

```python order=candlestick,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

candlestick = tvl.candlestick(
    data,
    wick_up_color="gray-500",
    wick_down_color="gray-500",
)
```

Both wicks are now grey; the bodies keep their defaults.

### Set the chart title

`title` is the legend label for the series. It appears on hover and in the chart toolbar. Use it whenever you have more than one series on a chart, or when the chart will be embedded somewhere a column name (`Open`/`Close`) is too generic.

```python order=candlestick,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

candlestick = tvl.candlestick(data, title="AAPL daily OHLC")
```

The legend now reads "AAPL daily OHLC" instead of the default series name.

### Server-side autobinning

Hand the chart a large OHLC table and TVL automatically aggregates it server-side into a viewport-friendly number of buckets, picking a "nice" bin width and computing `first(Open)` / `max(High)` / `min(Low)` / `last(Close)` per bin. Override the bucket count or width via `bin_count` / `bin_width`, or set `auto_bin=False` to bypass it entirely for small tables.

```python order=candlestick,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

candlestick = tvl.candlestick(data, auto_bin=True, bin_width="P7D")
```

See [autobin](autobin.md) for the full autobin surface: ISO-8601 duration grammar, when each `auto_bin` value is the right pick, and how the path interacts with the downsampler.

### Single border / wick colors and toggles

`border_color` and `wick_color` set one color for both up and down candles, shorthand for setting the `*_up_color` / `*_down_color` pair to the same value. `border_visible` and `wick_visible` toggle the outline and wick rendering entirely.

```python order=candlestick,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

candlestick = tvl.candlestick(
    data,
    border_visible=True,
    border_color="gray-500",
    wick_visible=True,
    wick_color="gray-400",
)
```

### Per-bar colors from a column

Drive each candle's color from a table column with `color_column` (body), `border_color_column` (outline), and `wick_color_column` (wick). Each names a column holding a CSS/theme color string per row. Here we color each bar by whether it closed up or down.

```python order=candlestick,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc().update_view(
    ["BarColor = Close >= Open ? `#26a69a` : `#ef5350`"]
)

candlestick = tvl.candlestick(
    data,
    color_column="BarColor",
    border_color_column="BarColor",
    wick_color_column="BarColor",
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.candlestick
```
