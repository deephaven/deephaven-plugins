<!-- coverage-seen-elsewhere:
  watermark_text -> watermark.md
  crosshair_mode -> styling.md
  background_color -> styling.md
-->

# Time Scale

The time scale is the horizontal axis at the bottom of a chart. TVL exposes its visibility, label density, border, tick formatting, scroll offset, and the underlying time-value model (UTC timestamps vs. business days) through the `tvl.time_scale(...)` object, which you pass to `chart(time_scale=...)`. Additional options (`BusinessDay`, `business_day()`, `is_business_day()`, `is_utc_timestamp()`) are available for when you need to work outside numeric timestamps.

## What are the time-scale options useful for?

- **Trading-day charts**: Skip non-business days so a five-day work week and ten holidays per year stop pushing data off-screen.
- **Aligning multiple charts**: Pin the right edge with `fix_right_edge` so two charts stacked vertically share a consistent time anchor.
- **Live tail UX**: `right_offset` reserves whitespace on the right so the freshest bar isn't glued to the price scale.
- **Dense time axes**: `tick_mark_max_character_length` and `uniform_distribution` keep labels readable on narrow charts.

## Examples

### Show time and seconds on the axis

The two most common toggles are `time_visible` (show time-of-day on intra-day data) and `seconds_visible` (show seconds when zoomed in tight enough). Set both for high-frequency data.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    time_scale=tvl.time_scale(
        time_visible=True,
        seconds_visible=True,
    ),
)
```

When `time_visible=False`, the axis shows only the date, which suits daily-bar charts.

### Hide the time scale entirely

Set `tvl.time_scale(visible=False)` to hide the bottom axis when you have several stacked panes and only need the axis on the outermost one.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    time_scale=tvl.time_scale(visible=False),
)
```

Combine with `pane_index` (see [multi-pane](multi-pane.md)) to hide the per-pane axis on all but the bottom pane.

### Right-offset whitespace for live charts

`right_offset` adds bars of empty space to the right of the latest data point, keeping the live tip visually separated from the price scale. Use `right_offset_pixels` for a fixed pixel inset instead. All of these live on `tvl.time_scale(...)`.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    time_scale=tvl.time_scale(
        right_offset=12,
        bar_spacing=8,
    ),
)
```

`bar_spacing` (initial pixels per bar) plus `min_bar_spacing` / `max_bar_spacing` (zoom limits) let you set the zoom envelope.

### Pin the visible range edges

`fix_left_edge` and `fix_right_edge` lock the visible range to the data boundaries, so scrolling stops at the first and last bar respectively. `lock_visible_time_range_on_resize` keeps the same logical window when the widget is resized, and `right_bar_stays_on_scroll` keeps the latest bar parked at the right.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    time_scale=tvl.time_scale(
        fix_left_edge=True,
        fix_right_edge=True,
        lock_visible_time_range_on_resize=True,
        right_bar_stays_on_scroll=True,
        shift_visible_range_on_new_bar=False,
    ),
)
```

For live charts you usually want `right_bar_stays_on_scroll=True` and `shift_visible_range_on_new_bar=True` so each new bar slides the viewport.

### Tune tick density

`tick_mark_max_character_length` caps how many characters each tick label can use; the chart will drop ticks until the labels fit. `uniform_distribution` enforces a uniform tick spacing rather than the default "snap to nice intervals" behavior. `minimum_height` reserves vertical space so the time scale doesn't shrink below a usable height.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    time_scale=tvl.time_scale(
        tick_mark_max_character_length=10,
        uniform_distribution=True,
        minimum_height=32,
        ticks_visible=True,
        allow_bold_labels=True,
    ),
)
```

`allow_bold_labels` lets the chart render bold weight at major boundaries (year, month) for emphasis.

### Style the time-scale border

The border between the time scale and the plot area is its own layer. Toggle visibility with `tvl.time_scale(border_visible=...)` and color with `border_color`.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    time_scale=tvl.time_scale(
        border_visible=True,
        border_color="#888",
    ),
)
```

Hide the border for borderless dashboard tiles.

### Conflate sub-pixel points

`enable_conflation=True` merges data points that fall on the same pixel column, trading a little precision for faster rendering on dense charts. `precompute_conflation_on_init=True` does that work upfront at load; `precompute_conflation_priority` (a `PrecomputeConflationPriority` value) sets how eagerly it runs (`"background"`, `"user-visible"`, `"user-blocking"`).

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    time_scale=tvl.time_scale(
        enable_conflation=True,
        precompute_conflation_on_init=True,
        # priority is one of "background", "user-visible", "user-blocking"
        precompute_conflation_priority="background",
    ),
)
```

### Business-day timestamps for trading-hours charts

The `BusinessDay` TypedDict lets you label points without weekends and holidays; the time scale plots business days as equally-spaced ticks regardless of calendar gaps. Use `business_day(year, month, day)` to construct them.

```python
import deephaven.plot.tradingview_lightweight as tvl

# Build a few business-day points
b1 = tvl.business_day(2024, 1, 2)  # Tuesday
b2 = tvl.business_day(2024, 1, 3)  # Wednesday
b3 = tvl.business_day(2024, 1, 4)  # Thursday

print(b1)  # {'year': 2024, 'month': 1, 'day': 2}
```

`BusinessDay` instances are dicts, so they round-trip cleanly through tables and JSON. The companion type-guard helpers, `is_business_day()` and `is_utc_timestamp()`, let you tell business-day points apart from numeric UTC timestamps:

```python
import deephaven.plot.tradingview_lightweight as tvl

bd = tvl.business_day(2024, 1, 2)
ts = 1_704_153_600  # seconds since epoch, UTC

assert tvl.is_business_day(bd)
assert not tvl.is_business_day(ts)
assert tvl.is_utc_timestamp(ts)
assert not tvl.is_utc_timestamp(bd)
```

The two predicates distinguish business-day points from numeric UTC timestamps. The `TickMarkType` Literal alias names the label kinds the time scale renders at each zoom level; TVL picks the right one per tick automatically.

### UTC vs. local timestamps

TVL's underlying renderer treats numeric time values as **seconds since the Unix epoch, UTC**. Deephaven `Instant` columns are encoded with nanosecond precision; the plugin converts them to UTC seconds when serializing. Use `is_utc_timestamp()` to tell raw numeric times apart from `BusinessDay` dicts when writing helpers that accept either.

```python
import deephaven.plot.tradingview_lightweight as tvl


def label_kind(t):
    if tvl.is_business_day(t):
        return "business_day"
    if tvl.is_utc_timestamp(t):
        return "utc_timestamp"
    return "other"


print(label_kind(tvl.business_day(2024, 1, 2)))  # business_day
print(label_kind(1_704_153_600))  # utc_timestamp
print(label_kind("2024-01-02"))  # other
```

Display timezone is a UI concern: the chart renders the same UTC second the same way regardless of the viewer's locale. For "show in NY time", use a chart-level locale or pre-shift the data.

## API Reference

The time scale is configured with a grouped object: `tvl.time_scale(...)`
returns a `TimeScale` that you pass to `time_scale=` on `tvl.chart(...)`.

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.time_scale
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.business_day
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.is_business_day
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.is_utc_timestamp
```

For the full `tvl.chart` signature, see the [Chart container](chart.md#api-reference) page.
