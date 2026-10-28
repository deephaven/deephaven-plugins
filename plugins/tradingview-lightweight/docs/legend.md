# Legend

A legend is a fixed overlay in the chart's top-left corner listing each series with its color, title, and value at the cursor. Turn it on with `legend=tvl.legend()`:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
shifted = values.update_view(["Value = Value + 10"])

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index"),
    tvl.line(shifted, timestamp="Timestamp", value="Value", title="Index +10"),
    legend=tvl.legend(),
)
```

`legend=True` is shorthand for the same thing, and `legend=False` is the same as leaving it out:

```python skip-test
chart = tvl.chart(tvl.line(values, timestamp="Timestamp", value="Value"), legend=True)
```

The legend shows each series' latest value when the chart loads. As you move the cursor across the plot it shows the values at the hovered time, and it goes back to the latest values when the cursor leaves. A series with no point at the hovered time shows a blank value. The time line at the bottom shows which time the values are from.

Each row's label comes from that series' `title=`. A series without one falls back to its generated id (`series_0`), and a `by=` series uses its partition key. See [series titles](titles.md).

## Legend or tooltip?

A legend shows every series at once in a fixed spot. A [tooltip](tooltip.md) shows one series next to the cursor. You can turn on both.

## Layout variants

`variant` selects the layout. It defaults to `"auto"`: a chart with a single static series gets the large `detailed` readout, anything else gets `rows`.

### Rows

`rows` gives one entry per series: a color swatch, the title, and the value.

```python order=chart,stocks
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()

chart = tvl.chart(
    tvl.line(stocks, timestamp="Timestamp", value="Price", title="Price"),
    legend=tvl.legend(variant="rows"),
)
```

### Detailed

`detailed` is a large single-series readout, with title, value, and time in oversized type, for a single-symbol chart or a dashboard tile read from a distance.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="AEROSPACE"),
    legend=tvl.legend(variant="detailed"),
)
```

On a multi-series chart, `detailed` shows the series nearest the cursor, or the first series when the cursor is off the chart.

A `by=` chart always resolves `auto` to `rows`, even while it has only one partition.

## Orientation

`orientation` controls how rows flow. The default `"vertical"` stacks them. `"horizontal"` lays them out as wrapping chips, which suits a wide chart with short labels.

```python order=chart,stocks
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()

chart = tvl.chart(
    tvl.line(stocks, timestamp="Timestamp", value="Price", by="Sym"),
    legend=tvl.legend(orientation="horizontal"),
)
```

## Series types

Every series type gets a row. The swatch color depends on the series type: the line color for line and area series, the bar color for histograms, the top line color for baseline series, and the up color for candlestick and bar series.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
floor = values.update_view(["Value = Value * 0.92"])

chart = tvl.chart(
    tvl.area(values, timestamp="Timestamp", value="Value", title="Coverage"),
    tvl.line(floor, timestamp="Timestamp", value="Value", title="Floor"),
    legend=tvl.legend(),
)
```

## Limit the number of rows

A partitioned chart can have more series than fit in the corner. `max_rows` sets how many rows are shown (six by default). The rest collapse into a `+N more` button, which expands the full list when clicked.

```python order=chart,stocks
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()

chart = tvl.chart(
    tvl.line(stocks, timestamp="Timestamp", value="Price", by="Sym"),
    legend=tvl.legend(max_rows=2),
)
```

`tvl.data.stocks()` has three symbols, so this draws two rows and a `+1 more`.

When you hover a series that is past the cap, it takes the place of the last row, so the legend stays the same height.

If the chart is too short to fit the rows, the legend lists every series in a scrolling list instead. Scroll it with the mouse wheel over the legend. While the list is showing, the crosshair and wheel zoom don't respond under the legend.

## Candlestick and bar series

An OHLC series has four numbers at each point, so its row expands to all four.

```python order=chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()
vwap = ohlc.update_view(["Vwap = (High + Low + Close) / 3"])

chart = tvl.chart(
    tvl.candlestick(ohlc, timestamp="Timestamp", title="ES futures"),
    tvl.line(vwap, timestamp="Timestamp", value="Vwap", title="VWAP"),
    legend=tvl.legend(),
)
```

The candlestick row reads `O 89.97  H 91.97  L 86.29  C 88.29` and the VWAP row shows one value. On a narrow chart, use `show_ohlc=False` to show only the close:

```python order=chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()
vwap = ohlc.update_view(["Vwap = (High + Low + Close) / 3"])

chart = tvl.chart(
    tvl.candlestick(ohlc, timestamp="Timestamp", title="ES futures"),
    tvl.line(vwap, timestamp="Timestamp", value="Vwap", title="VWAP"),
    legend=tvl.legend(show_ohlc=False),
)
```

`show_ohlc` affects only candlestick and bar rows.

A chart with a single candlestick series resolves `auto` to `detailed`, which shows the four values in the large layout.

## Toggling series on and off

Legend rows are clickable by default. Click a row to hide its series, and click it again to show it. A hidden series keeps its row, dimmed with its value struck through. Hidden series are left out of the price scale's auto-fit, so hiding an outlier rescales the chart to the remaining series.

Rows are buttons, so you can also toggle them from the keyboard, and screen readers announce whether each one is pressed.

Pass `interactive=False` for a read-only legend:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index"),
    legend=tvl.legend(interactive=False),
)
```

An interactive row captures the mouse, so the crosshair and tooltip stop updating while the cursor is over a row. The gaps between rows pass the mouse through to the chart.

To start a series hidden, set `visible=False` on the series. With an interactive legend, the viewer can click the row to show it:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
shifted = values.update_view(["Value = Value + 5"])

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Primary"),
    tvl.line(
        shifted,
        timestamp="Timestamp",
        value="Value",
        title="Optional overlay",
        visible=False,
    ),
    legend=tvl.legend(),
)
```

### Reacting to a toggle on the server

Toggling works without any Python code. If the server needs to know, for example to save which series are hidden, pass an `on_series_toggle` handler:

```python skip-test
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
hidden = set()


def remember(event):
    if event["visible"]:
        hidden.discard(event["seriesId"])
    else:
        hidden.add(event["seriesId"])


chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index"),
    legend=tvl.legend(),
    on_series_toggle=remember,
)
```

The handler receives a `TvlSeriesToggleEvent` dict, or no argument at all, like every other TVL handler (see [events](events.md)):

| Key               | Value                                                                                                      |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `type`            | Always `"seriesToggle"`.                                                                                   |
| `series`          | Friendly id: the series' title, or its `by=` key, falling back to the generated id.                        |
| `seriesId`        | The generated id: `series_<n>` for a series passed to the chart, `series_<n>_<key>` for a `by=` partition. |
| `visible`         | `True` when the series was just shown, `False` when hidden.                                                |
| `hiddenSeriesIds` | Generated ids of every currently hidden series, after this toggle.                                         |

Key saved state by `seriesId`, not `series`, because `series` changes when the title does. A partition's `seriesId` includes its key, so `series_0_AAPL` is the same every time the chart loads. Use `hiddenSeriesIds` to get the full set of hidden series without tracking each event.

## Show only the latest values

By default the legend follows the crosshair. With `follow_cursor=False` it always shows each series' latest value and ignores the cursor.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index"),
    legend=tvl.legend(follow_cursor=False),
    tooltip=tvl.tooltip(),
)
```

The example above adds a [tooltip](tooltip.md) for hover values, while the legend keeps showing the latest ones.

## Formatting values

Legend values use each series' price format. To change the number of decimals, set [`price_format`](price-formats.md) on the series:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(
        values,
        timestamp="Timestamp",
        value="Value",
        title="Index",
        price_format=tvl.price_format(precision=4, min_move=0.0001),
    ),
    legend=True,
)
```

Set `show_time=False` to hide the time line at the bottom:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index"),
    legend=tvl.legend(show_time=False),
)
```

## Multi-pane charts

On a [multi-pane](multi-pane.md) chart, the legend sits over the first pane and lists the series from every pane.

## Colors

Each swatch uses its series color. In the `detailed` layout, the title is also drawn in the series color. All other legend text uses Deephaven theme colors. The legend has no background or border, except for a translucent backdrop while the full `+N more` list is expanded.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.legend
```
