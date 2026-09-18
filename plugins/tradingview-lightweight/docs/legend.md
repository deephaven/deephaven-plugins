# Legend

A legend is a fixed panel in the chart's top-left corner listing each series with its color, its title, and its value at the cursor. Turn it on by passing `legend=tvl.legend()` to `tvl.chart(...)`:

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

Unlike the [tracking tooltip](tooltip.md), the legend does not follow the cursor and does not wait for one. It is populated the moment the chart paints, showing each series' most recent value, and switches to the values under the crosshair as you move across the plot. Move off the chart and it returns to the latest values.

Each row's label comes from that series' `title=`. A series without one falls back to its generated id (`series_0`), and a `by=` series uses its partition key — see [series titles](titles.md).

## Legend or tooltip?

They answer different questions, and they compose:

- A **legend** shows every series at once, in a fixed spot. Use it to compare series, or to keep a readout visible while you look elsewhere.
- A **tooltip** shows one series, next to the cursor. Use it to inspect a specific point without moving your eyes off it.

Enabling both is reasonable on a dense chart. The tooltip draws above the legend where they overlap in the corner.

## Two layouts

`variant` selects the layout, and defaults to `"auto"`: a chart with a single static series gets the large `detailed` readout, anything else gets `rows`.

### Rows

`rows` gives one entry per series — a color swatch, the title, and the value:

```python order=chart,stocks
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()

chart = tvl.chart(
    tvl.line(stocks, timestamp="Timestamp", value="Price", title="Price"),
    legend=tvl.legend(variant="rows"),
)
```

Values are laid out on a grid, so they align in a single column and keep their place as digits change. Every number the legend draws uses tabular figures, so a value ticking from `9.99` to `10.00` doesn't shift anything around it.

### Detailed

`detailed` is a large single-series readout — title, value, and time in oversized type — for a single-symbol chart or a dashboard tile read from a distance:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="AEROSPACE"),
    legend=tvl.legend(variant="detailed"),
)
```

On a multi-series chart `detailed` shows whichever series the cursor is nearest, which mostly duplicates the tracking tooltip. That is why `auto` only picks it for a one-series chart.

A `by=` chart always resolves `auto` to `rows`. Its series are created as partition keys arrive, so it starts as one series and grows — auto-detection would flip the layout out from under you mid-stream.

## Vertical or horizontal

`orientation` controls how rows flow. The default `"vertical"` stacks them; `"horizontal"` lays them out as wrapping chips, which suits a wide chart with several short labels:

```python order=chart,stocks
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()

chart = tvl.chart(
    tvl.line(stocks, timestamp="Timestamp", value="Price", by="Sym"),
    legend=tvl.legend(orientation="horizontal"),
)
```

Chips sit in uniform grid cells, so a wrap happens at a cell boundary rather than mid-chip and the row never reshuffles as values tick.

## Any series type

Every series type gets a row, so an [area](area.md) chart legends exactly like a line one — each swatch takes its own series' resolved color, whether that comes from a line color or an area's fill:

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

The legend sits directly on the chart with no panel or border behind it, so it reads as part of the plot rather than a box covering it.

## Many series

A partitioned chart can produce far more series than fit in a corner. `max_rows` caps how many rows are drawn — six by default — and the rest collapse into a `+N more` line:

```python order=chart,stocks
import deephaven.plot.tradingview_lightweight as tvl

stocks = tvl.data.stocks()

chart = tvl.chart(
    tvl.line(stocks, timestamp="Timestamp", value="Price", by="Sym"),
    legend=tvl.legend(max_rows=2),
)
```

`tvl.data.stocks()` has three symbols, so this draws two rows and a `+1 more`.

The cap does not hide anything from you: the series under the cursor is always drawn, taking the last row's place rather than adding one. Hover any line and its value appears in the legend, even when it sits past the cap — and because a promoted row replaces one instead of extending the list, the legend's height never changes as you move the cursor.

## Candlestick and bar rows

An OHLC series has four numbers at each point, not one, so its row expands to all four:

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

The candlestick row reads `O 89.97  H 91.97  L 86.29  C 88.29` while the VWAP line beside it keeps a single value. That is a wide row, so on a narrow chart you can collapse it to just the close with `show_ohlc=False`:

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

Line, area, baseline, and histogram rows are unaffected either way.

Both examples pair the candlestick with a second series on purpose. A chart holding nothing but one candlestick resolves `variant="auto"` to `detailed`, which still shows all four values — just in the large readout rather than a row.

## Toggling series on and off

Legend rows are clickable by default. Clicking one hides that series; clicking again brings it back. The hidden row stays in the legend, dimmed and struck through, so nothing becomes unreachable. Hiding a series also drops it from the price scale's autoscale, so hiding an outlier rescales the chart around what's left.

Rows are real buttons, so they are reachable by keyboard and carry their pressed state for screen readers.

Pass `interactive=False` for a read-only legend:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index"),
    legend=tvl.legend(interactive=False),
)
```

There is one trade-off worth knowing. An interactive row has to receive mouse events, so the crosshair and the tracking tooltip do not update while the cursor is directly over a row. The gaps between rows and the time line stay transparent, and the effect is confined to the legend's own corner, but it is why `interactive=False` exists for charts where uninterrupted crosshair tracking matters more than toggling.

To start a series hidden, set `visible=False` on the series itself. With an interactive legend that is a starting state rather than a permanent one — the row is there to switch it back on:

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

The chart hides and shows series by itself; nothing needs to round-trip to Python for the click to work. When you want the server to know anyway — to mirror the state into another chart, persist a view, or update a side panel — wire `on_series_toggle`:

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

The handler receives a `TvlSeriesToggleEvent` dict (or no argument at all, like every other TVL handler — see [events](events.md)):

| Key               | Value                                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| `type`            | Always `"seriesToggle"`.                                                        |
| `series`          | Friendly id: the series' title, or its `by=` key, falling back to `series_<n>`. |
| `seriesId`        | The generated `series_<n>` id — stable across title and key changes.            |
| `visible`         | `True` when the series was just shown, `False` when hidden.                     |
| `hiddenSeriesIds` | Generated ids of every currently hidden series, after this toggle.              |

Use `seriesId` as the key when you store state; `series` is for display, and it changes if the title does. Reading `hiddenSeriesIds` saves you from tracking each event to reconstruct the full picture.

Enabling the handler is what puts the event on the wire. A legend with no `on_series_toggle` sends nothing.

## A fixed latest-value readout

By default the legend tracks the crosshair, swapping to each series' value at the hovered time. `follow_cursor=False` turns that off: the legend then always shows the latest value and ignores the cursor completely.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index"),
    legend=tvl.legend(follow_cursor=False),
    tooltip=tvl.tooltip(),
)
```

This is worth pairing with a [tooltip](tooltip.md), as above: the tooltip owns the hover readout and the legend stays a stable "where is it now" display. It also suits a wallboard or a dashboard tile nobody is hovering, where a legend that only reacts to a cursor is doing nothing useful.

## Formatting values

Each value is formatted by its own series' price format, so the legend always agrees with the price axis. The legend has no formatting options of its own — to change the decimals it shows, set [`price_format`](price-formats.md) on the series and the legend follows:

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

The legend is a single panel in the chart's top-left listing every series, including ones drawn in other panes. On a [multi-pane](multi-pane.md) chart it therefore sits over the first pane while naming series below it. Per-pane legends are not available yet.

## Colors

Legend colors are not configurable. The panel itself follows the active Deephaven theme, and each swatch takes its series' own resolved color, so a legend matches its chart without being told to.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.legend
```
