# Chart Events

Chart events allow you to respond to user interactions on a chart with callback functions. Supported events include clicks, selections, layout changes (pan/zoom), and legend interactions.

## Example

```python order=fig,click_history,stocks
import deephaven.plot.express as dx
from deephaven import input_table, new_table, dtypes as dht
from deephaven.column import string_col, double_col

stocks = dx.data.stocks()

# Create an input table to accumulate clicked points
click_history = input_table({"Sym": dht.string, "Price": dht.double})


def handle_click(event):
    point = event["points"][0]
    click_history.add(
        new_table(
            [
                string_col("Sym", [point["trace_name"]]),
                double_col("Price", [point["y"]]),
            ]
        )
    )


fig = dx.scatter(stocks, x="Timestamp", y="Price", by="Sym", on_click=handle_click)
```

## What are chart events useful for?

- **Filtering related tables** when a user clicks a data point (e.g., click a point to show details in another panel)
- **Bulk-selecting data** to feed into downstream computations or analysis
- **Synchronizing multiple components** by responding to pan/zoom events
- **Controlling legend behavior** (e.g., prevent hiding a trace if it's the last one visible)
- **Controlling drill-down** on hierarchical charts (sunburst, treemap, icicle)
- **Responding to annotation clicks** for interactive dashboards

## Available Events

All event callbacks are optional keyword arguments that default to `None`.

| Parameter                | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| `on_click`               | Point click. On hierarchical charts, return `False` to prevent drill-down. |
| `on_press`               | Alias for `on_click`                                                       |
| `on_double_click`        | Double-click (resets axes in zoom/pan mode)                                |
| `on_double_press`        | Alias for `on_double_click`                                                |
| `on_selected`            | Box/lasso selection complete                                               |
| `on_deselect`            | Selection cleared                                                          |
| `on_relayout`            | Layout changed (pan, zoom, axis reset)                                     |
| `on_legend_click`        | Legend item clicked. Return `False` to prevent toggle.                     |
| `on_legend_double_click` | Legend item double-clicked. Return `False` to prevent isolate/show-all.    |
| `on_click_annotation`    | Annotation clicked                                                         |
| `on_web_gl_context_lost` | WebGL context lost                                                         |

> [!NOTE]
> All events are accepted by all chart types. Some combinations have no natural top-level trigger (such as `on_click_annotation`), but may become relevant if you add elements via [unsafe_update_figure](unsafe-update-figure.md).

## Preventable Events

Three events can optionally return a `bool` to control default behavior:

```python
def handle_legend_click(event):
    # Return False to prevent the default visibility toggle
    # Return True or None to allow it
    return True
```

- **`on_click`**: returning `False` prevents drill-down on hierarchical charts (sunburst, treemap, icicle). The return value is ignored on other chart types.
- **`on_legend_click`**: returning `False` prevents the trace visibility toggle.
- **`on_legend_double_click`**: returning `False` prevents the isolate/show-all toggle.

> [!WARNING]
> Preventable event callbacks block the default behavior until the Python function returns. Avoid heavy synchronous computation inside these callbacks. If the function takes too long, the chart will feel unresponsive.

## Event Data

Every event payload includes a `modifiers` dict describing which keyboard modifier keys were held during the interaction.

```python
{"shift": False, "ctrl": False, "alt": False, "meta": False}
```

For example, use `modifiers` to branch on shift-click:

```python order=fig,gapminder_hierarchy,gapminder
import deephaven.plot.express as dx

gapminder = dx.data.gapminder()

# Build a drillable hierarchy: World > Continent > Country
gapminder_hierarchy = gapminder.last_by("Country").update_view("World = `World`")


def handle_click(event):
    if event["modifiers"]["shift"]:
        # Only drill up or down if shift is held
        return True
    else:
        return False


fig = dx.sunburst(
    gapminder_hierarchy,
    path=["World", "Continent", "Country"],
    values="Pop",
    on_click=handle_click,
)
```

### Click events (`on_click`, `on_press`)

`on_press` is an alias for `on_click` and receives the same payload.

```python
{
    "points": [
        {
            "x": 5,
            "y": 0.479,
            "trace_name": "DOG",
            "trace_type": "scatter",
            "curve_number": 0,
        }
    ],
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

On hierarchical charts, an additional `next_level` field is included, which indicates the label of the next level that would be drilled into if the click is allowed:

```python
{
    "points": [{"label": "A", "parent": "", "value": 10, "trace_type": "sunburst"}],
    "next_level": "A",
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

If `clickanywhere` is enabled via [unsafe_update_figure](unsafe-update-figure.md), clicking empty space fires with an empty `points` list plus `xvals` and `yvals`.

```python
{
    "points": [],
    "xvals": [5],  # cursor x in data space, one per x-axis
    "yvals": [0.479],  # cursor y in data space, one per y-axis
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

### Double-click events (`on_double_click`, `on_double_press`)

`on_double_press` is an alias for `on_double_click` and receives the same payload. This event fires when the user double-clicks the plot area (commonly used to reset axes in zoom/pan mode).

```python
{
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

### Selection events (`on_selected`)

On box or lasso selection, the event includes an array of selected points and the selection box range (box select only):

```python
{
    "points": [{"x": 1, "y": 2, "trace_name": "DOG", "curve_number": 0}, ...],
    "range": {"x": [0, 10], "y": [0.0, 5.0]},  # box select only
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

> [!WARNING]
> Selection has several caveats:
>
> 1. Selection sends details on every point within the selection box/lasso. Use this event only when you expect a small number of selected points.
> 2. Only points drawn as markers can be selected. Traces that render as lines only (such as `dx.line`) contribute no points to the selection. To make a line chart selectable, add markers, such as with `markers=True`.
> 3. The selection will be misleading if the chart is downsampled.

### Deselect events (`on_deselect`)

When the user clicks outside the selected area or presses escape, the selection is cleared and the event fires with modifiers only:

```python
{
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

### Layout events (`on_relayout`)

When the user pans or zooms, the event contains the new axis ranges:

```python
{
    "xaxis.range[0]": 0,
    "xaxis.range[1]": 100,
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

When the user resets the axes (e.g., by double-clicking), the event contains autorange fields instead:

```python
{
    "xaxis.autorange": True,
    "yaxis.autorange": True,
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

### Legend events (`on_legend_click`, `on_legend_double_click`)

```python
{
    "trace_name": "DOG",
    "curve_number": 0,
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

### Annotation events (`on_click_annotation`)

```python
{
    "index": 0,
    "annotation": {
        "text": "Spike",
        "x": "2018-06-01 08:00:30",
        "y": 25,
    },
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

## Examples

Many of the following examples use [`deephaven.ui`](https://deephaven.io/core/docs/client-libraries/deephaven-ui/). `deephaven.ui` is a library for building complex interactive web apps, which naturally complements event-driven charts.

### Filter a table on click

Use `on_click` to capture the clicked data point and use that information to filter a related table.

```python order=stock_detail_panel,stocks
import deephaven.plot.express as dx
from deephaven import ui

stocks = dx.data.stocks()


@ui.component
def stock_detail():
    selected, set_selected = ui.use_state(None)

    # Memoize the callback so it has a stable identity across renders.
    handle_click = ui.use_callback(
        lambda event: set_selected(event["points"][0]["trace_name"]), []
    )

    # Memoize the figure so it isn't recreated (and reset) when state changes.
    # The figure only needs to be recreated if the callback changes.
    fig = ui.use_memo(
        lambda: dx.scatter(
            stocks, x="Timestamp", y="Price", by="Sym", on_click=handle_click
        ),
        [handle_click],
    )

    # Derive the filtered table from state
    detail_table = ui.use_memo(
        lambda: stocks.where(f"Sym = `{selected}`") if selected else stocks.head(0),
        [selected],
    )

    return ui.flex(fig, ui.table(detail_table), direction="column")


stock_detail_panel = stock_detail()
```

### Prevent drill-down on hierarchical charts on click

Return `False` from the `on_click` handler to prevent drill-down on hierarchical charts of type sunburst, treemap, or icicle.

```python order=fig,gapminder_hierarchy,gapminder
import deephaven.plot.express as dx

gapminder = dx.data.gapminder()

# Build a multi-level hierarchy: World > Continent > Country
gapminder_hierarchy = gapminder.last_by("Country").update_view("World = `World`")


def handle_click(event):
    # Returning False prevents drill-down. Returning True or None allows it.
    return False


fig = dx.icicle(
    gapminder_hierarchy,
    path=["World", "Continent", "Country"],
    values="Pop",
    on_click=handle_click,
)
```

### Capture selected points into a table on box/lasso select

Use `on_selected` to capture the points within the selection box/lasso and build a new table from those points.

```python order=selection_panel_instance,stocks
import deephaven.plot.express as dx
from deephaven import ui, new_table
from deephaven.column import double_col

stocks = dx.data.stocks()


@ui.component
def selection_panel():
    selected_points, set_selected_points = ui.use_state([])

    # Memoize callbacks for stable identity
    handle_selected = ui.use_callback(
        lambda event: set_selected_points(event.get("points", [])), []
    )
    # Clear selected points on deselect (double click)
    handle_deselect = ui.use_callback(lambda _event: set_selected_points([]), [])

    # Memoize figure so it doesn't reset on state change
    fig = ui.use_memo(
        lambda: dx.scatter(
            stocks,
            x="Price",
            y="Dollars",
            by="Sym",
            on_selected=handle_selected,
            on_deselect=handle_deselect,
        ),
        [handle_selected, handle_deselect],
    )

    # Build a table directly from the selected points.
    selected_table = ui.use_memo(
        lambda: new_table(
            [
                double_col("Price", [p["x"] for p in selected_points]),
                double_col("Dollars", [p["y"] for p in selected_points]),
            ]
        ),
        [selected_points],
    )

    return ui.flex(
        fig,
        ui.table(selected_table),
        direction="column",
    )


selection_panel_instance = selection_panel()
```

### Sync visible data to a table on pan/zoom

Use `on_relayout` to capture the new axis ranges when the user pans or zooms, and use that information to filter a related table to only the visible data.

```python order=synced_chart_panel,stocks
import deephaven.plot.express as dx
from deephaven import ui

stocks = dx.data.stocks()


def make_relayout_handler(set_ranges):
    """Create a relayout handler that merges axis ranges into state.

    Defined outside the component so it doesn't get recreated each render.
    The set_ranges function from use_state is stable and safe to capture.
    """

    def handle_relayout(event):
        # Ignore non-range events like dragmode changes
        if "xaxis.autorange" in event or "yaxis.autorange" in event:
            # User double-clicked to reset axes
            set_ranges(None)
            return
        x = (
            (event["xaxis.range[0]"], event["xaxis.range[1]"])
            if "xaxis.range[0]" in event
            else None
        )
        y = (
            (event["yaxis.range[0]"], event["yaxis.range[1]"])
            if "yaxis.range[0]" in event
            else None
        )
        if x or y:
            # Merge new range with previous state so that
            # zooming on one axis doesn't lose the other axis's range
            set_ranges(
                lambda prev: {
                    "x": x if x else (prev or {}).get("x"),
                    "y": y if y else (prev or {}).get("y"),
                }
            )

    return handle_relayout


def filter_by_ranges(table, ranges):
    """Filter a table to rows within the given x/y ranges."""
    if ranges is None:
        return table
    filters = []
    if ranges.get("x"):
        filters.append(f"Price >= {ranges['x'][0]} && Price <= {ranges['x'][1]}")
    if ranges.get("y"):
        filters.append(f"Dollars >= {ranges['y'][0]} && Dollars <= {ranges['y'][1]}")
    return table.where(filters) if filters else table


@ui.component
def synced_chart():
    ranges, set_ranges = ui.use_state(None)

    handle_relayout = ui.use_callback(make_relayout_handler(set_ranges), [])

    # Memoize figure to prevent reset on state change
    fig = ui.use_memo(
        lambda: dx.scatter(
            stocks, x="Price", y="Dollars", by="Sym", on_relayout=handle_relayout
        ),
        [handle_relayout],
    )

    # Derive filtered table from ranges state
    visible = ui.use_memo(lambda: filter_by_ranges(stocks, ranges), [ranges])

    return ui.flex(fig, ui.table(visible), direction="column")


synced_chart_panel = synced_chart()
```

### Prevent legend toggle on click

Use `on_legend_click` to prevent the default trace visibility toggle when a user clicks a legend item.

```python order=fig,stocks
import deephaven.plot.express as dx

stocks = dx.data.stocks()


def handle_legend_click(event):
    # Returning False prevents the default trace visibility toggle
    return False


fig = dx.scatter(
    stocks, x="Timestamp", y="Price", by="Sym", on_legend_click=handle_legend_click
)
```

### Prevent legend double-click (isolate/show-all) toggle

Use `on_legend_double_click` to prevent the default isolate/show-all toggle when a user double-clicks a legend item.

```python order=fig,stocks
import deephaven.plot.express as dx

stocks = dx.data.stocks()


def handle_legend_double_click(event):
    # Returning False prevents the default isolate/show-all toggle
    return False


fig = dx.scatter(
    stocks,
    x="Timestamp",
    y="Price",
    by="Sym",
    on_legend_double_click=handle_legend_double_click,
)
```

### Respond to annotation clicks

Annotations are added via `unsafe_update_figure`. The `on_click_annotation` event fires when clicking on an annotation.

```python order=fig,annotation_clicks,dog_prices,stocks
import deephaven.plot.express as dx
from deephaven import input_table, new_table, dtypes as dht
from deephaven.column import string_col, double_col

stocks = dx.data.stocks()
dog_prices = stocks.where("Sym = `DOG`")


def add_annotations(fig):
    fig.add_annotation(
        x="2018-06-01 08:00:30",
        y=25,
        text="Spike",
        showarrow=True,
        arrowhead=2,
        # captureevents=True is required for on_click_annotation to fire.
        # Without it, Plotly does not emit the plotly_clickannotation event.
        captureevents=True,
    )


# Track which annotations have been clicked
annotation_clicks = input_table({"Text": dht.string, "X": dht.string, "Y": dht.double})


def handle_annotation_click(event):
    ann = event["annotation"]
    annotation_clicks.add(
        new_table(
            [
                string_col("Text", [ann["text"]]),
                string_col("X", [str(ann["x"])]),
                double_col("Y", [ann["y"]]),
            ]
        )
    )


fig = dx.line(
    dog_prices,
    x="Timestamp",
    y="Price",
    unsafe_update_figure=add_annotations,
    on_click_annotation=handle_annotation_click,
)
```

### Add an annotation wherever you click

By default, `on_click` only fires when a data point is clicked. Enable Plotly's `clickanywhere` layout option (via `unsafe_update_figure`) so the callback also fires on empty plot area, where the payload carries `xvals`/`yvals` (the cursor position in data space).

```python order=annotated_chart_panel,click_points,stocks
import deephaven.plot.express as dx
from deephaven import ui, input_table, new_table, dtypes as dht
from deephaven.column import double_col

stocks = dx.data.stocks().where("Sym = `DOG`")

# Accumulate the coordinates of every click
click_points = input_table({"X": dht.double, "Y": dht.double})


def handle_click(event):
    # Clicking a data point populates points
    # clicking empty plot area (with clickanywhere enabled)
    # populates xvals/yvals instead.
    if event.get("points"):
        point = event["points"][0]
        x, y = point["x"], point["y"]
    elif event.get("xvals") and event.get("yvals"):
        x, y = event["xvals"][0], event["yvals"][0]
    else:
        return
    click_points.add(new_table([double_col("X", [x]), double_col("Y", [y])]))


@ui.component
def annotated_chart():
    # Listen to the accumulated clicks. Rebuilding the figure re-sends it,
    # which is required because annotations live in the figure.
    points = ui.use_table_data(click_points)

    def add_annotations(fig):
        # Enable clickanywhere so clicks off a data point still fire on_click
        fig.update_layout(clickanywhere=True)
        if points is not None:
            for x, y in zip(points["X"], points["Y"]):
                fig.add_annotation(
                    x=x, y=y, text="Clicked", showarrow=True, arrowhead=2
                )

    # Recreate the figure whenever a new click is recorded via points as a dependency
    return ui.use_memo(
        lambda: dx.scatter(
            stocks,
            x="Price",
            y="Dollars",
            on_click=handle_click,
            unsafe_update_figure=add_annotations,
        ),
        [points],
    )


annotated_chart_panel = annotated_chart()
```

## Events with `layer` and `make_subplots`

Event callbacks can be passed directly to `layer` and `make_subplots`. Passing in callbacks directly takes priority over callbacks derived from the child figures. If multiple children set the same callback, the callback from the last subplot passed in will take priority.

```python order=layered,points,trend,smoothed,layer_clicks,stocks
import deephaven.plot.express as dx
from deephaven import input_table, new_table, dtypes as dht
from deephaven.column import long_col, double_col
from deephaven.updateby import rolling_avg_tick

stocks = dx.data.stocks().where("Sym == `CAT`")

# Add a smoothed trend line
smoothed = stocks.update_by(rolling_avg_tick("AvgPrice = Price", rev_ticks=20))

# Log clicks from either layer into an input table
layer_clicks = input_table({"CurveNum": dht.long, "Price": dht.double})


def handle_click(event):
    point = event["points"][0]
    layer_clicks.add(
        new_table(
            [
                long_col("CurveNum", [point["curve_number"]]),
                double_col("Price", [point["y"]]),
            ]
        )
    )


# Raw trades as points, plus the moving average as a line
points = dx.scatter(smoothed, x="Timestamp", y="Price")
trend = dx.line(smoothed, x="Timestamp", y="AvgPrice")

layered = dx.layer(points, trend, on_click=handle_click)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.scatter
```
