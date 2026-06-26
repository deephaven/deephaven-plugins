<!-- coverage-seen-elsewhere:
  crosshair_mode -> styling.md
  watermark_text -> watermark.md
  background_color -> styling.md
  text_color -> styling.md
-->

# Custom Numeric Chart

A custom-numeric chart puts any numeric quantity on the horizontal axis. Unlike the candlestick / line / area family (which require time on the x-axis) and unlike the yield-curve chart (which expects months) and the options chart (which expects strikes), `tvl.custom_numeric` makes no assumption about what your x-values *mean*. They're just numbers.

Internally `tvl.custom_numeric` uses the same `createOptionsChart` renderer as `tvl.options_chart`. Use it whenever your x-axis is a generic numeric quantity (frequency in Hz, distance in km, price level for a profile chart, basket index) rather than time, maturity, or strike. TVL also exposes a more flexible `createChartEx` entry point in JavaScript that lets you attach a custom JS `horzScaleBehavior`, which is intentionally not surfaced through the Python API.

## What are custom-numeric charts useful for?

- **Frequency / Bode plots**: Magnitude or phase vs. frequency on a numeric axis with no time semantics.
- **Distance / depth profiles**: Price vs. depth-of-book level, density vs. depth, anything indexed by a numeric position.
- **Price-level profiles**: Volume profile, market profile (TPO), and any other "histogram by price level" rendering.
- **Custom indices**: Basket weights vs. constituent number, regression coefficients vs. feature index: any "value vs. integer position" view.

## Examples

### A basic line on a numeric x-axis

The chart treats `x` as a numeric coordinate, so any numeric column will do. Pass it explicitly along with the value column. Build a small synthetic table inline by attaching an integer `X` to the `tvl.data.values()` series.

```python order=custom_numeric,profile
import deephaven.plot.tradingview_lightweight as tvl
profile = tvl.data.values().update(["X = (double)ii"])

custom_numeric = tvl.custom_numeric(profile, x="X", value="Value")
```

The line traces `Value` over the integer x-axis. Reuse a strike, tenor, or any other numeric column verbatim when you want a generic numeric rendering of data you might otherwise feed to `options_chart` or `yield_curve`.

> [!NOTE]
> Viewport-aware downsampling currently only applies to time-axis charts (`chart_type == "standard"`). Custom-numeric charts ship raw rows to the client, so keep the input table modest (tens of thousands of rows) or pre-aggregate server-side.

### Switch to an area rendering

`series_type="area"` swaps the line for a filled area. Combine it with `top_color`, `bottom_color`, and `line_color` for a custom gradient.

```python order=custom_numeric,profile
import deephaven.plot.tradingview_lightweight as tvl
profile = tvl.data.values().update(["X = (double)ii"])

custom_numeric = tvl.custom_numeric(
    profile,
    x="X",
    value="Value",
    series_type="area",
    top_color="rgba(38, 166, 154, 0.45)",
    bottom_color="rgba(38, 166, 154, 0.0)",
    line_color="#26a69a",
)
```

The gradient fades to transparent at the bottom.

### Switch to a histogram rendering

`series_type="histogram"` renders one bar per row, a natural fit for volume-profile and market-profile views where the x-axis is a price level.

```python order=custom_numeric,profile
import deephaven.plot.tradingview_lightweight as tvl
profile = tvl.data.values().update(["X = (double)ii"])

custom_numeric = tvl.custom_numeric(
    profile,
    x="X",
    value="Value",
    series_type="histogram",
    color="#9467bd",
)
```

A purple bar rises at each integer x-value.

### Customize color, width, and title

In line and area modes, `color`, `line_width`, and `title` work the same way as in the other chart types. `line_width` is an integer pixel width 1-4.

```python order=custom_numeric,profile
import deephaven.plot.tradingview_lightweight as tvl
profile = tvl.data.values().update(["X = (double)ii"])

custom_numeric = tvl.custom_numeric(
    profile,
    x="X",
    value="Value",
    color="#1f77b4",
    line_width=3,
    title="Custom profile",
)
```

The line is blue, three pixels wide, with a custom legend entry.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.custom_numeric
```
