<!-- coverage-seen-elsewhere:
  price_formatter -> price-formats.md
  tickmarks_price_formatter -> price-formats.md
  percentage_formatter -> price-formats.md
  tickmarks_percentage_formatter -> price-formats.md
  watermark_text -> watermark.md
  watermark_lines -> watermark.md
  watermark_image_url -> watermark.md
  right_price_scale_mode -> price-scale.md
  left_price_scale_mode -> price-scale.md
  default_visible_price_scale_id -> multiple-axes.md
  time_visible -> time-scale.md
  seconds_visible -> time-scale.md
  right_offset -> time-scale.md
  bar_spacing -> time-scale.md
  pane_stretch_factors -> multi-pane.md
  pane_preserve_empty -> multi-pane.md
  pane_separator_color -> multi-pane.md
-->

# Styling and Layout

The TVL chart accepts dozens of chart-level keyword arguments that control how the chart looks before any series is drawn: background colors, grid lines, crosshair behavior, fonts, and pane separators. Use this page when you want to match a brand palette, build a light/dark theme, or restyle the cursor and grid for a denser dashboard.

All styling kwargs in this guide live on `chart()` and on every convenience factory (`candlestick()`, `line()`, etc.). The chart wrapper accepts a compact subset of the styling parameters (background, text color, crosshair, watermark); the full surface lives on `chart()`.

## What are the styling options useful for?

- **Theming**: Build a light and dark palette by toggling background, text, and grid colors; the same chart code renders against either theme.
- **Matching a brand**: Override gradients, grid lines, and crosshair color to keep charts on-brand inside an existing UI.
- **Dense dashboards**: Tune font size, grid visibility, and pane separators so several charts can sit side by side without visual clutter.
- **Accessibility**: Adjust contrast and crosshair visibility for users who need higher-contrast or focus-style cues.

## Examples

### Apply a dark theme

The simplest theme switch is three colors: background, text, and grid. Pass them to `chart()` and the whole surface re-renders against the new palette. The grid uses the `vert_lines_*` / `horz_lines_*` families so you can color and style the two axes independently.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    background_color="#1e1e1e",
    text_color="#e0e0e0",
    vert_lines_color="#2a2a2a",
    horz_lines_color="#2a2a2a",
)
```

Pair `background_color` with `text_color` so axis labels stay legible against the new background.

### Build a vertical gradient background

To render a gradient, swap `background_color` for the `background_top_color` / `background_bottom_color` pair. TVL renders a vertical gradient between the two stops. The two arguments must be used together; supplying only one falls back to the solid background path.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

chart = tvl.chart(
    tvl.area(values, timestamp="Timestamp", value="Value"),
    background_top_color="#0d1b2a",
    background_bottom_color="#1b263b",
    text_color="#e0e1dd",
    vert_lines_color="#22304a",
    horz_lines_color="#22304a",
)
```

The `ColorType` enum values (`"solid"`, `"gradient"`) are inferred from which background arguments you set; there is no explicit `color_type` kwarg. The example above selects the gradient path:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

# ColorType is inferred — the constants are shown here only for reference.
color_type = "gradient"  # vs. "solid"
chart = tvl.chart(
    tvl.area(values, timestamp="Timestamp", value="Value"),
    background_top_color="#0d1b2a",
    background_bottom_color="#1b263b",
)
```

### Customize grid lines

The grid is two independent sets of lines: vertical (time-axis grid) and horizontal (price-axis grid). Each has visibility, color, and `LineStyle` controls. Use `horz_lines_visible=False` to hide one set while keeping the other.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    vert_lines_visible=True,
    vert_lines_color="#3a3a3a",
    vert_lines_style="dashed",
    horz_lines_visible=True,
    horz_lines_color="#3a3a3a",
    horz_lines_style="dotted",
)
```

`LineStyle` accepts `"solid"`, `"dotted"`, `"dashed"`, `"large_dashed"`, and `"sparse_dotted"`.

### Switch crosshair mode: normal, magnet, or hidden

The `CrosshairMode` enum controls how the cursor crosshair behaves on hover. `"normal"` follows the pointer freely; `"magnet"` snaps to the nearest data point; `"hidden"` removes the crosshair entirely. The fourth value, `"magnet_ohlc"`, snaps to the nearest OHLC point on candlestick / bar charts.

```python order=normal,magnet,magnet_ohlc,hidden,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

normal = tvl.chart(tvl.line(values, timestamp="Timestamp", value="Value"), crosshair_mode="normal")
magnet = tvl.chart(tvl.line(values, timestamp="Timestamp", value="Value"), crosshair_mode="magnet")
magnet_ohlc = tvl.chart(tvl.line(values, timestamp="Timestamp", value="Value"), crosshair_mode="magnet_ohlc")
hidden = tvl.chart(tvl.line(values, timestamp="Timestamp", value="Value"), crosshair_mode="hidden")
```

Use `"magnet"` for sparse data where exact-point readouts matter; `"normal"` for continuous-feeling cursor tracking on dense data.

### Tune the crosshair line and label

Beyond the mode, every crosshair line and label has its own color, width, style, and visibility kwargs. The vertical (`crosshair_vert_line_*`) line crosses the time axis and the horizontal (`crosshair_horz_line_*`) line crosses the price axis.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    crosshair_mode="normal",
    crosshair_vert_line_color="#ffc857",
    crosshair_vert_line_width=2,
    crosshair_vert_line_style="dashed",
    crosshair_vert_line_label_visible=True,
    crosshair_vert_line_label_background_color="#ffc857",
    crosshair_horz_line_color="#ffc857",
    crosshair_horz_line_width=2,
    crosshair_horz_line_style="dotted",
    crosshair_horz_line_label_background_color="#ffc857",
)
```

`crosshair_do_not_snap_to_hidden_series` is helpful in magnet mode when you want the crosshair to ignore series the user has toggled off.

### Hover the active series on top

`hovered_series_on_top` re-orders the z-stack so the series the cursor is currently over draws above its siblings. The default is `True`, but you can disable it for fixed-layer charts where draw order needs to be deterministic.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", color="#ef4444"),
    tvl.line(values.update(["Value = Value + 10"]), timestamp="Timestamp", value="Value", color="#3b82f6"),
    hovered_series_on_top=True,
)
```

This pairs well with crosshair `"magnet"` mode, since the snapped-to series moves to the top automatically.

### Set the chart font

`font_size` controls the base axis-label font size in pixels. The font family is inherited from the host page; TVL does not expose a per-chart font-family override, since chart text is rendered to canvas and uses the closest available system stack.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    font_size=14,
    text_color="positive",
)
```

Increase `font_size` for dashboard tiles viewed from a distance, or shrink it to fit dense small-multiples layouts.

### TradingView attribution logo

This plugin hides the lightweight-charts attribution logo by default. Upstream says users should include the NOTICE attribution and a TradingView link on a page available to users; the built-in logo is one way to satisfy the link requirement. Set `attribution_logo=True` to show it.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    attribution_logo=True,
)
```

### Pick a wide-gamut color space

`color_space` selects the underlying canvas color space. The default `"srgb"` matches what every browser ships; `"display-p3"` opts in to the wide-gamut P3 space on capable displays, which gives richer reds and greens. Use it when your design system specifies P3 colors.

```python order=chart,standard,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    color_space="display-p3",
    background_color="#0a0a0a",
)

# Pin sRGB explicitly when you want predictable cross-display output.
standard = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    color_space="srgb",
    background_color="#0a0a0a",
)
```

The two `ColorSpace` enum values are `"srgb"` and `"display-p3"`.

### Control scroll and zoom interactions

The `handle_scroll_*` and `handle_scale_*` families enable or disable specific input gestures, such as mouse wheel zoom, touch drag, and double-click reset. The top-level `handle_scroll` and `handle_scale` booleans short-circuit all sub-options.

```python order=chart,tap_exit,values
import deephaven.plot.tradingview_lightweight as tvl
values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    handle_scroll_mouse_wheel=True,
    handle_scroll_pressed_mouse_move=True,
    handle_scale_pinch=True,
    handle_scale_axis_double_click_reset=True,
    kinetic_scroll_mouse=False,
    tracking_mode_exit_mode="on_touch_end",
)

# Alternative: exit tracking mode on the next tap anywhere on the chart.
tap_exit = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    tracking_mode_exit_mode="on_next_tap",
)
```

`TrackingModeExitMode` accepts `"on_touch_end"` and `"on_next_tap"`.

### Switch last-price animation modes

`LastPriceAnimationMode` controls the pulse animation on the last-price marker for line / area / baseline series (candlestick / bar / histogram don't have it). Use `"disabled"` for static snapshots, `"continuous"` to make the marker pulse continuously while the chart is visible, and `"on_data_update"` to pulse only when new data arrives.

The kwarg lives on the series factory, not on the chart-styling wrapper, so set it directly on `tvl.line` (or `area` / `baseline`):

```python order=disabled_chart,pulsing_chart,on_update_chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

disabled_chart = tvl.line(values, timestamp="Timestamp", value="Value", last_price_animation="disabled")
pulsing_chart = tvl.line(values, timestamp="Timestamp", value="Value", last_price_animation="continuous")
on_update_chart = tvl.line(values, timestamp="Timestamp", value="Value", last_price_animation="on_data_update")
```

The three values map directly to the `LastPriceAnimationMode` Literal alias. Use `"disabled"` wherever snapshot determinism matters; the other two introduce time-dependent rendering.

## API Reference

For the full `tvl.chart` signature, see the [Chart container](chart.md#api-reference) page.
