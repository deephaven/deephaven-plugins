# Series Titles

Every series function takes a `title=` argument that names the series.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
shifted = values.update_view(["Value = Value + 10"])

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", title="Index", color="#2563eb"),
    tvl.line(shifted, timestamp="Timestamp", value="Value", title="Index +10", color="#dc2626"),
)
```

## Where a title appears

A series title appears in four places:

- The price-scale badge that shows the series' latest value, with the title next to the number. On a chart with no tooltip or legend, this is the only place the title is shown.
- The [tracking tooltip](tooltip.md)'s first line, tinted with the series color.
- Each [legend](legend.md) row's label.
- [Press events](events.md), which name the series under the cursor in `hoveredSeries` and key `seriesData` by it.

Without a title, the badge shows only the number, and the other three use the generated id (`series_0`, `series_1`, and so on). Set a title on any chart with more than one series.

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

`visible=False` hides a series. Without an interactive legend, it stays hidden. With an [interactive legend](legend.md#toggling-series-on-and-off), the viewer can click the series' row to show it:

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

To title a whole chart, put it in a `ui.panel` and set the panel's `title`:

```python skip-test
from deephaven import ui
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

my_panel = ui.panel(
    tvl.chart(tvl.line(values, timestamp="Timestamp", value="Value", title="Index")),
    title="USD / EUR",
)
```

The title appears in the panel tab, like any other panel in the dashboard.

> [!TIP]
> Don't use a [watermark](watermark.md) as a chart title. A watermark is drawn faintly behind the data and can overlap your series. It is meant for a brand, a disclaimer, or an environment name like "staging".

## API Reference

For the full `tvl.chart` signature, see the [Chart container](chart.md#api-reference) page.
