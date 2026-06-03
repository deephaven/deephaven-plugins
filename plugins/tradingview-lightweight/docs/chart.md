# The Chart Container

`tvl.chart()` is the container that hosts one or more series and carries every chart-level option — pane layout, axes, time scale, styling, watermark, titles. Each per-type constructor (`tvl.line`, `tvl.candlestick`, `tvl.area`, `tvl.bar`, `tvl.baseline`, `tvl.histogram`) returns a one-series `TvlChart`. Pass any number of them positionally to `tvl.chart()` and the series are concatenated into a single composed chart with chart-level options applied on top.

A standalone per-type call (e.g. `tvl.line(table, ...)`) is just shorthand for `tvl.chart(tvl.line(table, ...))` with default chart options. The moment you need *any* chart-level option, wrap the series call in `tvl.chart(..., option=value)`.

## A composed multi-series, multi-pane chart

The example below combines the two most common composition patterns in one snippet: a candlestick price series and a moving-average line on the same upper pane, plus a histogram volume series on a stretched lower pane. It also threads through a few chart-level options so the role of `tvl.chart()` is concrete.

```python order=composed,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

bars = tvl.candlestick(ohlc, pane=0)
ema = tvl.line(
    ohlc, timestamp="Timestamp", value="Ema",
    color="#ff9800", line_width=2, pane=0, title="EMA(20)",
)
volume = tvl.histogram(
    ohlc, timestamp="Timestamp", value="Volume",
    color="rgba(120,120,120,0.5)", pane=1, title="Volume",
)

composed = tvl.chart(
    bars,
    ema,
    volume,
    pane_stretch_factors=[3, 1],
    crosshair_mode="magnet",
    time_visible=True,
)
```

Three series, two panes, one shared time axis. `pane=0` / `pane=1` route series into panes; `pane_stretch_factors=[3, 1]` makes the price pane three times the height of the volume pane; the remaining kwargs are pure chart-level styling.

## Configure the chart

`tvl.chart()` accepts the full chart-level option set. The pages below drill into each option group.

**Compose**
- [Multiple series](multi-series.md) — overlaying several series on one chart.
- [Multiple panes](multi-pane.md) — stacking panes inside one chart frame.
- [Multiple axes](multiple-axes.md) — independent price scales on one pane.

**Annotate**
- [Titles and legends](titles-legends.md) — chart title (via watermark) and the in-chart legend driven by per-series `title=`.
- [Markers](markers.md) — circles, squares, or arrows attached to a series at specific points in time to flag events.
- [Price lines](price-lines.md) — horizontal lines drawn across a series at a fixed or table-driven price level.
- [Watermark](watermark.md) — faint label drawn behind the data, for the ticker symbol, dataset name, or chart title.

**Style**
- [Styling](styling.md) — colors, fonts, grid, crosshair, layout.
- [Time scale](time-scale.md) — the horizontal axis.
- [Price scale](price-scale.md) — the vertical axes.
- [Price formats](price-formats.md) — number formatting on price labels.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.chart
```
