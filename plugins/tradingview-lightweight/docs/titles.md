# Series Titles

Every series factory takes a `title=`: the series' name, used wherever a series has to identify itself.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
shifted = values.update_view(["Value = Value + 10"])

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index", color="#2563eb"),
    tvl.line(shifted, timestamp="Timestamp", value="Value", title="Index +10", color="#dc2626"),
)
```

## Where a title shows up

One title covers four places:

- The price-scale badge tracking the series' latest value, which carries the title next to the number. This is the one place a title shows on a plain chart.
- The [tracking tooltip](tooltip.md)'s first line, tinted with the series color.
- Each [legend](legend.md) row's label.
- [Press events](events.md), which name the series under the cursor in `hoveredSeries` and key `seriesData` by it.

Without a title the badge shows just the number. The other three fall back to the generated id, `series_0` and so on: fine on a single-series chart, poor on anything else.

A `by=` chart needs no title: each partition is titled with its key, so `by="Sym"` labels its series `AAPL`, `MSFT`, and so on. A title set on a partitioned series is replaced by the key.

## Hiding the last-value badge

`last_value_visible=False` removes a series' price-axis badge. Use it for reference overlays where the live number is noise, like a moving average over candles, while keeping the title for the tooltip and legend:

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
shifted = values.update_view(["Value = Value + 10"])

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Main", color="#2563eb"),
    tvl.line(
        shifted,
        timestamp="Timestamp",
        value="Value",
        title="Reference",
        color="#94a3b8",
        last_value_visible=False,
    ),
)
```

Only the badge goes; the series still draws and still appears in the tooltip and legend.

## Starting a series hidden

`visible=False` starts a series hidden. On its own that is a permanent choice made in Python. Paired with an [interactive legend](legend.md#toggling-series-on-and-off) it becomes an initial state the viewer can change:

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

## Titling a whole chart

TVL has no chart-title option, because a Deephaven chart is displayed inside a panel that already has a name. Title the panel:

```python skip-test
from deephaven import ui
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

my_panel = ui.panel(
    tvl.chart(tvl.line(values, timestamp="Timestamp", value="Value", title="Index")),
    title="USD / EUR",
)
```

That puts the title in the panel tab, outside the plot area and consistent with every other panel in the dashboard.

A [watermark](watermark.md) is not a chart title. It is a background mark (a brand, a disclaimer, an environment name like "staging") styled to recede behind the data. Press one into service as a heading and you get a title that is faint by design, overlaps your series, and is invisible to anything that reads panel names.

## API Reference

For the full `tvl.chart` signature, see the [Chart container](chart.md#api-reference) page.
