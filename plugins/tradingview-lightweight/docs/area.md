<!-- coverage-seen-elsewhere:
  markers -> markers.md
  price_lines -> price-lines.md
  marker_spec -> markers.md
  on_press -> events.md
  on_double_press -> events.md
  crosshair_mode -> styling.md
  time_visible -> time-scale.md
  watermark_text -> watermark.md
  line_style -> line.md
  line_type -> line.md
  line_visible -> line.md
  point_markers_visible -> line.md
  point_markers_radius -> line.md
  crosshair_marker_visible -> line.md
  crosshair_marker_radius -> line.md
  crosshair_marker_border_color -> line.md
  crosshair_marker_background_color -> line.md
  crosshair_marker_border_width -> line.md
  last_price_animation -> line.md
  last_value_visible -> titles-legends.md
  title -> titles-legends.md
  visible -> titles-legends.md
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
-->

# Area Chart

An area chart is a line chart with a vertical gradient fill underneath. The fill shows the magnitude of the value as well as its trajectory. Use it for single-series time series where you want to emphasize how much, such as equity curves, cumulative volume, or account balance, rather than the shape of small fluctuations.

The fill is a vertical gradient between `top_color` (just below the line) and `bottom_color` (at the chart bottom).

## What are area charts useful for?

- **Emphasizing magnitude**: The shaded region under the line shows how big the value is, in addition to where it's going.
- **Single-series time series**: When there is only one quantity to plot, an area chart carries more visual weight than a bare line and still reads as a trend at a glance.
- **Cumulative quantities**: Volume traded, P&L, balance, headcount, and anything else that accumulates suits an area chart.
- **Dashboard tiles**: A filled area stays legible on small chart tiles where the line alone would be too thin to register.

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

Set `by` to a partition column and the chart draws one area per unique value, each with its own auto-assigned color from the user's theme palette. This is useful for comparisons, but note that the areas overlay rather than stack arithmetically.

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

`invert_filled_area=True` flips the gradient so the area is drawn above the line instead of below it. This is the typical layout for "deficit" or "below-baseline" views, where the value of interest is the gap between the line and the top of the chart.

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

### Line color and a relative gradient

`line_color` sets the outline color independently of the fill. `relative_gradient=True` anchors the gradient stops to the series' value range rather than the visible pane, so the fill keeps consistent colors as the chart scrolls.

```python order=area,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

area = tvl.area(
    data,
    timestamp="Timestamp",
    value="Value",
    line_color="accent-500",
    relative_gradient=True,
)
```

### Per-point colors from columns

`line_color_column`, `top_color_column`, and `bottom_color_column` drive the line and the two gradient stops from per-row table columns of color strings.

```python order=area,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values().update_view(
    [
        "LineCol = Value >= 100 ? `#26a69a` : `#ef5350`",
        "TopCol = Value >= 100 ? `rgba(38,166,154,0.4)` : `rgba(239,83,80,0.4)`",
        "BotCol = `rgba(0,0,0,0)`",
    ]
)

area = tvl.area(
    data,
    timestamp="Timestamp",
    value="Value",
    line_color_column="LineCol",
    top_color_column="TopCol",
    bottom_color_column="BotCol",
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.area
```
