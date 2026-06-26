# Multi-Pane Charts

A multi-pane chart stacks several panes vertically inside one chart frame. Each pane has its own price scale, but they share the time axis along the bottom. Use panes when two series have incompatible value ranges (e.g. price in dollars vs. RSI in 0-100) or when you want to separate price action from indicators.

The pane that a series lives in is set per series via the `pane` argument on every per-type constructor (or on the [convenience chart functions](#api-reference) like `tvl.line()`, `tvl.histogram()`). Per-chart options control how panes stretch, whether they survive when emptied, and what the separator between them looks like.

<!-- coverage-seen-elsewhere:
  price_scale_id -> multiple-axes.md
  markers -> markers.md
  price_lines -> price-lines.md
  watermark_* -> watermark.md
-->

## What are multi-pane charts useful for?

- **Mixing scales**: Price in dollars and RSI in [0, 100] don't fit on one axis. Stack them so each gets its own price scale without clobbering the other.
- **Decluttering**: An indicator like MACD becomes unreadable when crammed into the price pane. A dedicated pane gives it room.
- **Layered context**: Volume below price is a near-universal trading convention; panes encode this convention directly.
- **Stable layouts on ticking data**: `pane_preserve_empty` keeps a pane visible even when its data hasn't arrived yet, so your dashboard layout doesn't jump around.

## Examples

### Stack price and volume into two panes

This is the canonical pattern: price on top, volume on the bottom, sharing a time scale. Pass `pane=0` (the default) for the upper pane and `pane=1` for the lower.

```python order=price_volume,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc, pane=0)
volume = tvl.histogram(
    ohlc, timestamp="Timestamp", value="Volume",
    color="rgba(102,187,106,0.6)",
    pane=1,
)

price_volume = tvl.chart(price, volume)
```

The two panes share the time axis but have independent price scales. The volume pane scales to its own min/max automatically.

### Add a third pane for an indicator

You aren't limited to two panes. Add as many as you need; each `pane=N` introduces a new pane below the previous one.

```python order=three_pane,ohlc_rsi,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()
# A fake "RSI-like" indicator just to fill the pane.
ohlc_rsi = ohlc.update_view([
    "Rsi = 50.0 + Math.sin(ii * 0.15) * 30.0",
])

price = tvl.candlestick(ohlc_rsi, pane=0)
volume = tvl.histogram(
    ohlc_rsi, timestamp="Timestamp", value="Volume", pane=1,
    color="rgba(120,120,120,0.5)",
)
rsi = tvl.line(
    ohlc_rsi, timestamp="Timestamp", value="Rsi", color="#ab47bc",
    pane=2, title="RSI",
)

three_pane = tvl.chart(price, volume, rsi)
```

The three panes stack top-to-bottom in the same order as their `pane` indices.

### Customize height ratios

`pane_stretch_factors` is a list of weights (one per pane) that controls how vertical space is distributed. Default is equal weighting; bumping the price pane's factor gives it more room.

```python order=stretched_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc, pane=0)
volume = tvl.histogram(
    ohlc, timestamp="Timestamp", value="Volume", pane=1,
    color="rgba(120,120,120,0.5)",
)

# Price gets 3 units of vertical space; volume gets 1.
stretched_chart = tvl.chart(price, volume, pane_stretch_factors=[3, 1])
```

A `[3, 1]` ratio makes the price pane three times as tall as the volume pane, regardless of the chart's outer height.

### Preserve a pane when it's empty

`pane_preserve_empty` is a list of booleans (one per pane) controlling whether a pane remains visible when its data is empty (no rows yet, or filtered away). Useful when a downstream table hasn't ticked yet but the layout should still allocate space.

```python order=preserve_chart,ohlc_filter,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()
# Filter the volume away to demonstrate the empty pane.
ohlc_filter = ohlc.where("Volume > 9999999")  # always empty

price = tvl.candlestick(ohlc, pane=0)
volume = tvl.histogram(
    ohlc_filter, timestamp="Timestamp", value="Volume", pane=1,
    color="rgba(120,120,120,0.5)",
)

preserve_chart = tvl.chart(
    price, volume,
    pane_stretch_factors=[3, 1],
    pane_preserve_empty=[False, True],  # keep the empty volume pane visible
)
```

Without `pane_preserve_empty=[..., True]`, an empty pane collapses and the chart auto-resizes; with it, the layout is stable while you wait for the data.

### Style the pane separator

The thin bar between panes is styled by `pane_separator_color`, `pane_separator_hover_color`, and `pane_enable_resize`.

```python order=styled_pane,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

price = tvl.candlestick(ohlc, pane=0)
volume = tvl.histogram(
    ohlc, timestamp="Timestamp", value="Volume", pane=1,
    color="rgba(120,120,120,0.5)",
)

styled_pane = tvl.chart(
    price, volume,
    pane_separator_color="#1976d2",
    pane_separator_hover_color="#42a5f5",
    pane_enable_resize=True,
)
```

When `pane_enable_resize=True` (the default), the user can drag the separator to rebalance the panes; setting it to `False` locks the ratio at whatever `pane_stretch_factors` produced.

## API Reference

The chart entry point is `tvl.chart()`. The pane-related options it accepts are `pane_stretch_factors`, `pane_preserve_empty`, `pane_separator_color`, `pane_separator_hover_color`, and `pane_enable_resize`. Series factories all accept a `pane` keyword.

For the full `tvl.chart` signature, see the [Chart container](chart.md#api-reference) page.

```{eval-rst}
```

```{eval-rst}
```
