<!-- coverage-seen-elsewhere:
  on_press -> events.md
  on_double_press -> events.md
-->

# Press Events

A TVL chart can call back into Python when the user presses on it. Attach a handler with `on_press` or `on_double_press` and it runs server-side with a chart-aware payload: the time and price under the cursor, which series was hit, every series' value at that time, the pane, and the modifier keys that were held.

These follow the deephaven.ui convention. The name is "press", not "click", and the handler is a plain Python callable, exactly like a deephaven.ui event callback. The two handlers are available on `tvl.chart(...)` and on every per-type constructor (`line`, `area`, `candlestick`, `bar`, `baseline`, `histogram`), so you can wire them whether you build a chart the long way or with the per-type shorthand.

## What are press events useful for?

- **Drill-down**: Read the pressed `time` and `seriesId`, then open a detail table or update another widget scoped to that point.
- **Annotation capture**: Append the pressed `(time, price)` to a Deephaven table so users can mark levels by clicking the chart.
- **Selection state**: Set a variable from the press and let the rest of your app react to it.
- **Disambiguating overlaid series**: `seriesId` comes from the chart's native hit testing, so a press on one of several overlaid lines tells you which line it landed on.

## The two handlers

`on_press` fires on a single press. `on_double_press` fires on a double press. Wire either or both:

```python skip-test
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

line = tvl.line(
    data,
    timestamp="Timestamp",
    value="Value",
    on_press=lambda e: print("press", e),
    on_double_press=lambda e: print("double", e),
)
```

The same kwargs work at the chart level when you compose series yourself:

```python skip-test
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.values()

chart = tvl.chart(
    tvl.line(data, timestamp="Timestamp", value="Value"),
    on_press=lambda e: print("press", e),
)
```

### Handler signature: zero or one argument

A handler may take the event argument or take nothing at all. Both forms are valid, and TVL adapts to whichever you wrote:

```python skip-test
# One argument: receives the event payload.
on_press=lambda e: print(e["time"])

# Zero arguments: fires, but ignores the payload.
on_press=lambda: print("the chart was pressed")
```

Use the zero-argument form when you only care that a press happened, not where.

## The event payload

The event is a plain `dict` with camelCase keys (a `TvlPressEvent`). Read its fields with subscript access, like `e["seriesId"]` and `e["price"]`. It is a dict, not an object, so attribute access (`e.seriesId`) does not work.

| Key | Type | Meaning |
|---|---|---|
| `type` | `"press"` or `"doublePress"` | Which handler fired. |
| `time` | `Instant` / `ZonedDateTime` / `datetime` | The pressed time, mirroring the source series' time-column type. Absent when the press is on empty area outside the data range. |
| `seriesId` | `str` | The series under the cursor. Absent when the press lands between lines. |
| `price` | `float` | Value at the cursor on the cursor pane's price scale, when available. |
| `seriesData` | `dict` | Every series' value (or OHLC dict) at the pressed time, keyed by series id. |
| `point` | `dict` | `{"x": int, "y": int}`, the cursor location in chart pixels. |
| `paneIndex` | `int` | Index of the pane the press landed in, when available. |
| `shiftKey` | `bool` | Whether Shift was held. |
| `ctrlKey` | `bool` | Whether Ctrl was held. |
| `metaKey` | `bool` | Whether Meta (Cmd) was held. |
| `altKey` | `bool` | Whether Alt was held. |

Fields that cannot be resolved for a given press are left out of the dict rather than set to `None`. A press on empty area beyond the data has no `time`; a press between lines has no `seriesId`. Read those optional fields with `e.get("seriesId")` and `e.get("time")` so a missing key does not raise `KeyError`. The always-present fields are `type`, `point`, and the four modifier booleans.

`time` mirrors the type of the hit series' timestamp column, following the deephaven.ui convention that a callback hands back the same kind of value you gave it:

- a Deephaven `Instant` when the column is an `Instant`,
- a Deephaven `ZonedDateTime` when the column is a `ZonedDateTime`, reconstructed in the zone the chart is displaying (the press travels over the wire as a plain instant, so the column's original per-row zone is not recoverable — the displayed zone is what you saw on the axis),
- a timezone-aware UTC `datetime` as the fallback when the column type can't be resolved.

When the press lands between lines (no `seriesId`), TVL uses the shared type if every series agrees, otherwise the `datetime` fallback. Either way the value is a real Deephaven timestamp you can compare against table columns directly. The chart works in shifted epoch seconds on the wire; TVL undoes the display-tz shift before building the value.

### `seriesData` shape

`seriesData` maps each series id to its value at the pressed time. For a line, area, baseline, or histogram series the value is a single `float`. For a candlestick or bar series it is an OHLC dict with `open`, `high`, `low`, and `close`. The keys match the ids you get from `seriesId`, so you can look up the hit series' full record:

```python skip-test
def on_press(e):
    sid = e.get("seriesId")
    if sid is not None:
        print(sid, "=>", e["seriesData"].get(sid))
```

## Double-press fires a press first

When both handlers are registered, a double press fires one `press` followed by one `double_press`. The underlying chart library reports the first click of a double-click as a normal click and does not suppress it. This is intentional. TVL adds no debounce delay, because that would tax every single press to smooth over a rare, predictable overlap.

If you need a double press to not also count as a single press, branch on it yourself, for example by recording the press time in `on_press` and ignoring a follow-up that arrives within your own window. Most apps do not need this.

## Handlers run server-side

A press handler runs on the server under the same execution context and liveness scope that was captured when the chart was created, exactly like a deephaven.ui callback. That means a handler can do real Deephaven work: mutate a table, set a variable, create a new table, and the objects it touches stay live for as long as the chart does.

Keep handlers quick. A press fires on the data stream's dispatch path, so a slow handler holds up the chart. Do the cheap, immediate work in the handler (capture the point, flip a flag, enqueue) and offload anything heavy to a background table operation or a separate thread. A handler that raises is logged and swallowed, so a bug in one press will not tear down the chart, but it also will not surface to the user, so check the server log if a handler seems to do nothing.

## Example: append pressed points to a table

This wires a line chart so each press records the pressed `(time, price, seriesId)` into a Deephaven input table. The table ticks live as the user clicks the chart, so you can join it, snapshot it, or render it elsewhere.

```python skip-test
import deephaven.plot.tradingview_lightweight as tvl
from deephaven import dtypes
from deephaven.stream.table_publisher import table_publisher

data = tvl.data.values()

clicks, publisher = table_publisher(
    "chart clicks",
    {
        "Time": dtypes.Instant,
        "Series": dtypes.string,
        "Price": dtypes.double,
    },
)


def record_press(e):
    t = e.get("time")
    price = e.get("price")
    if t is None or price is None:
        return  # pressed empty area, nothing to record
    from deephaven import new_table
    from deephaven.column import datetime_col, string_col, double_col

    publisher.add(
        new_table(
            [
                datetime_col("Time", [t]),
                string_col("Series", [e.get("seriesId", "")]),
                double_col("Price", [price]),
            ]
        )
    )


line = tvl.line(
    data,
    timestamp="Timestamp",
    value="Value",
    on_press=record_press,
)
```

Open `line`, click on the data, and watch rows land in `clicks`. The zero-or-one-arg rule means you could swap in `on_press=lambda: print("pressed")` for a quick check before wiring the full handler.
