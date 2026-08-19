<!-- coverage-seen-elsewhere:
  default_visible_price_scale_id -> multiple-axes.md
  price_scale_id (per-series) -> multiple-axes.md
  scale_mode (per-series) -> multiple-axes.md
  watermark_text -> watermark.md
-->

# Price Scale

The price scale is the vertical axis. Most charts have one, the right scale by default, but TVL also supports a left scale, any number of overlay scales, and per-series scale binding. Each scale has its own mode (`"normal"`, `"logarithmic"`, `"percentage"`, `"indexed_to_100"`), auto-scale toggle, margins, and tick density.

Use this page when you want to plot two series with different units, render returns instead of prices, leave room at the top of the chart for annotations, or just hide a scale.

## What are the price-scale options useful for?

- **Multi-unit overlays**: Plot price on the right scale and volume on the left; each scale auto-fits its own series.
- **Return analysis**: Switch the scale mode to `"percentage"` or `"indexed_to_100"` to compare instruments with different absolute prices.
- **Log-scale charts**: Use `"logarithmic"` mode for assets that move in percentage terms across multiple decades.
- **Annotation room**: Increase `margin_top` to leave whitespace above the data for markers and price-line labels.

## Examples

### Pick a scale mode: all four `PriceScaleMode` values

`PriceScaleMode` accepts `"normal"`, `"logarithmic"`, `"percentage"`, and `"indexed_to_100"`. `"normal"` is linear; `"logarithmic"` plots log of the value; `"percentage"` renders each point as a percent change from the first visible value; `"indexed_to_100"` renormalizes so the first visible point is exactly 100.

```python order=normal,logarithmic,percentage,indexed_to_100,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

normal = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    right_price_scale=tvl.price_scale(mode="normal"),
)

logarithmic = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    right_price_scale=tvl.price_scale(mode="logarithmic"),
)

percentage = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    right_price_scale=tvl.price_scale(mode="percentage"),
)

indexed_to_100 = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    right_price_scale=tvl.price_scale(mode="indexed_to_100"),
)
```

`"percentage"` and `"indexed_to_100"` are relative to the visible window: pan the chart and the reference point updates.

### Set margins to leave headroom

The `margin_top` and `margin_bottom` fields on `price_scale()` are fractions in `[0, 1]` reserving whitespace at the top and bottom of the plot area. The defaults are around 0.2 / 0.1; bump `margin_top` higher to leave room for marker labels.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    right_price_scale=tvl.price_scale(margin_top=0.3, margin_bottom=0.1),
)
```

The same `margin_top` / `margin_bottom` apply when you pass a `price_scale()` to the `left_price_scale=` or `overlay_price_scale=` slots.

### Default the visible scale to the left

`default_visible_price_scale_id` accepts `"left"` or `"right"`. It sets the scale every new series binds to _unless_ the series explicitly sets `price_scale_id`. The default is `"right"`; set it to `"left"` to flip the convention.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    default_visible_price_scale_id="left",
    left_price_scale=tvl.price_scale(visible=True),
    right_price_scale=tvl.price_scale(visible=False),
)
```

For multi-axis layouts where some series have explicit `price_scale_id` and others don't, this kwarg sets the default fallback. See [multiple-axes](multiple-axes.md) for full multi-axis patterns.

### Style the left price scale independently

The same `price_scale()` object configures any slot — pass one to `left_price_scale=` to style the left axis independently, with its own text colors, borders, and tick visibility.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", price_scale_id="left"),
    left_price_scale=tvl.price_scale(
        visible=True,
        border_visible=True,
        border_color="#888",
        text_color="#a0a0a0",
        ticks_visible=True,
        minimum_width=60,
        align_labels=True,
        invert_scale=False,
        entire_text_only=True,
        ensure_edge_tick_marks_visible=True,
    ),
    right_price_scale=tvl.price_scale(visible=False),
)
```

`entire_text_only=True` is handy when tick labels would otherwise be clipped at the chart edge.

### Tune tick-mark density

The `tick_mark_density` field on `price_scale()` sets the tick _spacing_, so it reads inverted: a **lower** value renders **more** ticks, a **higher** value **fewer**. The default is around 2.5. It applies to whichever slot you pass the object to (`left_price_scale=`, `overlay_price_scale=`).

```python order=sparse,dense,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

sparse = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    right_price_scale=tvl.price_scale(tick_mark_density=4.0),
)

dense = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    right_price_scale=tvl.price_scale(tick_mark_density=1.5),
)
```

Use sparse density on narrow dashboard tiles, dense on full-screen analytical charts.

### Apply overlay-scale defaults

When a series binds to a numeric overlay scale (e.g. `price_scale_id="vol"`), TVL falls back to the `overlay_price_scale=` defaults. Pass a `price_scale()` whose styling applies to every overlay scale unless the series overrides it.

```python order=chart,volume
import deephaven.plot.tradingview_lightweight as tvl

volume = tvl.data.volume()

chart = tvl.chart(
    tvl.histogram(volume, timestamp="Timestamp", value="Volume", price_scale_id="vol", scale_margin_top=0.7),
    overlay_price_scale=tvl.price_scale(
        border_visible=True,
        border_color="#aaa",
        text_color="#a0a0a0",
        ticks_visible=True,
        minimum_width=40,
        margin_top=0.7,
        margin_bottom=0.0,
        auto_scale=True,
        mode="normal",
        invert_scale=False,
        align_labels=True,
        entire_text_only=True,
        ensure_edge_tick_marks_visible=True,
        tick_mark_density=2.0,
    ),
)
```

This is the standard "price + volume" pattern, where the histogram lives on a stub overlay scale at the bottom.

### Invert the price scale

`invert_scale=True` on the price scale flips the axis top-to-bottom. Useful when plotting interest rate spreads where convention is "low rate at top, high rate at bottom" (or for some yield analytics).

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    right_price_scale=tvl.price_scale(invert_scale=True),
)
```

### Per-series scale options vs. chart-level

Each per-type constructor also accepts `scale_margin_top`, `scale_margin_bottom`, `scale_mode`, `scale_invert`, etc. Series-level options take precedence over chart-level for the scale that series binds to, which helps when you want one overlay scale styled differently from another.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.line(
    values,
    timestamp="Timestamp",
    value="Value",
    scale_mode="logarithmic",
    scale_margin_top=0.25,
    scale_margin_bottom=0.15,
    auto_scale=True,
    scale_invert=False,
    scale_align_labels=True,
    scale_border_visible=True,
    scale_border_color="#888",
    scale_text_color="#a0a0a0",
    scale_entire_text_only=True,
    scale_visible=True,
    scale_ticks_visible=True,
    scale_minimum_width=60,
    scale_ensure_edge_tick_marks_visible=True,
)
```

If you set `scale_mode` per-series and `mode` on the chart's `price_scale`, the per-series mode wins. The remaining `scale_*` options mirror their `price_scale()` fields but bind to whichever scale the series uses.

### Style the baseline reference line

In `"percentage"` and `"indexed_to_100"` modes the scale draws a horizontal reference line at the base value. `base_line_visible`, `base_line_color`, `base_line_width`, and `base_line_style` style that line (these are per-series options).

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(
        values,
        timestamp="Timestamp",
        value="Value",
        base_line_visible=True,
        base_line_color="#888",
        base_line_width=2,
        base_line_style="dashed",
    ),
    right_price_scale=tvl.price_scale(mode="indexed_to_100"),
)
```

## API Reference

Chart-level price scales are configured with `tvl.price_scale(...)`, which returns
a `PriceScale`. Pass the result to `right_price_scale=`, `left_price_scale=`, or
`overlay_price_scale=` on `tvl.chart(...)`; one instance can be reused across slots.
For the full `tvl.chart` signature, see the [Chart container](chart.md#api-reference) page.

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.price_scale
```
