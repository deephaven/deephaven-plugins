# Price Lines

A price line is a horizontal line drawn across a series at a specific price — the visual equivalent of "draw a line at $100 across the chart". Reach for price lines when you need to annotate fixed levels (entry, stop, target, strike) or track a live, table-driven value such as a moving threshold.

There are two ways to build a price line. Use [`tvl.price_line()`](#api-reference) for a static level (`price=100`) or for a Deephaven-extension column-driven level (`column="ThresholdCol"`) where the line tracks the last row of a named column as the table ticks. The returned `PriceLine` object goes onto a series via the `price_lines=` argument.

## What are price lines useful for?

- **Marking levels**: Entry, stop, and target levels on a trade can be drawn as static price lines so they sit alongside the candlestick body.
- **Showing thresholds**: A risk threshold or alert level becomes a single horizontal line on the chart pane.
- **Following live values**: A column-driven price line tracks the most recent row of a table — perfect for "current best bid" or "current VWAP" on a ticking stream.
- **Annotating with labels**: Each price line carries a `title` (drawn on the pane) and an axis label (with its own colors), making the level self-describing.

## Examples

### Add a simple horizontal line at a price

The minimal price line. Pass it to a series via `price_lines=[...]`.

```python order=simple_line,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

target = tvl.price_line(price=104.0, color="#2e7d32")

price = tvl.candlestick(ohlc, price_lines=[target])
simple_line = tvl.chart(price)
```

A green horizontal line sits at 104.0 across the entire chart.

### Style a price line

Most visual properties of a `PriceLine` are independent: color, width, dashing, and whether the line itself is drawn. The supported widths are `1`, `2`, `3`, `4`; styles come from `LineStyle` (`"solid"`, `"dotted"`, `"dashed"`, `"large_dashed"`, `"sparse_dotted"`).

```python order=styled_line,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

styled = tvl.price_line(
    price=104.0,
    color="#d32f2f",
    line_width=3,
    line_style="dashed",
    line_visible=True,
    id="stop-loss",
)

price = tvl.candlestick(ohlc, price_lines=[styled])
styled_line = tvl.chart(price)
```

A dashed red line at 104.0, three pixels wide.

### Add a title and an axis label

The `title` is drawn next to the line on the chart pane. The axis label (which sits on the price scale) is controlled by `axis_label_visible`, `axis_label_color`, and `axis_label_text_color`.

```python order=labeled_line,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

labeled = tvl.price_line(
    price=98.0,
    color="#1976d2",
    line_width=2,
    line_style="solid",
    title="Support",
    axis_label_visible=True,
    axis_label_color="#1976d2",
    axis_label_text_color="#ffffff",
)

price = tvl.candlestick(ohlc, price_lines=[labeled])
labeled_line = tvl.chart(price)
```

The line is labeled `Support` on the chart and `98.00` on the axis (with a blue background).

### Draw many price lines at once

A list of price lines can be attached to one series. This is the natural way to show a set of strikes, ladder levels, or stop placements.

```python order=ladder_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

ladder = [
    tvl.price_line(price=p, color=c, line_style=style, title=label)
    for p, c, style, label in [
        (104.0, "#2e7d32", "solid",       "Target"),
        (102.0, "#558b2f", "dotted",      "Trim"),
        (100.0, "#1976d2", "dashed",      "Entry"),
        ( 98.0, "#ef6c00", "large_dashed","Trail stop"),
        ( 96.0, "#c62828", "sparse_dotted","Hard stop"),
    ]
]

price = tvl.candlestick(ohlc, price_lines=ladder)
ladder_chart = tvl.chart(price)
```

Five horizontal lines, each using a different `LineStyle` value, label the trading ladder. Notice the loop covers all five styles in `LineStyle`.

### Hide the line, keep the axis label

`line_visible=False` removes the horizontal stroke from the pane but keeps the axis label on the price scale — useful when you want a value annotation without cluttering the chart body.

```python order=labelonly_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

invisible = tvl.price_line(
    price=100.0,
    line_visible=False,
    axis_label_visible=True,
    axis_label_color="#1976d2",
    axis_label_text_color="#ffffff",
    title="Par",
    id="par-level",
)

price = tvl.candlestick(ohlc, price_lines=[invisible])
labelonly_chart = tvl.chart(price)
```

The chart shows the axis tag for 100.00 with no line drawn through the pane.

### Track a live column value

The Deephaven extension to `price_line()`: pass `column=` instead of `price=` and the line tracks the last row of that column. When the source table ticks, the price line moves automatically.

```python order=live_line,ohlc_w_avg,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()
# Running mean — last row is the current value.
ohlc_w_avg = ohlc.update_view(["AvgClose = avg(Close)"])

live = tvl.price_line(
    column="AvgClose",
    color="#ef6c00",
    line_width=2,
    line_style="solid",
    title="avg(Close)",
)

price = tvl.candlestick(ohlc_w_avg, price_lines=[live])
live_line = tvl.chart(price)
```

The orange line tracks the running mean of `Close`. It is mutually exclusive with `price=`; setting both, or neither, raises `ValueError`.

### Pick the source for the built-in last-price line

Separate from user-added price lines, every series has an automatic "last price" horizontal line. The `price_line_source` argument (a `PriceLineSource` enum value) picks whether it follows the last bar or the last visible bar. Set it on the series factory.

```python order=source_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

# Follow the last bar in the data, regardless of scroll position.
last_bar = tvl.line(
    ohlc, timestamp="Timestamp", value="Close",
    color="#1976d2",
    price_line_visible=True,
    price_line_source="last_bar",
    price_line_color="#1976d2",
    price_line_width=2,
    price_line_style="dotted",
)

# Follow the last visible bar — moves as you scroll.
last_visible = tvl.line(
    ohlc, timestamp="Timestamp", value="Open",
    color="#d32f2f",
    price_line_visible=True,
    price_line_source="last_visible",
    price_line_color="#d32f2f",
    price_line_width=2,
    price_line_style="dashed",
)

source_chart = tvl.chart(last_bar, last_visible)
```

Two series with different `price_line_source` values demonstrate both members of the `PriceLineSource` enum (`"last_bar"`, `"last_visible"`).

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.price_line
```
