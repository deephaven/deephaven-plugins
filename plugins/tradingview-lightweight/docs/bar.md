<!-- coverage-seen-elsewhere:
  markers -> markers.md
  price_lines -> price-lines.md
  marker_spec -> markers.md
  auto_bin -> autobin.md
  bin_width -> autobin.md
  bin_count -> autobin.md
  crosshair_mode -> styling.md
  time_visible -> time-scale.md
  watermark_text -> watermark.md
-->

# Bar (OHLC) Chart

A bar chart renders each OHLC interval as a vertical range bar with a short tick on the left for the open and a short tick on the right for the close. Use it when you want the readability of OHLC data but prefer a thinner, less ink-heavy rendering than candlesticks — especially for very dense intraday charts or when you plan to layer markers on top.

Like candlesticks, bars are color-coded by direction: an up bar has the close above the open, a down bar has the close below the open. Because the body is just two ticks instead of a filled rectangle, you can fit many more bars in the same horizontal space.

## What are OHLC bar charts useful for?

- **Dense intraday charts**: Bars take less horizontal pixel space than candles, so a 1-minute chart over a full session stays readable.
- **Overlays and annotations**: A thinner price track leaves room for markers, price lines, and secondary series without visual conflict.
- **Western technical analysis**: Many classical Western (vs. Japanese) chart conventions assume OHLC bars and read them more naturally than candles.
- **Volatility scans**: Long vertical bars with ticks close together flag wide-range, indecisive periods at a glance.

## Examples

### A basic bar chart

`tvl.bar` consumes the same OHLC table layout as `tvl.candlestick`. The `tvl.data.ohlc()` helper already has the canonical column names so the call is a one-liner.

```python order=bar,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

bar = tvl.bar(data)
```

Each row in `data` becomes one vertical bar with an open tick on the left and a close tick on the right. When `up_color` / `down_color` are not provided, the chart pulls them from the active Deephaven theme palette so the same code reads correctly in both light and dark themes.

### Map non-default OHLC column names

When your table uses different column names — say `Ts`/`O`/`H`/`L`/`C` from a custom upstream join — pass them as kwargs. The chart only reads the columns you point at.

```python order=bar,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc().rename_columns(["Ts=Timestamp", "O=Open", "H=High", "L=Low", "C=Close"])

bar = tvl.bar(
    data,
    timestamp="Ts",
    open="O",
    high="H",
    low="L",
    close="C",
)
```

### Customize up and down colors

`up_color` and `down_color` set the bar color for up and down intervals. The bar (range line plus open/close ticks) inherits a single color per bar, unlike candlesticks where bodies and borders can diverge.

```python order=bar,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

bar = tvl.bar(
    data,
    up_color="seafoam-800",
    down_color="magenta-600",
)
```

Both `up_color` and `down_color` accept a Deephaven theme color (e.g. `"seafoam-800"`, `"accent-300"`), a hex code (`"#26a69a"`), a named CSS color (`"crimson"`), or an `rgb()`/`rgba()` string for transparency. Theme colors adapt automatically when the user switches themes; hardcoded values do not. Leave them unset to inherit the active theme's palette.

### Set a chart title

`title` is the series legend label — visible on hover and in the legend area. Use it whenever the chart will be embedded next to other content where the column names are not self-explanatory.

```python order=bar,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

bar = tvl.bar(data, title="ES futures, 1m bars")
```

The legend now reads "ES futures, 1m bars".

### Server-side autobinning

Hand the chart a large OHLC table and TVL automatically aggregates it server-side into a viewport-friendly number of buckets. Override the bucket count or width via `bin_count` / `bin_width`, or set `auto_bin=False` to bypass it entirely for small tables.

```python order=bar,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

bar = tvl.bar(data, auto_bin=True, bin_width="P7D")
```

See [autobin](autobin.md) for the full autobin surface — ISO-8601 duration grammar, when each `auto_bin` value is the right pick, and how the path interacts with the downsampler.

### Thin bars and hidden open ticks

Two bar-specific styling options trim the visual weight of each bar. `thin_bars=True` renders each bar with a narrower body, which is useful on very dense intraday charts; `open_visible=False` hides the short left "open" tick so each bar shows only the range line plus the right "close" tick — a cleaner look when the open price is not the focus.

```python order=bar,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.ohlc()

bar = tvl.bar(
    data,
    thin_bars=True,
    open_visible=False,
)
```

The bars are now thinner and the left-side open tick is gone.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.bar
```
