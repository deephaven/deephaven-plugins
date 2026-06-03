<!-- coverage-seen-elsewhere:
  markers -> markers.md
  price_lines -> price-lines.md
  marker_spec -> markers.md
  crosshair_mode -> styling.md
  time_visible -> time-scale.md
  watermark_text -> watermark.md
-->

# Baseline Chart

A baseline chart is an area chart split along a horizontal reference level: the portion *above* the baseline is filled with one color (typically green for "good"), the portion *below* with another (typically red for "bad"). Reach for it when the meaningful question is "are we above or below this number?" — performance vs. a benchmark, P&L vs. zero, latency vs. SLA.

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

For a P&L series the natural baseline is 0 — gains above, losses below. Build a synthetic P&L by shifting the demo series and set `base_value=0`.

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

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.baseline
```
