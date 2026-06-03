<!-- coverage-seen-elsewhere:
  watermark_text -> watermark.md
  watermark_lines -> watermark.md
  watermark_image_url -> watermark.md
  watermark_color -> watermark.md
  watermark_font_size -> watermark.md
  watermark_font_style -> watermark.md
  watermark_horz_align -> watermark.md
  watermark_vert_align -> watermark.md
  background_color -> styling.md
  crosshair_mode -> styling.md
-->

# Titles, Legends, and Watermarks

TVL doesn't have a separate "title" widget the way Plotly does — instead, the chart title lives on the watermark and per-series titles drive the in-chart legend that appears in the top-left corner. This page covers the title + legend surface and gives a brief tour of the watermark options; for the full watermark treatment (multi-line, image watermarks, alignment) see [watermark](watermark.md).

Use this page when you want to label a chart for a dashboard tile, show or hide the legend on individual series, or pick a corner for a single-line watermark.

## What are titles and legends useful for?

- **Identifying a chart in a dashboard**: A watermark title tells viewers at a glance what they're looking at — symbol, instrument, scenario.
- **Per-series labels**: Each series can carry a `title=`, which appears in the chart's legend overlay along with the live last-value readout.
- **Brand and context**: Watermarks can include disclaimers, environment names ("staging"), or "as of" timestamps without taking screen real estate.
- **Selective legend**: Hide the last-value badge on noisy overlay series with `last_value_visible=False` while keeping the title.

## Examples

### Add a chart title via watermark

The simplest title is a single-line watermark. `watermark_text` is the text; `watermark_visible=True` enables it; `watermark_color` and `watermark_font_size` style it.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    watermark_visible=True,
    watermark_text="Reference Index",
    watermark_color="rgba(0, 0, 0, 0.35)",
    watermark_font_size=24,
)
```

The watermark sits centered behind the data by default — see [watermark](watermark.md) for alignment options.

### Position the watermark in a corner

`watermark_horz_align` (`"left"` / `"center"` / `"right"`) and `watermark_vert_align` (`"top"` / `"center"` / `"bottom"`) place the watermark in any of nine positions. Use a corner placement when the watermark serves as a chart title rather than a centered background label.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    watermark_visible=True,
    watermark_text="USD / EUR",
    watermark_horz_align="left",
    watermark_vert_align="top",
    watermark_font_size=18,
    watermark_color="rgba(0, 0, 0, 0.55)",
)
```

For a "title bar" effect, anchor top-left and increase the color opacity.

### Show series titles in the legend

Each series factory accepts a `title=` parameter — the value appears in the legend overlay in the top-left of the chart. Setting `title` on multiple series gives each a labeled badge.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
shifted = values.update_view(["Value = Value + 10"])

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index", color="#2563eb"),
    tvl.line(shifted, timestamp="Timestamp", value="Value", title="Index +10", color="#dc2626"),
)
```

Without `title`, the series shows a colored marker with the live value but no name — fine for single-series charts, awkward when you have several overlays.

### Hide the last-value badge on noisy series

`last_value_visible=False` hides the price-axis pill that follows each series. Use this for noisy reference overlays where the live value isn't useful (e.g. a moving-average line above a candlestick).

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
shifted = values.update_view(["Value = Value + 10"])

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Main", color="#2563eb"),
    tvl.line(
        shifted,
        timestamp="Timestamp",
        value="Value",
        title="Reference",
        color="#94a3b8",
        last_value_visible=False,
    ),
)
```

The series remains in the legend overlay; only the right-edge price label disappears.

### Toggle series visibility from the start

`visible=False` starts the series hidden — useful for "click to enable" legend interactions handled outside Python, or for setting up a chart where most series are off by default.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Primary"),
    tvl.line(
        values.update_view(["Value = Value + 5"]),
        timestamp="Timestamp",
        value="Value",
        title="Optional overlay",
        visible=False,
    ),
)
```

The legend entry still shows; the line doesn't render until something toggles `visible` back on.

### Multi-line watermark for richer titles

For a two-line title (instrument + tagline, "as of" timestamps, etc.) pass a list of `WatermarkLine` dataclasses to `watermark_lines`. Each line can carry its own color, font size, line height, and font style. See [watermark](watermark.md) for the deep dive.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    watermark_visible=True,
    watermark_horz_align="center",
    watermark_vert_align="center",
    watermark_lines=[
        tvl.WatermarkLine(
            text="USD / EUR",
            color="rgba(0, 0, 0, 0.5)",
            font_size=32,
        ),
        tvl.WatermarkLine(
            text="Daily close, 2024",
            color="rgba(0, 0, 0, 0.3)",
            font_size=14,
            font_style="italic",
        ),
    ],
)
```

Single-line shortcuts (`watermark_text` / `watermark_color` / `watermark_font_*`) and `watermark_lines` are mutually exclusive — pick one path.

### Image watermark as a "brand mark"

`watermark_image_url` is the third watermark path — render a logo or seal in the chart. Combine with `watermark_image_alpha` for a subtle background mark.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    watermark_image_visible=True,
    watermark_image_url="https://example.com/brand.png",
    watermark_image_max_width=120,
    watermark_image_max_height=120,
    watermark_image_padding=16,
    watermark_image_alpha=0.15,
)
```

See [watermark](watermark.md) for the full image-watermark surface.

### Compact dashboard-tile titles

For dense small-multiples layouts, use a small corner-anchored watermark as a tile label. Pair with `font_size` on the chart so the axis labels stay legible in a tile.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    font_size=10,
    watermark_visible=True,
    watermark_text="AAA",
    watermark_horz_align="left",
    watermark_vert_align="top",
    watermark_font_size=12,
    watermark_color="rgba(0, 0, 0, 0.55)",
)
```

This is the recommended pattern for tiled overview screens — title in the corner, data filling the rest.

## API Reference

For the full `tvl.chart` signature, see the [Chart container](chart.md#api-reference) page.
