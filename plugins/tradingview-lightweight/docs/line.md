<!-- coverage-seen-elsewhere:
  markers -> markers.md
  price_lines -> price-lines.md
  marker_spec -> markers.md
  on_press -> events.md
  on_double_press -> events.md
  crosshair_mode -> styling.md
  time_visible -> time-scale.md
  watermark_text -> watermark.md
  last_value_visible -> titles-legends.md
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
  color_column -> histogram.md
  pane -> multi-pane.md
-->

# Line Chart

A line chart draws a single continuous line through `(timestamp, value)` points to show how one number changes over time. Use it when the value is a continuous quantity (price, yield, latency, count) sampled at ordered timestamps.

Line charts work well with TVL's `by` argument, which partitions one input table into one line per unique value. That lets you overlay several symbols or strategies on the same axis without manually splitting the table.

## What are line charts useful for?

- **Showing trend over time**: A single line strips away everything but the trajectory, which is what you usually want for a quick "is it going up or down" read.
- **Comparing multiple series**: With `by` you can overlay several groups on the same axis and visually compare their levels and slopes.
- **Highlighting state changes**: With `line_type="with_steps"` you can render a series of discrete state data (regimes, flags, tiers) as a clean staircase.
- **Annotating with markers and price lines**: A thin line leaves room to layer event markers and level lines on top. See [markers](markers.md) and [price-lines](price-lines.md).

## Examples

### A basic line chart

Pass a table plus `timestamp` and `value` column names. With `tvl.data.values()` (columns `Timestamp` and `Value`) the defaults already match, but they are shown here explicitly for clarity.

```python order=line,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

line = tvl.line(data, timestamp="Timestamp", value="Value")
```

A single line is drawn through 90 daily points.

### Customize color and width

`color` is a theme color or a CSS color of the line; `line_width` is an integer pixel width from 1 to 4 (the LWC default is 3). The `LineWidth` type alias formalizes that range as `Literal[1, 2, 3, 4]`. Bump width up when the chart is going on a big monitor; bump it down when you have many series overlaid.

`color` accepts a Deephaven theme color (e.g. `"positive"`, `"seafoam-800"`, `"accent-300"`), a hex code (`"#1f77b4"`), a named CSS color (`"steelblue"`), or an `rgb()`/`rgba()` string for transparency. Theme colors adapt automatically when the user switches themes; hardcoded values do not.

```python order=line,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

line = tvl.line(
    data,
    timestamp="Timestamp",
    value="Value",
    color="positive",
    line_width=1,
)
```

The line is drawn in the user's theme "positive" color (so the same code reads cleanly in light or dark mode) and one pixel wide.

### Every `LineStyle` value

`line_style` accepts five named presets that map to the LWC `LineStyle` enum: `"solid"`, `"dotted"`, `"dashed"`, `"large_dashed"`, and `"sparse_dotted"`. To compare them in one image, give each variant its own vertical offset so the lines stack rather than overlap.

```python order=line_styles
import deephaven.plot.tradingview_lightweight as tvl

base = tvl.data.values()
styles = [
    ("solid", 40.0),
    ("dotted", 20.0),
    ("dashed", 0.0),
    ("large_dashed", -20.0),
    ("sparse_dotted", -40.0),
]

line_styles = tvl.chart(
    *[
        tvl.line(
            base.update([f"Offset_{name} = Value + {offset}"]),
            timestamp="Timestamp",
            value=f"Offset_{name}",
            line_style=name,
            title=name,
        )
        for name, offset in styles
    ],
)
```

All five styles render on the same chart, vertically offset.

### Every `LineType` value

`line_type` controls how the line is drawn *between* points. The three options are:

- `"simple"`: straight segments (the default).
- `"with_steps"`: horizontal segment then a vertical jump at each new point, useful for state data that hold constant between samples.
- `"curved"`: monotone-cubic interpolation for a smoothed look.

```python order=line_types
import deephaven.plot.tradingview_lightweight as tvl

base = tvl.data.values()
types = [
    ("simple", 20.0),
    ("with_steps", 0.0),
    ("curved", -20.0),
]

line_types = tvl.chart(
    *[
        tvl.line(
            base.update([f"Offset_{name} = Value + {offset}"]),
            timestamp="Timestamp",
            value=f"Offset_{name}",
            line_type=name,
            title=name,
        )
        for name, offset in types
    ],
)
```

All three types render on the same chart, vertically offset. `with_steps` is the right choice for non-interpolated discrete-state data; `curved` is purely cosmetic.

### One line per group with `by`

Set `by` to a partition column and the chart creates one line per unique value, automatically picking a distinct color for each from the user's theme palette. New partition keys that show up at runtime (in a ticking table) cause new series to be added on the fly.

```python order=line,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.stocks()

line = tvl.line(
    data,
    timestamp="Timestamp",
    value="Price",
    by="Sym",
)
```

`tvl.data.stocks()` is a three-symbol (`AAA`, `BBB`, `CCC`) walk with enough independent variance per series that the three lines spread across the chart instead of stacking on top of each other.

### Point markers on every data point

`point_markers_visible=True` draws a small dot at each `(timestamp, value)` sample so individual points stand out from the connecting line. `point_markers_radius` (in pixels) sizes them. Useful when the sample rate is low enough that the points themselves carry information, not just the line through them.

```python order=line,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

line = tvl.line(
    data,
    timestamp="Timestamp",
    value="Value",
    point_markers_visible=True,
    point_markers_radius=3,
)
```

Each daily sample is now marked with a small filled circle on top of the line.

### Pulse the last point with `last_price_animation`

`last_price_animation` controls the pulse effect on the last-price marker. `"disabled"` (the default) leaves it static, `"continuous"` pulses while the chart is visible, and `"on_data_update"` pulses only when new data arrives. Reach for it on live tickers where the most recent point should draw the eye.

```python order=line,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

line = tvl.line(
    data,
    timestamp="Timestamp",
    value="Value",
    last_price_animation="continuous",
)
```

The last-price marker now pulses continuously. Use `"disabled"` whenever snapshot determinism matters. The other two modes introduce time-dependent rendering.

### Crosshair marker and line visibility

When the user hovers, LWC draws a marker where the crosshair meets the line. `crosshair_marker_visible` toggles it, `crosshair_marker_radius` sizes it (pixels), and `crosshair_marker_border_color` / `crosshair_marker_background_color` / `crosshair_marker_border_width` style it. `line_visible=False` hides the connecting line itself, handy when you only want the point markers or the crosshair dot.

```python order=line,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

line = tvl.line(
    data,
    timestamp="Timestamp",
    value="Value",
    line_visible=True,
    crosshair_marker_visible=True,
    crosshair_marker_radius=6,
    crosshair_marker_border_color="accent-400",
    crosshair_marker_background_color="accent-200",
    crosshair_marker_border_width=2,
)
```

These crosshair-marker options apply to `area` and `baseline` series too.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.line
```
