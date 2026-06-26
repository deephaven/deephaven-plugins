# Markers

Markers are small annotations (circles, squares, or arrows) attached to a series at specific points in time. Use them to flag individual events (a fill, a signal, a regime change) directly on the chart without disrupting the underlying price curve.

There are three ways to put markers on a chart. Use [`tvl.marker()`](#api-reference) for static, code-defined markers; [`tvl.markers_from_table()`](#api-reference) when each row of a Deephaven table should become one marker (and tick live as the table updates); and [`tvl.up_down_markers()`](#api-reference) as a convenience for the common "buys are up arrows, sells are down arrows" pattern.

<!-- coverage-seen-elsewhere:
  size / size_column -> exercised below
-->

## What are markers useful for?

- **Annotating fills**: Mark every executed order on the price line so traders can see where positions changed hands.
- **Highlighting signals**: A strategy that generates buy/sell signals can render them as up/down arrows directly on the candlestick.
- **Flagging events**: News releases, earnings announcements, or system events can be pinned to their timestamps as labeled circles.
- **Picking out levels**: Price-based positions (`at_price_top`, `at_price_middle`, `at_price_bottom`) let a marker float independent of the bar: useful for marking option strikes or support/resistance touches.

## Examples

### Add a single static marker

`tvl.marker()` builds one `Marker` object. Pass a list of them via the `markers=` keyword on any per-type constructor.

```python order=single_marker_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

m = tvl.marker(
    time="2024-01-15",
    position="above_bar",
    shape="arrow_down",
    color="#d32f2f",
    text="High",
    size=2,
    id="m1",
)

single_marker_chart = tvl.candlestick(ohlc, markers=[m])
```

The single marker hovers above the bar for 2024-01-15 with a downward red arrow.

### Show every marker shape

`MarkerShape` has four values: `"circle"`, `"square"`, `"arrow_up"`, `"arrow_down"`. The example below puts one of each on a single chart at staggered times.

```python order=shapes_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

shapes = [
    tvl.marker(time="2024-01-05", shape="circle",     color="#1976d2", text="circle"),
    tvl.marker(time="2024-01-15", shape="square",     color="#2e7d32", text="square"),
    tvl.marker(time="2024-01-25", shape="arrow_up",   color="#ef6c00", text="up"),
    tvl.marker(time="2024-02-05", shape="arrow_down", color="#c62828", text="down"),
]

shapes_chart = tvl.line(ohlc, timestamp="Timestamp", value="Close", markers=shapes)
```

The four markers march across the chart, one shape per timestamp.

### Show every marker position

`MarkerPosition` has six values. The three bar-relative positions (`"above_bar"`, `"below_bar"`, `"in_bar"`) anchor to the bar at the given time. The three price-relative positions (`"at_price_top"`, `"at_price_bottom"`, `"at_price_middle"`) float at a specific `price` regardless of the bar.

```python order=positions_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

positions = [
    tvl.marker(time="2024-01-05", position="above_bar",
               shape="arrow_down", text="above_bar"),
    tvl.marker(time="2024-01-10", position="below_bar",
               shape="arrow_up", text="below_bar"),
    tvl.marker(time="2024-01-15", position="in_bar",
               shape="circle", text="in_bar"),
    # Price-based positions need a `price`.
    tvl.marker(time="2024-01-20", position="at_price_top",
               shape="square", price=110.0, text="at_price_top"),
    tvl.marker(time="2024-01-25", position="at_price_middle",
               shape="square", price=100.0, text="at_price_middle"),
    tvl.marker(time="2024-01-30", position="at_price_bottom",
               shape="square", price=90.0, text="at_price_bottom"),
]

positions_chart = tvl.candlestick(ohlc, markers=positions)
```

All six positions render together. The bar-relative ones move with the candle, the price-relative ones lock to their `price`.

### Drive markers from a Deephaven table

`tvl.markers_from_table()` builds a `MarkerSpec` instead of a list. Each row of the table becomes one marker; columns supply per-row values for any property that has a `*_column` parameter. Because the spec keeps a live reference to the table, markers tick when the table updates.

```python order=table_markers_chart,signals,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

# Build a signals table off of the OHLC data: tag every 10th row alternately.
signals = ohlc.update_view([
    "Side = (ii % 20 < 10) ? `BUY` : `SELL`",
    "Pos  = Side == `BUY` ? `below_bar` : `above_bar`",
    "Sym  = Side == `BUY` ? `arrow_up` : `arrow_down`",
    "Col  = Side == `BUY` ? `#2e7d32` : `#c62828`",
    "Lbl  = Side",
]).where("ii % 10 == 0")

spec = tvl.markers_from_table(
    signals, timestamp="Timestamp",
    position_column="Pos",
    shape_column="Sym",
    color_column="Col",
    text_column="Lbl",
    size=1,
    id_column="Side",
)

table_markers_chart = tvl.candlestick(ohlc, marker_spec=spec)
```

Pass the spec via the series' `marker_spec=` argument. As the source table ticks, new markers appear automatically.

### Use fixed defaults with markers_from_table

If every marker shares the same shape and color, omit the per-row column and set the fixed default directly. Mix-and-match is fine. Fixed values fill in for any property without a `*_column`.

```python order=fixed_marker_chart,events,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()
events = ohlc.where("ii % 7 == 0").update_view(["Note = `event ` + i"])

spec = tvl.markers_from_table(
    events, timestamp="Timestamp",
    position="above_bar",   # fixed for every row
    shape="circle",         # fixed for every row
    color="#1976d2",        # fixed
    text_column="Note",     # per-row
    size=2,                 # fixed
)

fixed_marker_chart = tvl.candlestick(ohlc, marker_spec=spec)
```

The chart shows one blue circle per event, each labeled with its row's `Note`.

### Price-driven markers from a table

For `at_price_*` positions, supply a `price_column` so each row's price comes from the data.

```python order=price_marker_chart,levels,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

levels = ohlc.where("ii % 12 == 0").update_view([
    "Level = Close + 2.0",  # mark 2 above the close
])

spec = tvl.markers_from_table(
    levels, timestamp="Timestamp",
    position="at_price_top",
    shape="square",
    color="#ef6c00",
    price_column="Level",
    size_column=None,
)

price_marker_chart = tvl.candlestick(ohlc, marker_spec=spec)
```

The orange squares float at `Level`, independent of the candle's `High`/`Low`.

### Use up_down_markers for buy/sell signals

`tvl.up_down_markers()` is the shortcut for the most common pattern: a list of up timestamps and a list of down timestamps, rendered as arrows below/above the bar with theme-derived colors.

```python order=updown_chart,ohlc
import deephaven.plot.tradingview_lightweight as tvl

ohlc = tvl.data.ohlc()

ups = ["2024-01-05", "2024-01-18", "2024-02-03"]
downs = ["2024-01-12", "2024-01-25", "2024-02-10"]

markers = tvl.up_down_markers(
    up_times=ups,
    down_times=downs,
    up_color="#2e7d32",
    down_color="#c62828",
    up_text="BUY",
    down_text="SELL",
    up_size=2,
    down_size=2,
)

updown_chart = tvl.candlestick(ohlc, markers=markers)
```

The helper returns a `list[Marker]` that drops straight into the series' `markers=` argument. The library sorts markers by time, so the order of `up_times` and `down_times` doesn't matter.

### Type aliases: `MarkerSign` and `MismatchDirection`

Two Literal aliases live alongside the marker API for completeness. `MarkerSign` annotates a marker's polarity (`"negative"`, `"neutral"`, `"positive"`); it threads through to the JS `SeriesMarker.sign` field and is mainly consumed by JS-side renderer hooks. `MismatchDirection` (`"nearest_left"`, `"none"`, `"nearest_right"`) selects the lookup behavior of `ISeriesApi.dataByIndex()` / `barsInLogicalRange()` on the JS runtime. It is exported for type-hint completeness and isn't accepted as a Python kwarg today.

```python
import deephaven.plot.tradingview_lightweight as tvl
from typing import get_args

# Sentinel snapshots of the two Literal aliases — useful when wiring
# typed dataclasses or building marker payloads from a table.
signs = list(get_args(tvl.MarkerSign))  # ["negative", "neutral", "positive"]
directions = list(
    get_args(tvl.MismatchDirection)
)  # ["nearest_left", "none", "nearest_right"]

assert signs == ["negative", "neutral", "positive"]
assert directions == ["nearest_left", "none", "nearest_right"]
```

These constants are stable across releases; refer to them by name (e.g. `tvl.MarkerSign`) rather than re-typing the string literals.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.marker
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.markers_from_table
```

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.up_down_markers
```
