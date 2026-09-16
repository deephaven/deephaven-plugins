# Gallery

A single dashboard that renders the whole TVL surface at once: every chart type,
the composition primitives, the annotation layers, the styling knobs, and the
three numeric-axis variants.

Layout is handled by [`deephaven.ui`](https://deephaven.io/core/docs/deephaven-ui/):
each group is a `ui.panel` inside a single `ui.dashboard`, and the charts within a
panel are arranged with `ui.flex`.

---

## The gallery

```python order=gallery
import deephaven.plot.tradingview_lightweight as tvl
from deephaven import ui

ohlc = tvl.data.ohlc()
values = tvl.data.values()
volume = tvl.data.volume()
stocks = tvl.data.stocks()

# ---- Chart types -----------------------------------------------------------
line = tvl.line(values, timestamp="Timestamp", value="Value")
area = tvl.area(values, timestamp="Timestamp", value="Value")
baseline = tvl.baseline(values, timestamp="Timestamp", value="Value", base_value=60.0)
histogram = tvl.histogram(volume, timestamp="Timestamp", value="Volume")
candlestick = tvl.candlestick(ohlc)
bars = tvl.bar(ohlc)

# ---- Composition -----------------------------------------------------------
overlay = tvl.chart(
    tvl.candlestick(ohlc),
    tvl.line(ohlc, timestamp="Timestamp", value="Ema", title="EMA"),
)

two_panes = tvl.chart(
    tvl.candlestick(ohlc),
    tvl.histogram(ohlc, timestamp="Timestamp", value="Volume", pane=1),
    pane_stretch_factors=[3, 1],
)

two_axes = tvl.chart(
    tvl.line(ohlc, timestamp="Timestamp", value="Close", title="Close (right)"),
    tvl.histogram(
        ohlc,
        timestamp="Timestamp",
        value="Volume",
        title="Volume (left)",
        price_scale_id="left",
    ),
    left_price_scale=tvl.price_scale(visible=True),
)

grouped = tvl.line(stocks, timestamp="Timestamp", value="Price", by="Sym")

# ---- Annotations -----------------------------------------------------------
with_markers = tvl.candlestick(
    ohlc,
    markers=[
        tvl.marker(time="2024-01-05", position="below_bar", shape="arrow_up", text="Buy"),
        tvl.marker(time="2024-01-12", position="above_bar", shape="arrow_down", text="Sell"),
    ],
)

with_price_lines = tvl.line(
    values,
    timestamp="Timestamp",
    value="Value",
    price_lines=[
        tvl.price_line(70.0, title="Target"),
        tvl.price_line(45.0, title="Stop"),
    ],
)

with_watermark = tvl.chart(
    tvl.area(values, timestamp="Timestamp", value="Value"),
    watermark=tvl.watermark(text="DEEPHAVEN"),
)

with_tooltip = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    tooltip=tvl.tooltip(visible=True),
    crosshair=tvl.crosshair(mode="magnet"),
)

# ---- Styling ---------------------------------------------------------------
themed_candles = tvl.candlestick(
    ohlc, up_color="seafoam-500", down_color="purple-500", wick_up_color="seafoam-500"
)

dashed_line = tvl.line(
    values,
    timestamp="Timestamp",
    value="Value",
    color="accent-400",
    line_width=3,
    line_style="dashed",
)

stepped_line = tvl.line(
    values, timestamp="Timestamp", value="Value", line_type="with_steps"
)

gradient_area = tvl.area(
    values,
    timestamp="Timestamp",
    value="Value",
    line_color="#26a69a",
    top_color="rgba(38, 166, 154, 0.5)",
    bottom_color="rgba(38, 166, 154, 0)",
)

percent_format = tvl.line(
    values,
    timestamp="Timestamp",
    value="Value",
    price_format=tvl.price_format(type="percent", precision=1),
)

wide_bars = tvl.chart(
    tvl.candlestick(ohlc),
    time_scale=tvl.time_scale(bar_spacing=14, right_offset=6),
)

# ---- Axes and aggregation --------------------------------------------------
# Aggregate 360 trades into weekly bins entirely in the query engine.
binned = tvl.histogram(
    stocks,
    timestamp="Timestamp",
    value="Size",
    agg="sum",
    auto_bin=True,
    bin_width="P7D",
)

# The same data with a time-proportional axis (default) and without it. The
# weekend holes are visible on the left chart and collapse on the right.
continuous_axis = tvl.candlestick(ohlc, title="continuous (default)")
ordinal_axis = tvl.candlestick(ohlc, continuous=False, title="continuous=False")

curve = tvl.yield_curve(tvl.data.yields(), maturity="Tenor", value="Yield")

options = tvl.options_chart(tvl.data.options_chain(), strike="Strike", value="CallBid")

numeric = tvl.custom_numeric(values.update(["X = (double)Index"]), x="X", value="Value")


def row(*charts):
    return ui.flex(*charts, direction="row")


gallery = ui.dashboard(
    ui.column(
        ui.row(
            ui.panel(
                ui.flex(
                    row(line, area, baseline),
                    row(histogram, candlestick, bars),
                    direction="column",
                ),
                title="Chart types",
            ),
            ui.panel(
                ui.flex(
                    row(overlay, two_panes),
                    row(two_axes, grouped),
                    direction="column",
                ),
                title="Compose",
            ),
        ),
        ui.row(
            ui.panel(
                ui.flex(
                    row(with_markers, with_price_lines),
                    row(with_watermark, with_tooltip),
                    direction="column",
                ),
                title="Annotate",
            ),
            ui.panel(
                ui.flex(
                    row(themed_candles, dashed_line, stepped_line),
                    row(gradient_area, percent_format, wide_bars),
                    direction="column",
                ),
                title="Style",
            ),
            ui.panel(
                ui.flex(
                    row(binned, continuous_axis, ordinal_axis),
                    row(curve, options, numeric),
                    direction="column",
                ),
                title="Axes",
            ),
        ),
    )
)
```

## What each panel shows

**Chart types** — the six time-axis series: [line](line.md), [area](area.md),
[baseline](baseline.md), [histogram](histogram.md), [candlestick](candlestick.md),
and [bar](bar.md).

**Compose** — [`tvl.chart`](chart.md) takes any number of series. Passing several
gives an overlay; adding `pane=` stacks them into separate
[panes](multi-pane.md) sized by `pane_stretch_factors`; `price_scale_id="left"`
splits them across [two axes](multiple-axes.md); and `by=` expands one series
into [one line per key](multi-series.md).

**Annotate** — [markers](markers.md) pinned to timestamps, horizontal
[price lines](price-lines.md), a [watermark](watermark.md) behind the plot, and
the cursor-following [tracking tooltip](tooltip.md).

**Style** — theme color names and hex/rgba both work anywhere a color is taken
(see [styling](styling.md)); line width, dash pattern, and step interpolation are
per-series; [price formats](price-formats.md) change how values print on the axis;
and [`tvl.time_scale`](time-scale.md) controls bar spacing and the right-edge
offset.

**Axes** — `auto_bin=True` reduces raw rows into time buckets server-side (see
[autobin](autobin.md)); `continuous` toggles the time-proportional axis, which is
what spaces the bars by elapsed time in the middle chart; and
[yield curve](yield-curve.md), [options chart](options-chart.md), and
[custom numeric](custom-numeric.md) swap the time axis for a numeric one.

## Notes

- `ui.flex` distributes space evenly, so a row of three charts is narrower than a
  row of two. Charts render at whatever size they are given and re-fit on resize.
  Drag the panel dividers to give a section more room.
- Fixtures come from [`tvl.data`](example-data.md). They tick once per second by
  default; pass `ticking=False` to any of them for a static snapshot.
- The `continuous` comparison is easiest to read on data with uneven spacing.
  The default chart spaces its bars by elapsed time while `continuous=False`
  spaces them evenly.
