# Series Titles

Every series factory takes a `title=`. It is the series' human-readable name, and it is what the chart reaches for anywhere a series has to identify itself.

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

A title set once does four things:

- **The price-scale label.** The badge that tracks each series' latest value on the price axis carries the title alongside the number. This happens with no other configuration — it is the one place a title appears on a plain chart.
- **The [tracking tooltip](tooltip.md).** The tooltip's first line is the focused series' title, tinted with that series' color.
- **The [legend](legend.md).** Each legend row is labeled with its series' title.
- **[Press events](events.md).** A press payload identifies the series under the cursor by title, in `hoveredSeries`, and keys `seriesData` by it.

Without a title, all four fall back to the series' generated id — `series_0`, `series_1`, and so on. That is serviceable on a single-series chart, where there is nothing to disambiguate, and poor on anything else.

For a `by=` chart you don't set a title at all: each partition is titled with its key, so a `by="Sym"` chart labels its series `AAPL`, `MSFT`, and so on. A title set on a partitioned series is replaced by the key.

## Hiding the last-value badge

`last_value_visible=False` removes a series' price-axis badge. Use it for reference overlays where the live number is noise — a moving average over candles, a static threshold line — while keeping the title for the tooltip and legend:

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

Only the badge goes; the series still draws, and still appears in the tooltip and legend.

## Starting a series hidden

`visible=False` starts a series hidden. On its own that is a permanent choice made in Python. Paired with an [interactive legend](legend.md#toggling-series-on-and-off) it becomes an initial state the viewer can switch:

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

TVL has no chart-title option, because in Deephaven a chart is displayed inside a panel that already has a name. Title the panel:

```python skip-test
from deephaven import ui
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

my_panel = ui.panel(
    tvl.chart(tvl.line(values, timestamp="Timestamp", value="Value", title="Index")),
    title="USD / EUR",
)
```

That puts the title in the panel tab, where a title belongs: outside the plot area, consistent with every other panel in the dashboard, and legible without competing with the data.

A [watermark](watermark.md) is not a chart title. It is a background mark — a brand, a disclaimer, an environment name like "staging", an "as of" stamp — deliberately styled to recede behind the data. Pressing one into service as a heading gives you a title that is faint by design, overlaps your series, and is invisible to anything that reads panel names.

## API Reference

For the full `tvl.chart` signature, see the [Chart container](chart.md#api-reference) page.
