# Tracking Tooltip

A tracking tooltip is a small overlay that follows the cursor and shows the value under it. Turn it on by passing `tooltip=tvl.tooltip()` to `tvl.chart(...)`:

```python skip-test
import deephaven.plot.tradingview_lightweight as tvl

data = tvl.data.values()

chart = tvl.chart(
    tvl.line(data, timestamp="Timestamp", value="Value", title="Price"),
    tooltip=tvl.tooltip(),
)
```

`tooltip=True` is shorthand for the same thing, and `tooltip=False` is the same as leaving it out:

```python skip-test
chart = tvl.chart(tvl.line(data, timestamp="Timestamp", value="Value"), tooltip=True)
```

The tooltip box appears near the cursor as you move across the chart, showing the series title, its value at that time, and the time itself. It hides automatically when the cursor leaves the plot area.

## A single focused series

The tooltip always shows exactly one series: the one in focus. In a single-series chart that is the series you plotted. In a multi-series chart the focused series is whichever line is vertically nearest the cursor within the time slice under it: the chart reads each series' value at that time and picks the one closest to the cursor's height. As you move the cursor up and down between overlaid lines, the tooltip switches to track whichever line is nearest.

This keeps the tooltip readable no matter how many series you overlay: it is a single, compact box that does not grow with the series count. When you do want every series at once, add a [legend](legend.md) — the two work together. The title line is tinted with the focused series' own color, so you can tell which series the value belongs to.

```python skip-test
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

chart = tvl.chart(
    tvl.line(ohlc, timestamp="Timestamp", value="Close", title="Close"),
    tvl.line(ohlc, timestamp="Timestamp", value="Ema", title="EMA"),
    tooltip=tvl.tooltip(),
)
```

## What the tooltip shows

Passing a tooltip is what turns it on; its arguments refine what each tooltip displays:

| Argument     | Default | Effect                                                                                                  |
| ------------ | ------- | ------------------------------------------------------------------------------------------------------- |
| `show_title` | `True`  | Show the series title line (the series `title`, or its id when untitled), tinted with the series color. |
| `show_value` | `True`  | Show the series value at the cursor. For candlestick and bar series this is the close.                  |
| `show_date`  | `True`  | Show the time/date line, formatted the same way as the time axis.                                       |

```python skip-test
import deephaven.plot.tradingview_lightweight as tvl

data = tvl.data.values()

chart = tvl.chart(
    tvl.line(data, timestamp="Timestamp", value="Value", title="Price"),
    tooltip=tvl.tooltip(
        show_date=False,     # value only, no time line
    ),
)
```

The value is formatted by the focused series' own price format, so the tooltip agrees with the price axis; set [`price_format`](price-formats.md) on the series to change its decimals.

## Colors come from the theme

The tooltip has no color options. Its background, text, and border are drawn from the active Deephaven theme so it always matches the rest of the UI, in light and dark themes alike. The one piece of per-series color is the title line, which is tinted automatically with the focused series' color. If you restyle a series' color, its tooltip title follows.

## Tooltip and crosshair

The tooltip tracks the chart's crosshair, so it works together with `tvl.crosshair(mode=...)`. With the default magnet crosshair the reported value snaps to the nearest data point; with `tvl.crosshair(mode="normal")` it follows the cursor freely. The tooltip works with any crosshair mode; the mode only changes which point the value is read from.

```python skip-test
import deephaven.plot.tradingview_lightweight as tvl

data = tvl.data.values()

chart = tvl.chart(
    tvl.line(data, timestamp="Timestamp", value="Value", title="Price"),
    tooltip=tvl.tooltip(),
    crosshair=tvl.crosshair(mode="magnet"),
)
```

## API Reference

The tooltip is configured with a grouped object: `tvl.tooltip(...)` returns a
`Tooltip` that you pass to `tooltip=` on `tvl.chart(...)`. For the full
`tvl.chart` signature, see the [Chart container](chart.md#api-reference) page.

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.tooltip
```
