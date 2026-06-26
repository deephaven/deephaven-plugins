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
  by -> multi-series.md
-->

# Baseline Chart

A baseline chart is an area chart split along a horizontal reference level: the portion *above* the baseline is filled with one color (typically green for "good"), the portion *below* with another (typically red for "bad"). Use it when the meaningful question is "are we above or below this number?", such as performance vs. a benchmark, P&L vs. zero, or latency vs. an SLA.

The `base_value` parameter is the y-coordinate of the dividing line. By default it sits at 0, which is the right choice for P&L and other zero-centered quantities; set it explicitly when your baseline is a benchmark return, an SLA, or any non-zero reference.

## What are baseline charts useful for?

- **P&L and returns vs. zero**: Above the line is profit; below is loss. The color split makes runs of positive/negative days impossible to miss.
- **Performance vs. a benchmark**: Set `base_value` to the benchmark's return and the chart immediately shows excess/deficit performance.
- **SLA / threshold monitoring**: Latency, error rate, or any quantity with a "good vs. bad" threshold reads cleanly as a baseline.
- **Index-relative views**: Anything reported as "vs. 100" or "vs. open" benefits from explicit above/below shading.

## Examples

### A basic baseline chart

Pass a table with a `timestamp` column and a `value` column. With no `base_value` the chart uses 0 as the baseline. The `tvl.data.values()` series oscillates around 100, so for a meaningful split we set `base_value=100`.

```python order=baseline,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

baseline = tvl.baseline(data, timestamp="Timestamp", value="Value", base_value=100.0)
```

Sections of the curve above 100 are shaded with the top color; sections below 100 with the bottom color.

### Customize above/below line colors

`top_line_color` and `bottom_line_color` set the outline color of the line itself when it's above/below the baseline. Color kwargs accept a Deephaven theme color (e.g. `"positive"`, `"seafoam-500"`, `"accent-300"`), a hex code (`"#1b5e20"`), a named CSS color (`"darkgreen"`), or an `rgb()`/`rgba()` string for transparency. Theme colors adapt automatically when the user switches themes; hardcoded values do not.

```python order=baseline,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

baseline = tvl.baseline(
    data,
    timestamp="Timestamp",
    value="Value",
    base_value=100.0,
    top_line_color="positive",
    bottom_line_color="negative",
)
```

The line uses the user's theme "positive" color above the baseline and "negative" color below.

### Set the baseline at zero for P&L

For a P&L series the natural baseline is 0. Gains above, losses below. Build a synthetic P&L by shifting the demo series and set `base_value=0`.

```python order=baseline,pnl
import deephaven.plot.tradingview_lightweight as tvl
pnl = tvl.data.values().update(["PnL = Value - 100.0"])

baseline = tvl.baseline(
    pnl,
    timestamp="Timestamp",
    value="PnL",
    base_value=0.0,
)
```

Positive portions of the curve are profit days; negative portions are loss days.

### Line width

`line_width` is an integer pixel width from 1 to 4 (the LWC default is 3). Wide lines emphasize the trajectory; thin lines let the colored fill dominate.

```python order=baseline,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

baseline = tvl.baseline(data, timestamp="Timestamp", value="Value", base_value=100.0, line_width=1)
```

The outline is now one pixel wide.

### Customize the per-half gradient stops

Each half of the chart has its own two-stop vertical gradient. Above the baseline, `top_fill_color1` is the stop nearer the line and `top_fill_color2` is the stop nearer the top edge; below the baseline, `bottom_fill_color1` is the stop nearer the line and `bottom_fill_color2` is the stop nearer the bottom edge. Fade either pair toward `"transparent"` to let the chart background show through at the extremes.

```python order=baseline,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

baseline = tvl.baseline(
    data,
    timestamp="Timestamp",
    value="Value",
    base_value=100.0,
    top_fill_color1="positive",
    top_fill_color2="transparent",
    bottom_fill_color1="negative",
    bottom_fill_color2="transparent",
)
```

The above-baseline half fades from a theme "positive" green at the line out to transparent at the top; the below-baseline half fades from a theme "negative" red at the line out to transparent at the bottom.

### Relative gradient and per-point color columns

`relative_gradient=True` anchors the two-tone gradient to the series' value range. Every per-half color can also be driven from a table column: `top_line_color_column` / `bottom_line_color_column` for the line above/below the baseline, and `top_fill_color1_column` / `top_fill_color2_column` / `bottom_fill_color1_column` / `bottom_fill_color2_column` for the gradient stops.

```python order=baseline,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values().update_view(
    [
        "TopLine = `#26a69a`",
        "TopF1 = `rgba(38,166,154,0.4)`",
        "TopF2 = `rgba(38,166,154,0.0)`",
        "BotLine = `#ef5350`",
        "BotF1 = `rgba(239,83,80,0.4)`",
        "BotF2 = `rgba(239,83,80,0.0)`",
    ]
)

baseline = tvl.baseline(
    data,
    timestamp="Timestamp",
    value="Value",
    base_value=100.0,
    relative_gradient=True,
    top_line_color_column="TopLine",
    top_fill_color1_column="TopF1",
    top_fill_color2_column="TopF2",
    bottom_line_color_column="BotLine",
    bottom_fill_color1_column="BotF1",
    bottom_fill_color2_column="BotF2",
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.baseline
```
