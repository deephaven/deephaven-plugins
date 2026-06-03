# Watermark

A watermark is a faint label drawn behind the data of a chart — typically the ticker symbol, the dataset name, or the title of the chart. Reach for a watermark when you want chart context that doesn't compete with the price action for attention.

There are two ways to add a watermark. The single-line shortcut uses `tvl.chart(watermark_text=..., watermark_color=..., ...)`. The multi-line form takes a list of [`tvl.watermark_line(...)`](#api-reference) entries via `watermark_lines=[...]`, one per row of text, each with its own color, font size, line height, and font style.

<!-- coverage-seen-elsewhere:
  watermark_visible -> exercised below
  watermark_image_* -> not yet exercised; covered by docstring on chart()
-->

## What watermarks are useful for?

- **Branding the chart**: A ticker symbol or dataset name in the background tells the viewer what they're looking at without occupying a corner.
- **Stating context**: A two-line watermark can show e.g. `AAPL` above and `Daily` below — instrument plus timeframe.
- **Styling for theme**: Adjusting color and font-style lets a watermark blend with light or dark themes.
- **Positioning to taste**: `watermark_horz_align` and `watermark_vert_align` cover the nine canonical anchor points on the chart.

## Examples

### Add a simple single-line watermark

The shortest watermark: just `watermark_text`. Defaults take care of color, font size, and alignment.

```python order=basic_watermark,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc)
basic_watermark = tvl.chart(price, watermark_text="AAPL")
```

The chart shows `AAPL` faintly centered behind the price.

### Style the single-line watermark

The single-line path bundles the styling options directly on `tvl.chart()`: color, font size, font style (italic/normal/etc.), line height, and visibility.

```python order=styled_watermark,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc)

styled_watermark = tvl.chart(
    price,
    watermark_text="AAPL",
    watermark_color="rgba(25,118,210,0.25)",
    watermark_font_size=80,
    watermark_font_style="italic",
    watermark_line_height=1.0,
    watermark_visible=True,
)
```

The watermark is now a large, semi-transparent, italicized blue label.

### Multi-line watermark

For two or more lines, switch to `watermark_lines=[...]`. Each entry is built with `tvl.watermark_line(...)` and renders as its own line of text with optional per-line styling — color, font size, line height, and font style.

```python order=multi_watermark,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc)

lines = [
    tvl.watermark_line(
        "AAPL",
        color="rgba(25,118,210,0.35)",
        font_size=72,
        line_height=80.0,
    ),
    tvl.watermark_line(
        "Daily",
        color="rgba(120,120,120,0.45)",
        font_size=32,
        line_height=40.0,
        font_style="italic",
    ),
]

multi_watermark = tvl.chart(price, watermark_lines=lines)
```

Two lines, two styles. The single-line shortcut and `watermark_lines` are mutually exclusive — pick one.

### Position the watermark

`watermark_horz_align` accepts `"left"`, `"center"`, `"right"` (the values of `HorzAlign`). `watermark_vert_align` accepts `"top"`, `"center"`, `"bottom"` (the values of `VertAlign`). Together they give nine anchor positions; here we cover every value of each enum across three charts.

```python order=top_left,top_center,top_right,middle_left,middle_center,middle_right,bottom_left,bottom_center,bottom_right,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

def _wm(horz, vert):
    return tvl.chart(
        tvl.candlestick(ohlc),
        watermark_text=f"{horz}/{vert}",
        watermark_color="rgba(25,118,210,0.35)",
        watermark_font_size=40,
        watermark_horz_align=horz,
        watermark_vert_align=vert,
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

`watermark_visible=False` keeps the configuration but skips drawing. Useful when toggling a watermark on and off without rebuilding the chart configuration.

```python order=hidden_watermark,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc)
hidden_watermark = tvl.chart(
    price,
    watermark_text="AAPL",
    watermark_color="rgba(25,118,210,0.35)",
    watermark_visible=False,
)
```

The chart shows no watermark even though `watermark_text` is set.

### Image watermark

In addition to text, the chart accepts an image watermark (logo or background graphic). Set `watermark_image_url` and tune `watermark_image_max_width`, `watermark_image_max_height`, `watermark_image_padding`, and `watermark_image_alpha`. The image-watermark path is independent from the text-watermark path; both can coexist.

```python order=image_watermark,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc)
image_watermark = tvl.chart(
    price,
    watermark_image_url="https://www.deephaven.io/img/dh-community-logo.svg",
    watermark_image_max_width=200,
    watermark_image_max_height=80,
    watermark_image_padding=12,
    watermark_image_alpha=0.2,
    watermark_image_visible=True,
)
```

The Deephaven logo appears behind the data at 20% opacity.

## API Reference

The watermark options live on `tvl.chart()` (single-line shortcut + image options) — see the [Chart container](chart.md) page for the full `tvl.chart` API. `tvl.watermark_line(...)` builds each entry of the multi-line form.

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.watermark_line
```
