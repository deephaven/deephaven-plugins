# Multiple Price Scales

A multiple-axes chart hosts more than one price scale inside a single pane. Use it when two series share a time axis but their value ranges are too different to share one price scale, for example a stock price (10-200) and trade volume (1,000-2,000,000) layered in the same pane.

The mechanism is the `price_scale_id` parameter on every per-type constructor. Lightweight Charts provides two built-in scales, `"left"` and `"right"`, and treats any other string as an **overlay** scale that floats on top of the chart with no axis labels by default. The chart-level `default_visible_price_scale_id` option picks which built-in scale unbound series fall back to.

<!-- coverage-seen-elsewhere:
  pane / pane_stretch_factors / pane_preserve_empty -> multi-pane.md
  price_format -> price-formats.md
  *_formatter -> price-formats.md
  markers / price_lines / marker_spec -> markers.md, price-lines.md
  watermark_* -> watermark.md
-->

## What are multiple price scales useful for?

- **Mixing magnitudes**: Price in dollars and volume in millions don't share a range. Two scales keep each readable.
- **Comparing returns**: A `"percentage"` price scale lets you compare two instruments by relative change rather than absolute price.
- **Hiding clutter**: Overlay scales render a series with no visible axis labels, which suits background indicators that exist to be read on hover, not on the axis.
- **Per-scale tick density**: `*_tick_mark_density` lets a busy price scale stay readable when the chart is short.

## Examples

### Put one series on the left, one on the right

Two series, two built-in scales. Set `price_scale_id="left"` to draw the axis on the left, and `"right"` (the default) for the right.

```python order=lr_chart,stocks,aaa,bbb
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()
aaa = stocks.where("Sym = `AAA`")
bbb = stocks.where("Sym = `BBB`")

s_aaa = tvl.line(
    aaa, timestamp="Timestamp", value="Price",
    color="#1976d2", price_scale_id="left", title="AAA",
)
s_bbb = tvl.line(
    bbb, timestamp="Timestamp", value="Price",
    color="#d32f2f", price_scale_id="right", title="BBB",
)

lr_chart = tvl.chart(
    s_aaa, s_bbb,
    left_price_scale_visible=True,
    right_price_scale_visible=True,
)
```

The chart shows two axes: AAA's scale on the left, BBB's on the right.

### Use an overlay scale to layer a series on top

An overlay scale is any `price_scale_id` other than `"left"` or `"right"`. The series renders against its own y-range without taking up axis space. This is the "volume on top of price" pattern.

```python order=overlay_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc, price_scale_id="right")
vol = tvl.histogram(
    ohlc, timestamp="Timestamp", value="Volume",
    color="rgba(120,120,120,0.5)",
    price_scale_id="volume",  # overlay scale, anything not "left"/"right"
    scale_margin_top=0.8,     # squash volume into the bottom 20%
    scale_margin_bottom=0.0,
)

overlay_chart = tvl.chart(
    price, vol,
    overlay_price_scale_margin_top=0.8,
    overlay_price_scale_margin_bottom=0.0,
)
```

The volume histogram sits at the bottom of the price pane with no visible axis labels.

### Switch the default scale

`default_visible_price_scale_id` picks which built-in scale series fall back to when they don't set their own `price_scale_id`. Default is `"right"`; flip it to `"left"` to make unbound series snap to the left.

```python order=default_left,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

# Note: no price_scale_id set on the series.
price = tvl.candlestick(ohlc)

default_left = tvl.chart(
    price,
    default_visible_price_scale_id="left",
    left_price_scale_visible=True,
    right_price_scale_visible=False,
)
```

With `default_visible_price_scale_id="left"`, the candlestick series renders against the left axis even though it didn't ask for one.

### Style the left, right, and overlay scales

Each scale (`left`, `right`, `overlay`) has its own block of chart-level options. They mirror each other; here we set border color, text color, and mode independently.

```python order=styled_scales,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc, price_scale_id="right")
ma = tvl.line(
    ohlc, timestamp="Timestamp", value="Close",
    color="#ff9800", price_scale_id="left",
)
vol = tvl.histogram(
    ohlc, timestamp="Timestamp", value="Volume",
    color="rgba(120,120,120,0.5)", price_scale_id="vol",
)

styled_scales = tvl.chart(
    price, ma, vol,
    # right (price) — log-scale demonstration
    right_price_scale_visible=True,
    right_price_scale_mode="logarithmic",
    right_price_scale_border_color="#1976d2",
    right_price_scale_text_color="#1976d2",
    # left (MA) — percentage mode
    left_price_scale_visible=True,
    left_price_scale_mode="percentage",
    left_price_scale_border_color="#ff9800",
    left_price_scale_text_color="#ff9800",
    # overlay (volume)
    overlay_price_scale_border_color="#999",
    overlay_price_scale_ticks_visible=False,
)
```

Three scales, three colors. Note the modes: the right scale is log-scaled while the left runs in percentage mode (try `"normal"` or `"indexed_to_100"` as alternatives).

### Tune tick mark density per scale

`*_price_scale_tick_mark_density` controls how aggressively each scale draws tick labels. Higher values pack more ticks; lower values thin them out.

```python order=density_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc, price_scale_id="right")
ma = tvl.line(
    ohlc, timestamp="Timestamp", value="Close",
    color="#ff9800", price_scale_id="left",
)

density_chart = tvl.chart(
    price, ma,
    left_price_scale_visible=True,
    right_price_scale_visible=True,
    right_price_scale_tick_mark_density=2.0,   # extra ticks
    left_price_scale_tick_mark_density=0.5,    # half as many ticks
)
```

The right scale gets more tick labels; the left gets fewer. Use this to balance readability across scales that have different value ranges.

### Auto-scale and invert per scale

Each scale exposes `*_auto_scale` and `*_invert_scale` for fine control. Invert flips the axis upside-down, which helps with bid-spread or option-greek charts where lower values are "higher" conceptually.

```python order=invert_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(
    ohlc, price_scale_id="right",
    scale_invert=True,        # per-series shortcut
    auto_scale=True,
)

invert_chart = tvl.chart(
    price,
    right_price_scale_invert_scale=True,  # same effect at the chart level
    right_price_scale_auto_scale=True,
)
```

`scale_invert` on the series and `right_price_scale_invert_scale` on the chart are equivalent ways to flip the right axis.

## API Reference

For the full `tvl.chart` signature (including all `left_price_scale_*`, `right_price_scale_*`, and `overlay_price_scales` options), see the [Chart container](chart.md#api-reference) page.

```{eval-rst}
```

```{eval-rst}
```
