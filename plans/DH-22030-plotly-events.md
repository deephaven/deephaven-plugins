# DH-22030: Plotly Express Chart Events

## Overview

This plan adds event callback parameters to all plotly-express chart functions (`scatter`, `bar`, `sunburst`, etc.), `layer`, and `make_subplots`. When a user interacts with a chart in the browser (click, select, pan/zoom, etc.), a Python callback fires server-side. The architecture is designed so that additional events can be added later without structural changes.

---

# Part 1: Specification

## Events

All event callbacks default to `None` and are typed `ChartEventCallback | None`.

| Python param             | Plotly event               | Description                                                                                                         | Applies to                                 |
| ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `on_click`               | `plotly_click`             | Point click                                                                                                         | Non-hierarchical charts                    |
| `on_press`               | `plotly_click`             | Alias for `on_click`                                                                                                | Non-hierarchical charts                    |
| `on_double_click`        | `plotly_doubleclick`       | Double click on chart area. Only fires in zoom/pan mode. `on_deselect` is triggered on double-click in select mode. | Non-hierarchical charts                    |
| `on_double_press`        | `plotly_doubleclick`       | Alias for `on_double_click`                                                                                         | Non-hierarchical charts                    |
| `on_selected`            | `plotly_selected`          | Selection complete (box or lasso). See [Selection Modebar Buttons](#selection-modebar-buttons)                      | Non-hierarchical charts                    |
| `on_deselect`            | `plotly_deselect`          | Selection cleared. Fires instead of `on_double_click` in select mode.                                               | Non-hierarchical charts                    |
| `on_relayout`            | `plotly_relayout`          | Layout changed (pan, zoom, axis reset, dragmode switch, etc.)                                                       | Non-hierarchical charts                    |
| `on_legend_click`        | `plotly_legendclick`       | Legend item clicked                                                                                                 | Charts with legends (i.e. multiple traces) |
| `on_legend_double_click` | `plotly_legenddoubleclick` | Legend item double-clicked                                                                                          | Charts with legends (i.e. multiple traces) |
| `on_click_annotation`    | `plotly_clickannotation`   | Annotation clicked                                                                                                  | Charts with annotations                    |
| `on_sunburst_click`      | `plotly_sunburstclick`     | Segment clicked (drill-down)                                                                                        | `sunburst` only                            |
| `on_treemap_click`       | `plotly_treemapclick`      | Node clicked (drill-down)                                                                                           | `treemap` only                             |
| `on_icicle_click`        | `plotly_icicleclick`       | Node clicked (drill-down)                                                                                           | `icicle` only                              |
| `on_web_gl_context_lost` | `plotly_webglcontextlost`  | WebGL context lost (GPU reclaims resources)                                                                         | WebGL-supporting plots only                |

**Notes:**

- **Non-hierarchical charts** = all chart types except `sunburst`, `treemap`, and `icicle`. Hierarchical charts don't have axes, pan/zoom, or selection — they have their own dedicated click events instead.
- **`on_web_gl_context_lost`** is only added to chart functions that support WebGL rendering (e.g. `scattergl`, `scatter3d`, or charts with `render_mode='webgl'`). Chrome limits WebGL context count, after which older contexts are silently lost.
- **`on_relayout`** only fires from user-driven layout interactions (pan, zoom, scroll-zoom, double-click reset, dragmode change). It does **not** fire on window resize or on hierarchical charts.

---

## API

### Callback Type

All event callbacks accept a single optional positional argument, the event data.

```python
ChartEventCallback = Callable[..., None]
```

### Chart Function Signature (example: `scatter`)

```python
def scatter(
    table: PartitionableTableLike,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    # ... (other existing params)
    unsafe_update_figure: Callable = default_callback,
    # Event callbacks (all default to None)
    on_click: ChartEventCallback | None = None,
    on_selected: ChartEventCallback | None = None,
    on_deselect: ChartEventCallback | None = None,
    on_relayout: ChartEventCallback | None = None,
    on_double_click: ChartEventCallback | None = None,
    # ... (all other event params)
) -> DeephavenFigure:
    ...
```

### `layer` Signature

```python
def layer(
    *figs: DeephavenFigure | Figure,
    which_layout: int | None = None,
    specs: list[LayerSpecDict] | None = None,
    unsafe_update_figure: Callable = default_callback,
    title: str | None = None,
    # All universal event params
    on_click: ChartEventCallback | None = None,
    # ... (all other event params)
) -> DeephavenFigure:
    ...
```

### `make_subplots` Signature

```python
def make_subplots(
    *figs: Figure | DeephavenFigure,
    rows: int = 0,
    cols: int = 0,
    # ... (other existing params)
    # All universal event params
    on_click: ChartEventCallback | None = None,
    # ... (all other event params)
) -> DeephavenFigure:
    ...
```

---

## Event Data Schemas

All point-bearing events include data-space values matching the column types from the source table (e.g. if `x` is a `long` column, `point["x"]` is an `int`; if it's a `double` column, it's a `float`). `pointIndex` is excluded as it refers to the rendered trace data and should not be used for server-side logic. `curveNumber`, on the other hand, is included to disambiguate points when multiple traces share the same `traceName`, although will need a note in the docs to be used with caution in case traces shift.

All events that originate from a user interaction include a `modifiers` dict with keyboard state:

```python
"modifiers": {
    "shift": False,
    "ctrl": False,  # Cmd on macOS
    "alt": False,
    "meta": False,
}
```

### Point Events (`on_click`, `on_selected`)

```python
{
    "points": [
        {
            "x": 5,  # Data-space value, matches column type
            "y": 0.479,  # Data-space value, matches column type
            "z": None,  # Only for 3D charts
            "traceName": "DOG",  # The trace name (partition/by key value, or Plotly trace name)
            "curveNumber": 0,  # Trace index, useful when multiple traces share the same traceName
        }
    ],
    # Only for on_selected with box select:
    "range": {"x": [0, 10], "y": [0.0, 5.0]},
    # Only for on_selected with lasso select:
    "lassoPoints": {"x": [...], "y": [...]},
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

`traceName` is the Plotly trace name, which for Deephaven charts is the `by` column value (or partition key) that identifies the trace. If the chart has no `by`/partitioning, `traceName` is the default Plotly trace name.

### Layout Events (`on_relayout`)

`on_relayout` fires whenever Plotly's layout is programmatically or interactively changed. The event data is a flat dict of the layout keys that changed. This includes but is not limited to:

- **Pan/zoom** — axis range changes (`xaxis.range[0]`, `xaxis.range[1]`, etc.)
- **Axis reset** — double-click to reset (`xaxis.autorange`, `yaxis.autorange`)
- **3D camera** — rotation/orbit on 3D charts (`scene.camera.eye`, `scene.camera.center`, etc.)
- **Geo/mapbox** — map panning and zooming (`geo.center.lat`, `geo.center.lon`, `geo.projection.rotation`, `mapbox.center`, `mapbox.zoom`)
- **Dragmode change** — user switches between pan/zoom/select via modebar (`dragmode`)
- **Shape editing** — user moves or resizes a shape (`shapes[0].x0`, `shapes[0].y0`, etc.)

The dict contains only the keys that changed. The consumer should check which keys are present to determine the type of layout change:

```python
{
    # Example: pan/zoom (axis range change)
    "xaxis.range[0]": 0,
    "xaxis.range[1]": 100,
    "yaxis.range[0]": -1,
    "yaxis.range[1]": 1,
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

```python
{
    # Example: axis reset (double-click to reset zoom)
    "xaxis.autorange": True,
    "yaxis.autorange": True,
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

```python
{
    # Example: 3D camera rotation
    "scene.camera": {
        "eye": {"x": 1.25, "y": 1.25, "z": 1.25},
        "center": {"x": 0, "y": 0, "z": 0},
    },
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

### Legend Events (`on_legend_click`, `on_legend_double_click`)

In addition to firing this event, `on_legend_click` toggles the visibility of the corresponding trace in the chart and `on_legend_double_click` isolates the corresponding trace (hides all other traces) in the chart.

```python
{
    "traceName": "DOG",  # The trace name of the legend item clicked
    "curveNumber": 0,  # The index of the trace in the Plotly data array
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

### Annotation Events (`on_click_annotation`)

Although we don't directly support an API for annotations in `dx` charts, they are easily added through `unsafe_update_figure`, so the `on_click_annotation` event can be used to interact with these annotations once they are added.

```python
{
    "index": 0,
    "annotation": {"text": "Label", "x": 1.0, "y": 2.0},
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

### Hierarchical Click Events (`on_sunburst_click`, `on_treemap_click`, `on_icicle_click`)

Similar to `on_click`, these events fire when a hierarchical chart element (sunburst, treemap, or icicle) is clicked. The event data contains the clicked points and any modifier keys pressed.

```python
{
    "points": [{"label": "A", "parent": "", "value": 10, "id": "A", "curveNumber": 0}],
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

### Double-Click Event (`on_double_click`, `on_double_press`)

Fires on double-click, which by default resets the axes. No point data is included.

```python
{"modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False}}
```

### Deselect Event (`on_deselect`)

Fires when the current selection is cleared (e.g. by double clicking on an empty area).

```python
{"modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False}}
```

### System Events (`on_web_gl_context_lost`)

Fires when the WebGL rendering context is lost (e.g. GPU reclaims resources). Chrome limits WebGL context count, after which older contexts are silently lost — data disappears from charts with no indication. This event lets users detect and respond to context loss (e.g. show a warning). No modifiers as this doesn't involve user interaction directly.

```python
{}  # No event data
```

---

## Examples

Each example below has two parts: a **Justification** explaining why the event is included (i.e. what Deephaven workflows it enables), and a **Code** snippet that is a minimal illustration of wiring up the callback.

### `on_click` — Basic Click Handler

**Justification:** Filter a table to show rows matching the clicked point, open a `dh.ui` detail panel for that data point, or trigger any point-specific server-side logic.

#### Code

```python
import deephaven.plot.express as dx

stocks = dx.data.stocks()
dog_prices = stocks.where("Sym = `DOG`")


def handle_click(event):
    point = event["points"][0]
    print(f"Clicked: x={point['x']}, y={point['y']}, trace={point['traceName']}")


fig = dx.scatter(dog_prices, x="Timestamp", y="Price", on_click=handle_click)
```

### `on_selected` — Selection

**Justification:** Bulk-select data points to feed into a downstream computation. Select outliers for review, filter a related table to the selected subset, or populate a `dh.ui` form with the selected rows.

#### Code

```python
import deephaven.plot.express as dx

stocks = dx.data.stocks()


def handle_selection(event):
    print(f"Selected {len(event['points'])} points")
    if "range" in event:
        print(f"Range: x={event['range']['x']}, y={event['range']['y']}")


fig = dx.scatter(
    stocks, x="Timestamp", y="Price", by="Sym", on_selected=handle_selection
)
```

### `on_relayout` — Layout Change (Pan/Zoom)

**Justification:** Synchronize the visible time range across multiple charts (e.g. pan one chart, update all others to the same window) or filter tables to the visible range.

#### Code

```python
import deephaven.plot.express as dx

stocks = dx.data.stocks()


def handle_relayout(event):
    if "xaxis.range[0]" in event:
        print(f"Visible range: {event['xaxis.range[0]']} to {event['xaxis.range[1]']}")
    elif "xaxis.autorange" in event:
        print("Axes were reset")


fig = dx.line(stocks, x="Timestamp", y="Price", by="Sym", on_relayout=handle_relayout)
```

### `on_sunburst_click` — Hierarchical Click

**Justification:** Drill into hierarchical data. Click a category to filter related tables to that branch, or navigate a `dh.ui` dashboard to a detail view for that subtree.

#### Code

```python
import deephaven.plot.express as dx

gapminder = dx.data.gapminder()
pop_by_continent = gapminder.last_by("Country").sum_by(["Continent"])


def handle_sunburst(event):
    point = event["points"][0]
    print(f"Clicked: {point['label']} (parent: {point['parent']})")


fig = dx.sunburst(
    pop_by_continent, names="Continent", values="Pop", on_sunburst_click=handle_sunburst
)
```

### `on_legend_click` — Legend Click

**Justification:** Filter a related table to only show data for the categories currently visible on the chart. Since clicking a legend item toggles that trace's visibility, the callback can synchronize other components to match.

#### Code

```python
import deephaven.plot.express as dx

stocks = dx.data.stocks()


def handle_legend_click(event):
    print(f"Legend clicked: {event['traceName']} (curve {event['curveNumber']})")


fig = dx.scatter(
    stocks, x="Timestamp", y="Price", by="Sym", on_legend_click=handle_legend_click
)
```

### `on_legend_double_click` — Legend Double-Click

**Justification:** Isolate a single category for focused analysis. Double-clicking a legend item hides all other traces, so the callback can filter a table to only that category's data.

#### Code

```python
import deephaven.plot.express as dx

stocks = dx.data.stocks()


def handle_legend_double_click(event):
    print(f"Isolated trace: {event['traceName']}")


fig = dx.scatter(
    stocks,
    x="Timestamp",
    y="Price",
    by="Sym",
    on_legend_double_click=handle_legend_double_click,
)
```

### `on_click_annotation` — Annotation Click

**Justification:** Pop up a `dh.ui` panel with detailed analysis about the annotated data point or region (e.g. clicking an "Anomaly" annotation shows the anomaly detection results).

#### Code

```python
import deephaven.plot.express as dx

stocks = dx.data.stocks()
dog_prices = stocks.where("Sym = `DOG`")


def handle_annotation_click(event):
    ann = event["annotation"]
    print(
        f"Annotation #{event['index']} clicked: '{ann['text']}' at ({ann['x']}, {ann['y']})"
    )


fig = dx.line(
    dog_prices, x="Timestamp", y="Price", on_click_annotation=handle_annotation_click
)
```

---

# Part 2: Implementation

## Approach

The system mirrors the ui plugin's callback pattern (callback IDs, signature-adaptive `wrap_callable`) but is implemented independently. The ui plugin's system (`NodeEncoder`, `ElementMessageStream`, JSON-RPC `callCallable`) is tightly coupled to its React element-tree pipeline and cannot be reused. plotly-express already has its own `MessageStream`-based protocol, so we extend it with a new `CALLABLE_EVENT` message type.

| Concept                      | ui plugin                                               | plotly-express (new)                                              |
| ---------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- |
| Callback ID assignment       | `NodeEncoder._convert_callable` assigns `cb0`, `cb1`, … | `DeephavenFigure._register_callback` assigns `cb_0`, `cb_1`, …    |
| Callback ID sent to frontend | `{__dhCbid: "cb0"}` in element tree                     | `deephaven.callbacks: {"on_click": "cb_0"}` in figure JSON        |
| Frontend invokes callback    | `jsonClient.request('callCallable', [id, args])`        | `widget.sendMessage({type: "CALLABLE_EVENT", callback_id, args})` |
| Signature flexibility        | `wrap_callable` inspects signature, filters args        | Same pattern in plotly-express `types/callbacks.py`               |

## Phase 1 — Callback Storage in `DeephavenFigure`

**File:** [DeephavenFigure.py](../plugins/plotly-express/src/deephaven/plot/express/deephaven_figure/DeephavenFigure.py)

1. Add `_callbacks: dict[str, Callable]` (keyed by event name), `_callback_ids: dict[str, str]` (event name → stable ID), and `_next_callback_id: int` counter to `__init__`.
2. Add `_register_callback(event_name: str, fn: Callable) -> None` — assigns the next ID, stores `fn` and the ID.
3. Add `get_callback_by_id(callback_id: str) -> Callable | None` for use in the listener.
4. In `to_json()`, if `_callback_ids` is non-empty, add `deephaven["callbacks"] = self._callback_ids`.
5. In `copy()`, shallow-copy `_callbacks`, `_callback_ids`, and `_next_callback_id` so per-session copies share callable references.

## Phase 2 — Callback Type Utilities

**New file:** `plugins/plotly-express/src/deephaven/plot/express/types/callbacks.py`

6. Define `ChartEventCallback = Callable[..., None]`.
7. Implement `wrap_callable(fn: Callable) -> Callable`:

   ```python
   def wrap_callable(fn: Callable) -> Callable:
       sig = signature(fn)
       max_args = 0
       accepts_var_positional = False
       for param in sig.parameters.values():
           if param.kind in (POSITIONAL_ONLY, POSITIONAL_OR_KEYWORD):
               max_args += 1
           elif param.kind == VAR_POSITIONAL:
               accepts_var_positional = True

       def _wrapper(*args: Any) -> None:
           if accepts_var_positional:
               fn(*args)
           else:
               fn(*args[:max_args])

       return _wrapper
   ```

8. Export from `types/__init__.py`.

## Phase 3 — Event Parameters on Chart Functions

9. Add all universal event params to every chart function in `plots/`. Add `on_sunburst_click` only to `sunburst()`, `on_treemap_click` only to `treemap()`, `on_icicle_click` only to `icicle()`. All default to `None`, typed `ChartEventCallback | None`.
10. After building the `DeephavenFigure`, call `fig._register_callback(event_name, fn)` for each non-`None` callback kwarg.
11. `layer()` and `make_subplots()` accept the full universal set (not chart-specific events like `on_sunburst_click`, `on_treemap_click`, `on_icicle_click`).

The architecture supports adding Deephaven-specific events later by simply adding new params to chart functions and firing callbacks at the appropriate points (server-side in `DeephavenFigureListener` or JS-side via `CALLABLE_EVENT`). No infrastructure changes needed.

## Phase 3.5 — Selection Modebar Buttons

**File:** `packages/chart/src/Chart.tsx` (in `web-client-ui`)

The `select2d` and `lasso2d` modebar buttons are currently not included in `web-client-ui`'s chart config because without event handlers they serve no purpose. When `on_selected` or `on_deselect` callbacks are registered, these buttons need to be conditionally added to the modebar so users can switch to box/lasso select mode.

26. In `Chart.tsx`, read the callback map from the model (via `getCallbackMap()` or a convenience like `hasSelectionCallbacks()`).
27. If selection callbacks are present, add `"select2d"` and `"lasso2d"` to the Plotly config's `modeBarButtonsToAdd` (or remove them from `modeBarButtonsToRemove` if that's how they're currently suppressed).
28. If no selection callbacks are registered, keep the current behaviour (buttons hidden).

## Phase 4 — Callback Merging in `layer` and `make_subplots`

**Files:** [\_layer.py](../plugins/plotly-express/src/deephaven/plot/express/plots/_layer.py), [subplots.py](../plugins/plotly-express/src/deephaven/plot/express/plots/subplots.py)

12. In `atomic_layer()`, iterate input `DeephavenFigure` args in order and merge `_callbacks` / `_callback_ids` — last figure wins for overlapping event names (matches layout merging).
13. Same merging in `atomic_make_subplots()`.
14. Callbacks passed directly to `layer()` / `make_subplots()` are registered _after_ the merge, so they always win.

## Phase 5 — Message Handling (`CALLABLE_EVENT`)

**File:** [DeephavenFigureListener.py](../plugins/plotly-express/src/deephaven/plot/express/communication/DeephavenFigureListener.py)

15. Add handling in `process_message()`:

    ```python
    if message["type"] == "...":
        ...
    elif message["type"] == "CALLABLE_EVENT":
        callback_id = message.get("callback_id")
        args = message.get("args", {})
        fn = self._figure.get_callback_by_id(callback_id)
        if fn is not None:
            try:
                wrap_callable(fn)(args)
            except Exception:
                logger.exception("Error in plotly event callback %s", callback_id)
    return b"", []
    ```

16. The architecture also supports server-side Deephaven-specific events in the future. These would be fired directly in the listener (e.g. in `_on_update()` or the `FILTER` handler) without a JS round-trip. JS-originated Deephaven events would send a `CALLABLE_EVENT` message like any Plotly event.

## Phase 6 — JavaScript: Model Updates

**File:** [PlotlyExpressChartModel.ts](../plugins/plotly-express/src/js/src/PlotlyExpressChartModel.ts)

18. Parse `figure.deephaven.callbacks?: Record<string, string>` in `handleWidgetUpdated()` and store as `this.callbackMap: Map<string, string>` (event name → callback ID).
19. Add `getCallbackMap(): Map<string, string>`.
20. Add `sendEventCallback(callbackId: string, args: unknown): void`:

    ```typescript
    sendEventCallback(callbackId: string, args: unknown): void {
      this.widget?.sendMessage(
        JSON.stringify({ type: 'CALLABLE_EVENT', callback_id: callbackId, args })
      );
    }
    ```

## Phase 7 — JavaScript: Event Wiring Hook

**New file:** `plugins/plotly-express/src/js/src/usePlotlyEventCallbacks.ts`

21. Accepts `(plotlyDiv: HTMLElement | null, callbackMap: Map<string, string>, onEvent: (id: string, args: unknown) => void, dataMappings: DataMapping[])`.
22. Uses `useEffect` to attach Plotly native event listeners via `plotlyDiv.on('plotly_click', handler)` and return cleanup.
23. Serializers per event group:
    - **Strip Plotly internals**: `pointIndex`, `pointNumber`, `fullData`, `xaxis`, `yaxis` are not sent. `curveNumber` is kept to disambiguate traces that share the same `traceName`.
    - **Data-space values**: `x`, `y`, `z` are sent as-is from Plotly (these already match the column data since they come from the table subscription).
    - **`traceName`**: Passed through directly from Plotly's `data.name` field. For Deephaven charts this is the partition/`by` key value.
    - **`modifiers`**: Captured from the native DOM event (`event.shiftKey`, `event.ctrlKey`, `event.altKey`, `event.metaKey`) at the time the Plotly event fires. Attached to every user-interaction event.
24. Constant lookup table maps Plotly event name → Python param name.

**File:** [PlotlyExpressChart.tsx](../plugins/plotly-express/src/js/src/PlotlyExpressChart.tsx)

25. Call `usePlotlyEventCallbacks(containerRef.current, model.getCallbackMap(), model.sendEventCallback.bind(model))`.

---

## Affected Files

### Python

| File                                                                                                                        | Change                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [DeephavenFigure.py](../plugins/plotly-express/src/deephaven/plot/express/deephaven_figure/DeephavenFigure.py)              | Add `_callbacks`, `_callback_ids`, `_next_callback_id`; `_register_callback`; `get_callback_by_id`; update `to_json` and `copy` |
| [DeephavenFigureListener.py](../plugins/plotly-express/src/deephaven/plot/express/communication/DeephavenFigureListener.py) | Add `CALLABLE_EVENT` branch in `process_message`                                                                                |
| `types/callbacks.py` _(new)_                                                                                                | `ChartEventCallback`, `wrap_callable`                                                                                           |
| [types/\_\_init\_\_.py](../plugins/plotly-express/src/deephaven/plot/express/types/__init__.py)                             | Export new symbols                                                                                                              |
| All files in `plots/`                                                                                                       | Add event callback params; register non-`None` callbacks                                                                        |
| [\_layer.py](../plugins/plotly-express/src/deephaven/plot/express/plots/_layer.py)                                          | Merge child callbacks in `atomic_layer`; accept event params in `layer`                                                         |
| [subplots.py](../plugins/plotly-express/src/deephaven/plot/express/plots/subplots.py)                                       | Merge child callbacks in `atomic_make_subplots`; accept event params in `make_subplots`                                         |

### JavaScript

| File                                                                                          | Change                                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [PlotlyExpressChartModel.ts](../plugins/plotly-express/src/js/src/PlotlyExpressChartModel.ts) | Parse `callbacks`, add `getCallbackMap`, `sendEventCallback`                                |
| `usePlotlyEventCallbacks.ts` _(new)_                                                          | Hook: attach/detach Plotly event listeners, serialize event data                            |
| [PlotlyExpressChart.tsx](../plugins/plotly-express/src/js/src/PlotlyExpressChart.tsx)         | Call `usePlotlyEventCallbacks`                                                              |
| `packages/chart/src/Chart.tsx` _(web-client-ui)_                                              | Conditionally add `select2d`/`lasso2d` modebar buttons when selection callbacks are present |

---

## Verification

### Python Unit Tests

- `wrap_callable` correctly trims excess positional args for 0-arg, 1-arg, and variadic functions.
- `_register_callback` assigns stable, incrementing IDs.
- `to_json` includes `deephaven.callbacks` when callbacks are registered, omits it when none are.
- `layer` with two figures that both have `on_click`: resulting figure uses the last figure's callback.
- `layer` with a direct `on_click` kwarg: direct kwarg wins.
- `make_subplots` follows the same merging rules.
- `process_message` with a `CALLABLE_EVENT` calls the correct Python function.
- Unknown `callback_id` does not raise.
- Exception inside a callback does not crash the connection.

### e2e Tests

- `scatter` with `on_click`: click a point → callback fires with `points[0].x` and `points[0].y`.
- `scatter` with `on_selected`: box-select → callback fires with multiple points.
- `layer(fig_a, fig_b, on_click=cb)`: direct kwarg fires on click.
- `layer(fig_a_with_click, fig_b_with_click)`: last child's callback fires.
- `sunburst` with `on_sunburst_click`: click a segment → callback fires.
- `treemap` with `on_treemap_click`: click a node → callback fires.
- `icicle` with `on_icicle_click`: click a node → callback fires.
- `make_subplots` with `on_relayout`: pan a subplot → callback fires.

---

## Decisions

### Cannot Reuse ui Plugin Callbacks

The ui plugin's system is coupled to its JSON-RPC / `NodeEncoder` / `ElementMessageStream` pipeline. plotly-express uses a `MessageStream` protocol with different message types. The pattern is mirrored but implemented independently.

### Excluded Events

The following Plotly events are excluded from the initial implementation but can be added later if needed: `on_after_plot`, `on_button_clicked`, `on_click_anywhere`, `on_before_export`, `on_after_export`, `on_auto_size`, `on_hover`, `on_unhover`, `on_hover_anywhere`, `on_before_hover`, `on_selecting`, `on_redraw`, `on_restyle`, `on_slider_change`, `on_slider_start`, `on_slider_end`, `on_animated`, `on_animating_frame`, `on_animation_interrupted`, `on_transitioning`, `on_transition_interrupted`. These would fire too frequently (especially without user interaction), are currently using functionality we don't expose and don't encourage, or are otherwise unreliable and/or internal. Adding any of these later requires only adding the param to chart function signatures and wiring the Plotly event in the JS hook — the callback infrastructure handles it automatically.

### `on_framework` — Excluded

`plotly_framework` is an internal Plotly.js hook with no user-facing semantics.

### Hierarchical Chart-Specific Events

`on_sunburst_click`, `on_treemap_click`, and `on_icicle_click` are only on their respective chart functions. These events never fire for other chart types.

### Last-Wins Merging

Consistent with how layout properties merge in `layer` and `make_subplots`. Direct kwargs always take precedence.

### Stable Callback IDs

IDs are assigned at construction time and don't change when data refreshes. The frontend re-reads the map on each `NEW_FIGURE` but the IDs remain the same.

### Fire-and-Forget

Callbacks return nothing. Exceptions are caught and logged.

### Future Deephaven-Specific Events

The architecture supports two patterns for Deephaven-specific events when they are added: (1) server-side events fired directly in `DeephavenFigureListener` with no JS round-trip, and (2) JS-originated events sent via `CALLABLE_EVENT` message. No infrastructure changes needed — just add the param and fire the callback.
