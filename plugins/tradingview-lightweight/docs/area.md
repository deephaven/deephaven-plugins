<!-- coverage-seen-elsewhere:
  markers -> markers.md
  price_lines -> price-lines.md
  marker_spec -> markers.md
  crosshair_mode -> styling.md
  time_visible -> time-scale.md
  watermark_text -> watermark.md
-->

# Area Chart

An area chart is a line chart with a vertical gradient fill underneath, drawing the eye to the magnitude of the value as well as its trajectory. Use it for single-series time series where you want to emphasize *how much* — equity curves, cumulative volume, account balance — rather than the shape of small fluctuations.

The fill is a vertical gradient between `top_color` (just below the line) and `bottom_color` (at the chart bottom).

## What are area charts useful for?

- **Emphasizing magnitude**: The shaded region under the line gives a strong visual cue for how big the value is, in addition to where it's going.
- **Single-series time series**: When there is only one quantity to plot, an area chart looks richer than a line and still reads as a trend at a glance.
- **Cumulative quantities**: Volume traded, P&L, balance, headcount — anything that accumulates feels natural as an area.
- **Hero / dashboard tiles**: A filled area is a high-impact rendering for small chart tiles where the line alone would be too thin to register.

## Examples

### A basic area chart

Pass a table with a `timestamp` column and a `value` column. With `tvl.data.values()` (columns `Timestamp` and `Value`) the defaults already match, but they are shown here explicitly for clarity.

```python order=area,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

area = tvl.area(data, timestamp="Timestamp", value="Value")
```

The line traces the value; the area below it fades from the top color to the bottom color.

### Customize the gradient

`top_color` is the gradient stop at the line; `bottom_color` is the stop at the bottom of the chart. Both accept a Deephaven theme color (e.g. `"orange-800"`, `"accent-300"`), a hex code (`"#1f8a70"`), a named CSS color (`"crimson"`), or an `rgb()`/`rgba()` string for transparency. Theme colors adapt automatically when the user switches themes; hardcoded values do not.

```python order=area,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

area = tvl.area(
    data,
    timestamp="Timestamp",
    value="Value",
    top_color="orange-800",
    bottom_color="transparent",
)
```

The gradient runs from a deep amber at the line down to fully transparent at the chart bottom.

### Line width

`line_width` sets the outline thickness as an integer 1-4 (the LWC default is 3). Wider outlines stand out on dashboards; thinner outlines disappear into the gradient on detail charts.

```python order=area,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

area = tvl.area(data, timestamp="Timestamp", value="Value", line_width=1)
```

The outline is now one pixel wide.

### One area per group with `by`

Set `by` to a partition column and the chart draws one area per unique value, each with its own auto-assigned color from the user's theme palette. Useful for "stacked" comparisons — note the areas overlay rather than stack arithmetically.

```python order=area,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.stocks()

area = tvl.area(
    data,
    timestamp="Timestamp",
    value="Price",
    by="Sym",
)
```

Each symbol gets its own translucent area, automatically colored.

### Invert the filled area

`invert_filled_area=True` flips the gradient so the area is drawn *above* the line instead of below it — the typical layout for "deficit" or "below-baseline" views where the value of interest is the gap between the line and the top of the chart.

```python order=area,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

area = tvl.area(
    data,
    timestamp="Timestamp",
    value="Value",
    invert_filled_area=True,
)
```

The shaded region now extends from the line up to the top of the chart rather than down to the bottom.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.area
```
