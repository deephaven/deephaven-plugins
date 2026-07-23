# DH-22030: Plotly Express Chart Events

## Overview

This plan adds event callback parameters to all plotly-express chart functions (`scatter`, `bar`, `sunburst`, etc.), `layer`, and `make_subplots`. When a user interacts with a chart in the browser (click, select, pan/zoom, etc.), a Python callback fires server-side. The architecture is designed so that additional events can be added later without structural changes.

---

# Part 1: Specification

## Events

All event callbacks default to `None`. Most are typed `ChartEventCallback | None`. Preventable events are typed `ChartPreventableEventCallback | None` (see [Callbacks That Control Default Behavior](#callbacks-that-control-default-behavior)).

| Python param             | Plotly event               | Description                                                                                                         | Applies to                                                                  |
| ------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `on_click`               | `plotly_click`             | Point click. On hierarchical charts, return `False` to prevent drill-down.                                          | All charts                                                                  |
| `on_press`               | `plotly_click`             | Alias for `on_click`                                                                                                | All charts                                                                  |
| `on_double_click`        | `plotly_doubleclick`       | Double click on chart area. Only fires in zoom/pan mode. `on_deselect` is triggered on double-click in select mode. | Charts with axes (Cartesian, polar, ternary, 3D, geo)                       |
| `on_double_press`        | `plotly_doubleclick`       | Alias for `on_double_click`                                                                                         | Charts with axes (Cartesian, polar, ternary, 3D, geo)                       |
| `on_selected`            | `plotly_selected`          | Selection complete (box or lasso). See [Selection Modebar Buttons](#selection-modebar-buttons)                      | Charts with box/lasso select (Cartesian, polar, ternary)                    |
| `on_deselect`            | `plotly_deselect`          | Selection cleared. Fires instead of `on_double_click` in select mode.                                               | Charts with box/lasso select (Cartesian, polar, ternary)                    |
| `on_relayout`            | `plotly_relayout`          | Layout changed (pan, zoom, axis reset, dragmode switch, etc.)                                                       | Charts with interactive layout (Cartesian, polar, ternary, 3D, geo, mapbox) |
| `on_legend_click`        | `plotly_legendclick`       | Legend item clicked. Return `False` to prevent trace toggle.                                                        | Charts with legends (i.e. multiple traces)                                  |
| `on_legend_double_click` | `plotly_legenddoubleclick` | Legend item double-clicked. Return `False` to prevent isolate/show-all toggle.                                      | Charts with legends (i.e. multiple traces)                                  |
| `on_click_annotation`    | `plotly_clickannotation`   | Annotation clicked                                                                                                  | Charts with annotations                                                     |
| `on_web_gl_context_lost` | `plotly_webglcontextlost`  | WebGL context lost (GPU reclaims resources)                                                                         | WebGL-supporting plots only                                                 |

**Notes:**

- **`on_click`** fires on all chart types including hierarchical charts (`sunburst`, `treemap`, `icicle`) and pie. The point payload varies by chart type. On hierarchical charts, the event data includes a `next_level` field and returning `False` prevents drill-down. The return value is ignored on non-hierarchical charts.
- **`on_double_click`** requires the chart to be in zoom/pan dragmode. Charts without axes (pie, hierarchical) don't support dragmode.
- **`on_selected` / `on_deselect`** require box/lasso selection support. This exists on Cartesian, polar, and ternary charts. 3D, geo, mapbox, pie, and hierarchical charts do not support box/lasso selection.
- **`on_relayout`** fires from user-driven layout interactions (pan, zoom, scroll-zoom, double-click reset, dragmode change, 3D camera rotation, geo/mapbox viewport change). It does **not** fire on window resize, pie charts, or hierarchical charts. The JS implementation debounces `on_relayout` before sending to Python (see [Debouncing](#on_relayout-debouncing)).
- **`on_web_gl_context_lost`** is only added to chart functions that support WebGL rendering (e.g. `scattergl`, `scatter3d`, or charts with `render_mode='webgl'`). Chrome limits WebGL context count, after which older contexts are silently lost.

### Callbacks That Control Default Behavior

Three events support returning a `bool` from the callback to control whether the default client-side behavior occurs:

| Callback                 | Default behavior prevented when returning `False`             |
| ------------------------ | ------------------------------------------------------------- |
| `on_click`               | Drill-down animation (hierarchical charts, ignored elsewhere) |
| `on_legend_click`        | Legend trace visibility toggle                                |
| `on_legend_double_click` | Legend trace isolate/show-all toggle                          |

These callbacks are typed `ChartPreventableEventCallback` (see below). When the callback returns `False`, the default behavior is suppressed. When it returns `True` or `None` (or has no return value), the default behavior proceeds after a brief delay (network round-trip to Python and back). For `on_click`, the return value is only meaningful on hierarchical charts (`sunburst`, `treemap`, `icicle`). On all other chart types, the return value is ignored.

**No delay without handlers:** Charts without event handlers are completely unaffected. No interception is installed and Plotly's defaults execute synchronously with zero overhead.

**Legend click discrimination:** When `on_legend_click` is registered, single-clicks are debounced (~300ms, matching Plotly's native `doubleClickDelay`) to distinguish from double-clicks. This ensures only one of `on_legend_click` or `on_legend_double_click` fires per interaction. See [Legend Click/Double-Click Discrimination](#legend-clickdouble-click-discrimination) in Part 2 for details.

---

## API

### Callback Types

All event callbacks accept a single optional positional argument, the event data.

```python
ChartEventCallback = Callable[..., None]
ChartPreventableEventCallback = Callable[..., bool | None]
```

`ChartPreventableEventCallback` is used for the 3 events that can return `False` to prevent default behavior (`on_click`, `on_legend_click`, `on_legend_double_click`). For `on_click`, the return value only has meaning on hierarchical charts (sunburst, treemap, icicle) where it controls drill-down. All other events use `ChartEventCallback`.

### Chart Function Signature (example: `scatter`)

```python
def scatter(
    table: PartitionableTableLike,
    x: str | list[str] | None = None,
    y: str | list[str] | None = None,
    # ... (other existing params)
    unsafe_update_figure: Callable = default_callback,
    # Event callbacks (all default to None)
    on_click: ChartPreventableEventCallback | None = None,
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
    on_click: ChartPreventableEventCallback | None = None,
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
    on_click: ChartPreventableEventCallback | None = None,
    # ... (all other event params)
) -> DeephavenFigure:
    ...
```

---

## Event Data Schemas

All point-bearing events include data-space values matching the column types from the source table (e.g. if `x` is a `long` column, `point["x"]` is an `int`; if it's a `double` column, it's a `float`). `point_index` is excluded as it refers to the rendered trace data and should not be used for server-side logic. `curve_number`, on the other hand, is included to disambiguate points when multiple traces share the same `trace_name`, although will need a note in the docs to be used with caution in case traces shift.

**Note:** The fields present in each point vary by chart type. The schema below shows a typical Cartesian chart. Other chart types include additional or different fields — for example, geo charts include `lat`/`lon`/`location`, polar charts include `r`/`theta`, OHLC/candlestick charts include `open`/`high`/`low`/`close`, and hierarchical charts include `label`/`parent`/`value`/`id`. The JS serializer includes all relevant data-space fields from the Plotly point object.

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
            "trace_name": "DOG",  # The trace name (partition/by key value, or Plotly trace name)
            "trace_type": "scatter",  # The Plotly trace type (scatter, bar, sunburst, etc.)
            "curve_number": 0,  # Trace index, useful when multiple traces share the same trace_name
        }
    ],
    # Only for on_selected with box select:
    "range": {"x": [0, 10], "y": [0.0, 5.0]},
    # Only for on_selected with lasso select:
    "lasso_points": {"x": [...], "y": [...]},
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

`trace_name` is the Plotly trace name, which for Deephaven charts is the `by` column value (or partition key) that identifies the trace. If the chart has no `by`/partitioning, `trace_name` is the default Plotly trace name.

`trace_type` is the Plotly trace type string (e.g. `"scatter"`, `"bar"`, `"sunburst"`, `"scattergeo"`, `"ohlc"`), taken from `data[curveNumber].type`. This is included for convenience so consumers can branch on chart type without looking up the curve number in the figure data.

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

By default, `on_legend_click` toggles the visibility of the corresponding trace. `on_legend_double_click` toggles between isolating the clicked trace and showing all. Specifically, if other visible traces exist, they are hidden (isolate). If the trace is already isolated (all others are `'legendonly'`), all traces are shown. If the callback returns `False`, the default behavior is prevented.

```python
{
    "trace_name": "DOG",  # The trace name of the legend item clicked
    "curve_number": 0,  # The index of the trace in the Plotly data array
    "modifiers": {"shift": False, "ctrl": False, "alt": False, "meta": False},
}
```

### Hierarchical Click Data (additional fields in `on_click`)

When `on_click` fires on a hierarchical chart (`sunburst`, `treemap`, `icicle`), the event data includes an additional `next_level` field. Returning `False` prevents the drill-down animation.

```python
{
    "points": [
        {
            "label": "A",
            "parent": "",
            "value": 10,
            "id": "A",
            "curve_number": 0,
            "trace_type": "sunburst",
        }
    ],
    "next_level": "A",  # The level that would be drilled into (None for leaves/root)
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
    print(f"Clicked: x={point['x']}, y={point['y']}, trace={point['trace_name']}")


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

### `on_legend_click` — Legend Click (Preventable)

**Justification:** Control whether a legend click toggles visibility. Return `False` to prevent the toggle and implement custom logic instead (e.g. show a confirmation dialog, or only allow hiding if at least 2 traces remain visible).

#### Code

```python
import deephaven.plot.express as dx

stocks = dx.data.stocks()


def handle_legend_click(event):
    print(f"Legend clicked: {event['trace_name']} (curve {event['curve_number']})")
    # Return False to prevent the default visibility toggle
    # Return True or None to allow it
    return True


fig = dx.scatter(
    stocks, x="Timestamp", y="Price", by="Sym", on_legend_click=handle_legend_click
)
```

### `on_legend_double_click` — Legend Double-Click (Preventable)

**Justification:** Control whether double-clicking isolates a trace. Return `False` to prevent isolation and implement custom behavior instead.

#### Code

```python
import deephaven.plot.express as dx

stocks = dx.data.stocks()


def handle_legend_double_click(event):
    print(f"Double-clicked: {event['trace_name']}")
    # Return False to prevent the default isolate behavior
    return False


fig = dx.scatter(
    stocks,
    x="Timestamp",
    y="Price",
    by="Sym",
    on_legend_double_click=handle_legend_double_click,
)
```

### `on_click` with Hierarchical Chart - Prevent Drill-Down

**Justification:** Control drill-down behavior. Click a category to filter related tables to that branch. Return `False` to prevent drill-down when you want the chart to stay at the current level.

#### Code

```python
import deephaven.plot.express as dx

gapminder = dx.data.gapminder()
pop_by_continent = gapminder.last_by("Country").sum_by(["Continent"])


def handle_click(event):
    point = event["points"][0]
    print(f"Clicked: {point['label']} (parent: {point['parent']})")
    print(f"Next level: {event.get('next_level')}")
    # Return False to prevent drill-down, True/None to allow
    return True


fig = dx.sunburst(
    pop_by_continent,
    names="Continent",
    values="Pop",
    on_click=handle_click,
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
4. In `to_json()`, if `_callback_ids` is non-empty, add `deephaven["callbacks"] = self._callback_ids` and `deephaven["preventable_callbacks"] = [id for name, id in self._callback_ids.items() if self._is_preventable(name)]`. The `_is_preventable` check returns `True` for `on_legend_click` and `on_legend_double_click` always, and for `on_click` only when the figure contains hierarchical traces (sunburst, treemap, icicle).
5. In `copy()`, shallow-copy `_callbacks`, `_callback_ids`, and `_next_callback_id` so per-session copies share callable references.

## Phase 2 — Callback Type Utilities

**New file:** `plugins/plotly-express/src/deephaven/plot/express/types/callbacks.py`

6. Define `ChartEventCallback = Callable[..., None]` and `ChartPreventableEventCallback = Callable[..., bool | None]`.
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

       def _wrapper(*args: Any) -> Any:
           if accepts_var_positional:
               return fn(*args)
           else:
               return fn(*args[:max_args])

       return _wrapper
   ```

8. Export from `types/__init__.py`.

## Phase 3 — Event Parameters on Chart Functions

9. Add all event params to every chart function in `plots/`. `on_click` is typed `ChartPreventableEventCallback | None` (return value meaningful only on hierarchical charts), `on_legend_click` and `on_legend_double_click` are typed `ChartPreventableEventCallback | None`, others `ChartEventCallback | None`. All default to `None`.
10. After building the `DeephavenFigure`, call `fig._register_callback(event_name, fn)` for each non-`None` callback kwarg. Mark preventable callbacks in the callback registry so the JS knows to use request-response. For `on_click`, it is only marked preventable when the chart is hierarchical (sunburst, treemap, icicle).
11. `layer()` and `make_subplots()` accept the full event param set.

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
        request_id = message.get("request_id")  # present for preventable events
        fn = self._figure.get_callback_by_id(callback_id)
        result = None
        if fn is not None:
            try:
                result = wrap_callable(fn)(args)
            except Exception:
                logger.exception("Error in plotly event callback %s", callback_id)
        # For preventable events, send back the result
        if request_id is not None:
            response = json.dumps(
                {"type": "CALLABLE_RESPONSE", "request_id": request_id, "result": result}
            )
            return response.encode(), []
    return b"", []
    ```

16. The `CALLABLE_RESPONSE` message type is new. It carries `request_id` (matching the request) and `result` (`True`/`None` = allow default, `False` = prevent). Fire-and-forget events omit `request_id` and get no response.

## Phase 6 — JavaScript: Model Updates

**File:** [PlotlyExpressChartModel.ts](../plugins/plotly-express/src/js/src/PlotlyExpressChartModel.ts)

18. Parse `figure.deephaven.callbacks?: Record<string, string>` in `handleWidgetUpdated()` and store as `this.callbackMap: Map<string, string>` (event name → callback ID). Also parse `figure.deephaven.preventable_callbacks?: string[]` listing callback IDs that use request-response.
19. Add `getCallbackMap(): Map<string, string>` and `isPreventable(callbackId: string): boolean`.
20. Add fire-and-forget and request-response methods:

    ```typescript
    sendEventCallback(callbackId: string, args: unknown): void {
      this.widget?.sendMessage(
        JSON.stringify({ type: 'CALLABLE_EVENT', callback_id: callbackId, args })
      );
    }

    async sendEventCallbackWithResponse(callbackId: string, args: unknown): Promise<boolean> {
      const requestId = crypto.randomUUID();
      const responsePromise = new Promise<boolean>((resolve) => {
        this.pendingResponses.set(requestId, resolve);
        // Timeout after 5s — allow default if Python doesn't respond
        setTimeout(() => {
          if (this.pendingResponses.delete(requestId)) resolve(true);
        }, 5000);
      });
      this.widget?.sendMessage(
        JSON.stringify({ type: 'CALLABLE_EVENT', callback_id: callbackId, args, request_id: requestId })
      );
      return responsePromise;
    }
    ```

21. Handle `CALLABLE_RESPONSE` messages in the widget message handler:

    ```typescript
    if (parsed.type === 'CALLABLE_RESPONSE') {
      const resolver = this.pendingResponses.get(parsed.request_id);
      if (resolver) {
        this.pendingResponses.delete(parsed.request_id);
        resolver(parsed.result !== false);
      }
    }
    ```

## Preventable Events: Always-Prevent + Conditional Re-trigger

Since preventable callbacks run server-side (Python) and the Plotly event handler must return synchronously, the JS uses a request-response pattern:

1. JS always returns `false` from the specialized Plotly event (immediately preventing default)
2. JS sends a `CALLABLE_EVENT` message with a `request_id` to Python and awaits a response
3. Python callback runs and returns `True`/`None` (allow) or `False` (prevent)
4. If the response is `True`/`None`, JS programmatically re-triggers the default behavior:
   - **Drill-down** (hierarchical `on_click`): `Plotly.animate(gd, {data: [{level: nextLevel}], traces: [traceIdx]}, animOpts)`
   - **Legend toggle**: `Plotly.restyle(gd, {visible: nextVis}, [curveNumber])` — toggles `true` ↔ `'legendonly'`
   - **Legend double-click**: If the clicked trace is already isolated (all other visible traces are `'legendonly'`), show all (`Plotly.restyle(gd, {visible: true})`). Otherwise, isolate (`Plotly.restyle(gd, {visible: [true, 'legendonly', ...]})` with only clicked trace visible). This replicates Plotly's built-in `toggleothers` mode.

When no preventable callback is registered for an event, the JS does not intercept it at all — no listener is attached, Plotly's default executes synchronously.

### Legend Click/Double-Click Discrimination

Plotly's legend event dispatch (from `components/legend/draw.js`) has a critical interaction:

```js
function clickOrDoubleClick(gd, legend, legendItem, numClicks, evt) {
    var clickVal = Events.triggerHandler(gd, 'plotly_legendclick', evtData);
    if(numClicks === 1) {
        if(clickVal === false) return;
        legend._clickTimeout = setTimeout(function() { handleClick(..., 1); }, doubleClickDelay);
    } else if(numClicks === 2) {
        clearTimeout(legend._clickTimeout);
        var dblClickVal = Events.triggerHandler(gd, 'plotly_legenddoubleclick', evtData);
        if(dblClickVal !== false && clickVal !== false) handleClick(..., 2);
    }
}
```

Key facts:

1. **`plotly_legendclick` fires on EVERY click** — both the first and second clicks of a double-click
2. **Returning `false` from `plotly_legendclick` also blocks the default double-click behavior** (because of the `clickVal !== false` check on the numClicks=2 branch)
3. On a double-click: `plotly_legendclick` fires twice (once per mouseup), `plotly_legenddoubleclick` fires once (on the second mouseup)

**Problem:** Without discrimination, a double-click would trigger 2 single-click sends + 1 double-click send = 2 toggles + 1 isolate.

**Solution — Debounced single-click with double-click cancellation:**

When `on_legend_click` is registered, JS **always** registers handlers for both `plotly_legendclick` and `plotly_legenddoubleclick`:

- **`plotly_legendclick` handler**: Returns `false`. Starts/resets a debounce timer (~300ms = Plotly's `doubleClickDelay`). Does NOT send to Python yet.
- **`plotly_legenddoubleclick` handler**: Returns `false`. Cancels the pending single-click timer. Then:
  - If `on_legend_double_click` is registered: sends to Python (request-response)
  - If `on_legend_double_click` is NOT registered: programmatically performs default double-click behavior immediately (since returning `false` from `plotly_legendclick` blocked it)
- **On timer expiry** (no double-click detected): sends the single-click to Python (request-response)

| Handlers registered           | Single-click                                          | Double-click                                                                                          |
| ----------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Only `on_legend_click`        | Debounced ~300ms, then sent to Python                 | Pending single-click cancelled; default isolate/show-all performed immediately (no Python round-trip) |
| Only `on_legend_double_click` | No interception — Plotly default toggle runs natively | Sent to Python; re-trigger if allowed                                                                 |
| Both                          | Debounced ~300ms, then sent to Python                 | Pending single-click cancelled; sent to Python; re-trigger if allowed                                 |

The ~300ms delay matches Plotly's own built-in `doubleClickDelay`. The demo at [plotly-events-return-false-demo.html](./plotly-events-return-false-demo.html) verifies this pattern.

## Phase 7 — JavaScript: Event Wiring Hook

**New file:** `plugins/plotly-express/src/js/src/usePlotlyEventCallbacks.ts`

22. Accepts `(plotlyDiv: HTMLElement | null, callbackMap: Map<string, string>, model: PlotlyExpressChartModel, dataMappings: DataMapping[])`.
23. Uses `useEffect` to attach Plotly native event listeners via `plotlyDiv.on('plotly_click', handler)` and return cleanup.
24. Serializers per event group:
    - **Strip Plotly internals**: `pointIndex`, `pointNumber`, `fullData`, `xaxis`, `yaxis` are not sent. `curve_number` is kept to disambiguate traces that share the same `trace_name`.
    - **Data-space values**: `x`, `y`, `z` are sent as-is from Plotly (these already match the column data since they come from the table subscription).
    - **`trace_name`**: Passed through directly from Plotly's `data.name` field. For Deephaven charts this is the partition/`by` key value.
    - **`trace_type`**: Taken from `data[curveNumber].type`. Included for convenience so consumers can branch on chart type.
    - **`modifiers`**: Captured from the native DOM event (`event.shiftKey`, `event.ctrlKey`, `event.altKey`, `event.metaKey`) at the time the Plotly event fires. Attached to every user-interaction event.
    - **Hierarchical click (preventable `on_click`)**: On sunburst/treemap/icicle charts, when `on_click` is registered as preventable, JS intercepts `plotly_sunburstclick`/`plotly_treemapclick`/`plotly_icicleclick` (which fire INSTEAD of `plotly_click` on these charts), returns `false` to prevent drill-down, sends the click event (with `next_level`) via `model.sendEventCallbackWithResponse()`, and conditionally re-triggers drill-down via `Plotly.animate` if the response allows it.
    - **Legend click/double-click discrimination**: Since `plotly_legendclick` fires on every click (including both clicks of a double-click) and returning `false` blocks both single and double-click defaults:
      - When `on_legend_click` is registered: ALWAYS register handlers for both `plotly_legendclick` and `plotly_legenddoubleclick`
      - `plotly_legendclick` handler: returns `false`, starts a debounce timer (~300ms = Plotly's `doubleClickDelay`)
      - `plotly_legenddoubleclick` handler: returns `false`, cancels pending single-click timer, then either sends double-click to Python (if `on_legend_double_click` registered) or performs default isolate/show-all directly
      - On timer expiry (confirmed single-click): sends single-click to Python via `model.sendEventCallbackWithResponse()`
      - When only `on_legend_double_click` is registered (no `on_legend_click`): only register `plotly_legenddoubleclick` handler — Plotly handles single-clicks natively
    - **Re-trigger logic**:
      - Legend click: `Plotly.restyle(gd, {visible: toggled}, [curveNumber])` — toggles `true` ↔ `'legendonly'`
      - Legend double-click: Check if trace is already isolated (all other visible traces are `'legendonly'`). If yes → show all (`Plotly.restyle(gd, {visible: true})`). If no → isolate (`Plotly.restyle(gd, {visible: [true, 'legendonly', ...]})` with only clicked trace visible). This exactly replicates Plotly's built-in `toggleothers` mode.
      - Hierarchical click (on_click): `Plotly.animate(gd, {data: [{level: nextLevel}], traces: [traceIdx]}, transitionOpts)`
    - **No handler = no interception**: Event listeners for preventable events are only attached when the corresponding callback is in `preventable_callbacks`. Without a handler, Plotly's native behavior runs synchronously with zero overhead.
    - **`on_relayout` debouncing**: The `plotly_relayout` handler is debounced (e.g., 150ms trailing) before sending to Python. During a pan/zoom drag, Plotly fires `plotly_relayout` on every frame. The debounce coalesces these into a single callback at the end of the interaction. Since different relayout events carry different keys (axis ranges vs. camera vs. dragmode), the debounce merges keys from all events within the window via `Object.assign`, ensuring no data is lost. Discrete events like axis reset or dragmode change are rare enough that the debounce window doesn't noticeably delay them.
25. Constant lookup table maps Plotly event name → Python param name.

**File:** [PlotlyExpressChart.tsx](../plugins/plotly-express/src/js/src/PlotlyExpressChart.tsx)

26. Call `usePlotlyEventCallbacks(containerRef.current, model.getCallbackMap(), model)`.

---

## Affected Files

### Python

| File                                                                                                                        | Change                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [DeephavenFigure.py](../plugins/plotly-express/src/deephaven/plot/express/deephaven_figure/DeephavenFigure.py)              | Add `_callbacks`, `_callback_ids`, `_next_callback_id`; `_register_callback`; `get_callback_by_id`; update `to_json` and `copy` |
| [DeephavenFigureListener.py](../plugins/plotly-express/src/deephaven/plot/express/communication/DeephavenFigureListener.py) | Add `CALLABLE_EVENT` branch in `process_message`; return `CALLABLE_RESPONSE` for preventable events                             |
| `types/callbacks.py` _(new)_                                                                                                | `ChartEventCallback`, `ChartPreventableEventCallback`, `wrap_callable`                                                          |
| [types/\_\_init\_\_.py](../plugins/plotly-express/src/deephaven/plot/express/types/__init__.py)                             | Export new symbols                                                                                                              |
| All files in `plots/`                                                                                                       | Add event callback params; register non-`None` callbacks                                                                        |
| [\_layer.py](../plugins/plotly-express/src/deephaven/plot/express/plots/_layer.py)                                          | Merge child callbacks in `atomic_layer`; accept event params in `layer`                                                         |
| [subplots.py](../plugins/plotly-express/src/deephaven/plot/express/plots/subplots.py)                                       | Merge child callbacks in `atomic_make_subplots`; accept event params in `make_subplots`                                         |

### JavaScript

| File                                                                                          | Change                                                                                                                                            |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [PlotlyExpressChartModel.ts](../plugins/plotly-express/src/js/src/PlotlyExpressChartModel.ts) | Parse `callbacks`/`preventable_callbacks`, add `getCallbackMap`, `sendEventCallback`, `sendEventCallbackWithResponse`, handle `CALLABLE_RESPONSE` |
| `usePlotlyEventCallbacks.ts` _(new)_                                                          | Hook: attach/detach Plotly event listeners, serialize event data, request-response for preventable events, programmatic re-triggers               |
| [PlotlyExpressChart.tsx](../plugins/plotly-express/src/js/src/PlotlyExpressChart.tsx)         | Call `usePlotlyEventCallbacks`                                                                                                                    |
| `packages/chart/src/Chart.tsx` _(web-client-ui)_                                              | Conditionally add `select2d`/`lasso2d` modebar buttons when selection callbacks are present                                                       |

---

## Verification

### Python Unit Tests

- `wrap_callable` correctly trims excess positional args for 0-arg, 1-arg, and variadic functions.
- `wrap_callable` propagates return values from the wrapped function.
- `_register_callback` assigns stable, incrementing IDs.
- `to_json` includes `deephaven.callbacks` when callbacks are registered, omits it when none are.
- `to_json` includes `deephaven.preventable_callbacks` listing IDs of preventable-event callbacks.
- `layer` with two figures that both have `on_click`: resulting figure uses the last figure's callback.
- `layer` with a direct `on_click` kwarg: direct kwarg wins.
- `make_subplots` follows the same merging rules.
- `process_message` with a `CALLABLE_EVENT` (no `request_id`) calls the correct Python function, returns empty.
- `process_message` with a `CALLABLE_EVENT` (with `request_id`) calls the function and returns `CALLABLE_RESPONSE` with the result.
- Preventable callback returning `False` → response `result` is `False`.
- Preventable callback returning `True`/`None` → response `result` is `True`/`None`.
- Unknown `callback_id` does not raise.
- Exception inside a callback does not crash the connection.

### e2e Tests

- `scatter` with `on_click`: click a point → callback fires with `points[0].x` and `points[0].y`.
- `scatter` with `on_selected`: box-select → callback fires with multiple points.
- `sunburst` with `on_click` returning `False`: click → no drill-down occurs, event data includes `next_level`.
- `sunburst` with `on_click` returning `True`: click → drill-down proceeds after response.
- `scatter` with `on_click` returning `False`: click → return value ignored, no effect on behavior.
- `scatter` with `on_legend_click` returning `False`: click legend → trace stays visible.
- `scatter` with `on_legend_click` returning `True`: click legend → trace toggles.
- `scatter` with `on_legend_click` + `on_legend_double_click`: single-click → only `on_legend_click` fires (after debounce). double-click → only `on_legend_double_click` fires (pending single-click cancelled).
- `scatter` with `on_legend_click` only: single-click → `on_legend_click` fires. double-click → default isolate/show-all behavior occurs (no Python round-trip).
- `layer(fig_a, fig_b, on_click=cb)`: direct kwarg fires on click.
- `layer(fig_a_with_click, fig_b_with_click)`: last child's callback fires.
- `treemap` with `on_click`: same as sunburst.
- `icicle` with `on_click`: same as sunburst.
- `on_legend_click` returning `False`: legend click → toggle prevented.
- `on_legend_click` returning `True`: legend click → toggle proceeds after response.
- `make_subplots` with `on_relayout`: pan a subplot → callback fires.

---

## Decisions

### Cannot Reuse ui Plugin Callbacks

The ui plugin's system is coupled to its JSON-RPC / `NodeEncoder` / `ElementMessageStream` pipeline. plotly-express uses a `MessageStream` protocol with different message types. The pattern is mirrored but implemented independently.

### Excluded Events

The following Plotly events are excluded from the initial implementation but can be added later if needed: `on_after_plot`, `on_button_clicked`, `on_click_anywhere`, `on_before_export`, `on_after_export`, `on_auto_size`, `on_hover`, `on_unhover`, `on_hover_anywhere`, `on_before_hover`, `on_selecting`, `on_redraw`, `on_restyle`, `on_slider_change`, `on_slider_start`, `on_slider_end`, `on_animated`, `on_animating_frame`, `on_animation_interrupted`, `on_transitioning`, `on_transition_interrupted`. These would fire too frequently (especially without user interaction), are currently using functionality we don't expose and don't encourage, or are otherwise unreliable and/or internal. Adding any of these later requires only adding the param to chart function signatures and wiring the Plotly event in the JS hook — the callback infrastructure handles it automatically.

### `on_framework` — Excluded

`plotly_framework` is an internal Plotly.js hook with no user-facing semantics.

### Preventable Events Use Request-Response

Three events (`on_click` on hierarchical charts, `on_legend_click`, `on_legend_double_click`) use a request-response pattern instead of fire-and-forget. The JS always prevents the default behavior immediately, sends the event to Python, awaits the callback's return value, and conditionally re-triggers the default programmatically. This introduces a small delay but allows Python to make per-interaction decisions about whether to allow the default behavior. For `on_click` on non-hierarchical charts, the callback is fire-and-forget (return value ignored).

### Legend Click/Double-Click Interaction

Plotly fires `plotly_legendclick` on **every** click (including both clicks of a double-click) and returning `false` from it blocks both the single and double-click defaults. This creates a coupling: registering `on_legend_click` requires also handling double-clicks to preserve correct behavior.

**Rules:**

- When `on_legend_click` is registered: JS always registers handlers for BOTH `plotly_legendclick` and `plotly_legenddoubleclick`, even if `on_legend_double_click` is not registered
- Single-clicks are debounced by `doubleClickDelay` (~300ms) before sending to Python
- Double-clicks cancel the pending single-click and are handled separately
- When only `on_legend_double_click` is registered: JS only registers `plotly_legenddoubleclick` — Plotly handles single-clicks natively

The ~300ms debounce matches Plotly's own internal delay for the same discrimination purpose — users already experience this delay in standard Plotly charts.

### Hierarchical Charts Use `on_click` for Drill-Down Control

On hierarchical charts (sunburst, treemap, icicle), Plotly fires `plotly_sunburstclick` / `plotly_treemapclick` / `plotly_icicleclick` INSTEAD of `plotly_click`. Rather than exposing separate per-chart-type events, `on_click` handles all of these uniformly. The JS intercepts the specialized event, serializes it as an `on_click` event with an additional `next_level` field, and uses request-response to control drill-down. This keeps the API simple — one event covers both the click data and the drill-down control.

### Last-Wins Merging

Consistent with how layout properties merge in `layer` and `make_subplots`. Direct kwargs always take precedence.

### Stable Callback IDs

IDs are assigned at construction time and don't change when data refreshes. The frontend re-reads the map on each `NEW_FIGURE` but the IDs remain the same.

### Fire-and-Forget vs Request-Response

Most callbacks are fire-and-forget (return `None`, exceptions caught and logged). Three preventable event callbacks (`on_click` on hierarchical charts, `on_legend_click`, `on_legend_double_click`) use request-response — the JS awaits the Python return value before deciding whether to re-trigger the default behavior. If the response times out or errors, the default behavior proceeds (fail-open). `on_click` on non-hierarchical charts is fire-and-forget (the return value is ignored even if present).

### `on_relayout` Debouncing

`plotly_relayout` can fire many times per second during continuous interactions (e.g., pan drag, scroll zoom). Without debouncing, every frame would send a message to Python and execute the callback — flooding the connection and the Python thread. The JS debounces with a ~150ms trailing window, merging event data keys from all firings within the window via `Object.assign`. This means:

- During a pan drag, only one callback fires at the end (with the final axis ranges)
- During scroll zoom, rapid events coalesce into one callback per ~150ms pause
- Discrete events (axis reset, dragmode change) are delayed by at most 150ms, which is imperceptible

The merge is safe because `plotly_relayout` data is a flat dict of changed keys — later values for the same key overwrite earlier ones, which is the correct semantic (you want the final state, not intermediate). Different keys from overlapping events are preserved (e.g., if both `xaxis.range` and `dragmode` change in the same window, both appear in the merged dict).

### No Overhead Without Handlers

When no event callbacks are registered, zero event listeners are attached to the Plotly div. When only fire-and-forget callbacks are registered, only those specific listeners are attached. Preventable event interception is installed only when `preventable_callbacks` is non-empty for that specific event. Charts without any event handlers have exactly the same performance as before this feature.

### Future Deephaven-Specific Events

The architecture supports two patterns for Deephaven-specific events when they are added: (1) server-side events fired directly in `DeephavenFigureListener` with no JS round-trip, and (2) JS-originated events sent via `CALLABLE_EVENT` message. No infrastructure changes needed — just add the param and fire the callback.
