# Watermark

A watermark is a faint mark drawn behind the data of a chart — a brand, a disclaimer, an environment name like "staging", an "as of" stamp. It is styled to recede behind the series, so it marks the chart without being read as part of it.

There are two ways to add a watermark. The single-line shortcut uses `tvl.chart(watermark=tvl.watermark(text=..., color=..., ...))`. The multi-line form takes a list of [`tvl.watermark_line(...)`](#api-reference) entries via `tvl.watermark(lines=[...])`, one per row of text, each with its own color, font size, line height, and font style.

<!-- coverage-seen-elsewhere:
  watermark_visible -> exercised below
  watermark_image_* -> not yet exercised; covered by docstring on chart()
-->

## What watermarks are useful for?

- **Branding**: an organisation or product name behind the data, marking where the chart came from.
- **Disclaiming**: a standing notice such as "internal use only", "not investment advice", or "sample data".
- **Flagging the environment**: "staging", "dev", or "replay", so a screenshot cannot be mistaken for production.
- **Styling for theme**: adjusting color and font-style lets a watermark blend with light or dark themes.
- **Positioning to taste**: `horz_align` and `vert_align` on `tvl.watermark(...)` cover the nine canonical anchor points on the chart.

## Examples

### Add a simple single-line watermark

The shortest watermark: just `tvl.watermark(text=...)`. Defaults take care of color, font size, and alignment.

```python order=basic_watermark,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc)
basic_watermark = tvl.chart(price, watermark=tvl.watermark(text="ACME CAPITAL"))
```

The chart shows `ACME CAPITAL` faintly centered behind the price.

### Style the single-line watermark

The single-line path bundles the styling options on `tvl.watermark()`: color, font size, font style (italic/normal/etc.), line height, and visibility.

```python order=styled_watermark,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc)

styled_watermark = tvl.chart(
    price,
    watermark=tvl.watermark(
        text="ACME CAPITAL",
        color="rgba(25,118,210,0.25)",
        font_size=80,
        font_style="italic",
        line_height=1.0,
        visible=True,
    ),
)
```

The watermark is now a large, semi-transparent, italicized blue mark.

### Multi-line watermark

For two or more lines, switch to `tvl.watermark(lines=[...])`. Each entry is built with `tvl.watermark_line(...)` and renders as its own line of text with optional per-line styling: color, font size, line height, and font style.

```python order=multi_watermark,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc)

lines = [
    tvl.watermark_line(
        "ACME CAPITAL",
        color="rgba(25,118,210,0.35)",
        font_size=72,
        line_height=80.0,
    ),
    tvl.watermark_line(
        "Internal use only",
        color="rgba(150, 150, 150, 0.55)",
        font_size=32,
        line_height=40.0,
        font_style="italic",
    ),
]

multi_watermark = tvl.chart(price, watermark=tvl.watermark(lines=lines))
```

Two lines, two styles. The single-line shortcut and `lines` are mutually exclusive, so pick one.

### Position the watermark

`horz_align` accepts `"left"`, `"center"`, `"right"` (the values of `HorzAlign`). `vert_align` accepts `"top"`, `"center"`, `"bottom"` (the values of `VertAlign`). Together they give nine anchor positions; here we cover every value of each enum across three charts.

```python order=top_left,top_center,top_right,middle_left,middle_center,middle_right,bottom_left,bottom_center,bottom_right,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

def _wm(horz, vert):
    return tvl.chart(
        tvl.candlestick(ohlc),
        watermark=tvl.watermark(
            text=f"{horz}/{vert}",
            color="rgba(25,118,210,0.35)",
            font_size=40,
            horz_align=horz,
            vert_align=vert,
        ),
    )

top_left      = _wm("left",   "top")
top_center    = _wm("center", "top")
top_right     = _wm("right",  "top")
middle_left   = _wm("left",   "center")
middle_center = _wm("center", "center")
middle_right  = _wm("right",  "center")
bottom_left   = _wm("left",   "bottom")
bottom_center = _wm("center", "bottom")
bottom_right  = _wm("right",  "bottom")
```

Nine variants, one for each combination of `HorzAlign` and `VertAlign`.

### Hide the watermark

`visible=False` keeps the configuration but skips drawing. Useful when toggling a watermark on and off without rebuilding the chart configuration.

```python order=hidden_watermark,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc)
hidden_watermark = tvl.chart(
    price,
    watermark=tvl.watermark(
        text="ACME CAPITAL",
        color="rgba(25,118,210,0.35)",
        visible=False,
    ),
)
```

The chart shows no watermark even though `text` is set.

### Image watermark

In addition to text, the chart accepts an image watermark (logo or background graphic). Set `tvl.watermark_image(url=...)` and tune `max_width`, `max_height`, `padding`, and `alpha`. The image-watermark path is independent from the text-watermark path; both can coexist.

```python order=image_watermark,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc)
image_watermark = tvl.chart(
    price,
    watermark_image=tvl.watermark_image(
        url="https://www.deephaven.io/img/dh-community-logo.svg",
        max_width=200,
        max_height=80,
        padding=12,
        alpha=0.2,
        visible=True,
    ),
)
```

The Deephaven logo appears behind the data at 20% opacity.

## API Reference

The text watermark is configured with `tvl.watermark(...)` (returning a
`Watermark`) passed to `watermark=` on `tvl.chart()`; the image watermark uses
`tvl.watermark_image(...)` (returning a `WatermarkImage`) passed to
`watermark_image=`. `tvl.watermark_line(...)` builds each entry of the
multi-line form, returning a `WatermarkLine`. See the [Chart container](chart.md) page for the full
`tvl.chart` API.

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.watermark
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.watermark_image
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.watermark_line
```
