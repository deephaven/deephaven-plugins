# Legend

A legend is a fixed panel in the chart's top-left corner listing each series with its color, title, and value at the cursor. Turn it on with `legend=tvl.legend()`:

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

Unlike the [tracking tooltip](tooltip.md), the legend does not wait for a cursor. It shows each series' latest value as soon as the chart paints, switches to the values under the crosshair as you move across the plot, and returns to the latest values when you move off. A series with no point at the hovered time shows a blank value, not its latest one. The time line at the bottom names the time the values belong to: the hovered time under the crosshair, and at rest the latest time among the displayed rows. A series that ticks less often shows its last value as of that moment.

Each row's label comes from that series' `title=`. A series without one falls back to its generated id (`series_0`), and a `by=` series uses its partition key. See [series titles](titles.md).

## Legend or tooltip?

A legend shows every series at once in a fixed spot; a tooltip shows one series next to the cursor. Enabling both is reasonable on a dense chart, and the tooltip draws above the legend where they overlap.

## Two layouts

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

Values sit on a grid in one column and use tabular figures, so a value ticking from `9.99` to `10.00` shifts nothing around it.

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

On a multi-series chart `detailed` shows whichever series is nearest the cursor, which mostly duplicates the tooltip. That is why `auto` only picks it for a one-series chart.

A `by=` chart always resolves `auto` to `rows`. Its series appear as partition keys arrive, so it starts as one series and grows; auto-detection would flip the layout mid-stream.

## Vertical or horizontal

`orientation` controls how rows flow. The default `"vertical"` stacks them. `"horizontal"` lays them out as wrapping chips, which suits a wide chart with short labels.

```python order=chart,stocks
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()

chart = tvl.chart(
    tvl.line(stocks, timestamp="Timestamp", value="Price", by="Sym"),
    legend=tvl.legend(orientation="horizontal"),
)
```

Chips sit in uniform grid cells, so a wrap happens at a cell boundary and the row never reshuffles as values tick.

## Any series type

Every series type gets a row, and each swatch takes its series' resolved color, whether that comes from a line color or an area fill.

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

## Many series

A partitioned chart can produce more series than fit in a corner. `max_rows` caps how many rows are drawn, six by default, and the rest collapse into a `+N more` line.

```python order=chart,stocks
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()

chart = tvl.chart(
    tvl.line(stocks, timestamp="Timestamp", value="Price", by="Sym"),
    legend=tvl.legend(max_rows=2),
)
```

`tvl.data.stocks()` has three symbols, so this draws two rows and a `+1 more`.

The cap hides nothing. Hover any line and its value appears even if it sits past the cap, taking the last row's place rather than adding one, so the legend's height never changes as you move the cursor.

## Candlestick and bar rows

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

The candlestick row reads `O 89.97  H 91.97  L 86.29  C 88.29` while the VWAP line keeps a single value. That is a wide row, so on a narrow chart collapse it to the close with `show_ohlc=False`:

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

Both examples pair the candlestick with a second series on purpose: a lone candlestick resolves `auto` to `detailed`, which shows the same four values in the large readout instead.

## Toggling series on and off

Legend rows are clickable by default. Clicking one hides that series; clicking again brings it back. The hidden row stays, dimmed and struck through, so nothing becomes unreachable. Hiding a series also drops it from the price scale's autoscale, so hiding an outlier rescales the chart around what is left.

Rows are real buttons, so they work from the keyboard and carry their pressed state for screen readers.

Pass `interactive=False` for a read-only legend:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index"),
    legend=tvl.legend(interactive=False),
)
```

One trade-off: an interactive row receives mouse events, so the crosshair and tooltip freeze while the cursor sits directly over a row. Gaps between rows stay transparent, so the effect is confined to the rows themselves.

To start a series hidden, set `visible=False` on the series. With an interactive legend that is a starting state rather than a permanent one, since the row can switch it back on:

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

The chart hides and shows series itself; nothing round-trips to Python for the click to work. To let the server know anyway, say to mirror the state into another chart or persist a view, wire `on_series_toggle`:

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

Store state against `seriesId`; `series` is for display and changes if the title does. A partition's `seriesId` includes its key, so `series_0_AAPL` is `series_0_AAPL` every time the chart loads. `hiddenSeriesIds` saves reconstructing the full picture from individual events.

A legend with no `on_series_toggle` sends nothing over the wire.

## A fixed latest-value readout

By default the legend tracks the crosshair, swapping to each series' value at the hovered time. `follow_cursor=False` turns that off: the legend then always shows the latest value and ignores the cursor.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index"),
    legend=tvl.legend(follow_cursor=False),
    tooltip=tvl.tooltip(),
)
```

Pair it with a [tooltip](tooltip.md), as above, so the tooltip owns the hover readout and the legend stays a stable latest-value display. It also suits a wallboard nobody is hovering.

## Formatting values

The legend has no formatting options. Each value uses its series' price format, so to change the decimals set [`price_format`](price-formats.md) on the series:

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

Set `show_time=False` to drop the shared time line at the bottom, for instance when the time axis is already unambiguous:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index"),
    legend=tvl.legend(show_time=False),
)
```

## Multiple panes

One legend lists every series, including those drawn in other panes, so on a [multi-pane](multi-pane.md) chart it sits over the first pane while naming series below it. Per-pane legends are not available yet.

## Colors

Legend colors are not configurable. The text follows the active Deephaven theme and each swatch takes its series' resolved color. There is no panel or border behind it, so it reads as part of the plot rather than a box covering it.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.legend
```
