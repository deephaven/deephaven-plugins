# Runtime API Support: Architectural Plan

**Covers:** IChartApi methods, ISeriesApi methods, ITimeScaleApi methods, IPriceScaleApi methods,
IPriceLine live management, and the Events system (click, dblClick, crosshairMove)

**Status of all runtime APIs today:** Entirely N/A — the Python layer is a static configuration
builder. There is no live Python handle on the running chart.

---

## 1. Current Architecture

### 1.1 The One-Way Pipeline

The plugin today operates as a strict one-way pipeline:

```
Python (build time)
  chart() / line() / candlestick() ...
      └─► TvlChart (holds series specs + chart_options dict)
              └─► TvlChartType (Deephaven plugin object type)
                      └─► TvlChartConnection (MessageStream adapter)
                              └─► TvlChartListener.process_message()
                                      └─► _handle_retrieve()
                                              └─► NEW_FIGURE JSON → client
```

The JS side is entirely self-contained after receiving `NEW_FIGURE`. Table ticks flow through
Deephaven's built-in subscription machinery (via `ChartData` / `TableSubscription`), not through
the plugin message stream. The plugin's `MessageStream` is used only once: the client sends
`{"type":"RETRIEVE"}` and Python responds with `{"type":"NEW_FIGURE", "figure": {...}}`. After
that, the message channel is idle.

### 1.2 The `MessageStream` Contract

`deephaven.plugin.object_type.MessageStream` is a bidirectional channel:

- **JS → Python:** `widget.sendMessage(payload, refs)` → `TvlChartConnection.on_data(payload, refs)`
- **Python → JS:** returning `(bytes, list)` from `on_data()` sends a message back immediately
- **Python → JS (push):** `client_connection.on_data(payload, refs)` can be called at any time
  from Python (e.g., from a background thread) to push an unsolicited message to JS

The infrastructure for bidirectional communication already exists. The `RETRIEVE`/`NEW_FIGURE`
exchange demonstrates both directions. What is missing is:

1. A protocol for Python to *push commands* to JS at arbitrary times (after chart creation)
2. A protocol for JS to *push events* to Python at arbitrary times (user interactions)
3. A protocol for Python to *query* JS and *wait for* a response (coordinate conversions, range
   queries)
4. Python-side handle objects that give users an API to issue commands and register callbacks

### 1.3 JS-Side Structure

On the JS side, the chart lifecycle looks like:

```
TradingViewChart (React component)
  ├── TradingViewChartModel   — manages widget, table subscriptions, data flow
  └── TradingViewChartRenderer — wraps the actual IChartApi, ISeriesApi instances
```

`TradingViewChartRenderer` directly holds the `IChartApi` object returned by `createChart()`.
It already calls `chart.timeScale().getVisibleRange()` (in `TradingViewChart.tsx`) and
`chart.applyOptions()` (for theme updates). The infrastructure to call runtime methods is there;
what is missing is a way for *Python* to trigger those calls.

---

## 2. What Runtime APIs Would Enable

### 2.1 IChartApi

| Method group | Use case |
|---|---|
| `applyOptions(opts)` | Live visual updates: change colors, crosshair mode, grid visibility after chart is displayed |
| `addSeries()` / `removeSeries()` | Dynamic series: add/remove a series in response to user action without rebuilding the chart |
| `subscribeClick` / `subscribeDblClick` | Python callbacks on user clicks — enable "click a bar, run Python code" workflows |
| `subscribeCrosshairMove` | Live crosshair data feed — enable Python to react to the user hovering over data |
| `setCrosshairPosition` / `clearCrosshairPosition` | Programmatic crosshair control — multi-chart sync |
| `takeScreenshot` | Export chart image from Python |
| `fitContent` / `resize` | Programmatic viewport control |
| `addPane` / `removePane` / `swapPanes` | Dynamic pane management |

### 2.2 ISeriesApi

| Method group | Use case |
|---|---|
| `applyOptions(opts)` | Live series style updates: change color, line width, visibility |
| `setData()` / `update()` | Manual data control: inject data from a Python list rather than a table |
| `createPriceLine()` / `removePriceLine()` | Dynamic price lines: add/remove threshold lines at runtime |
| `applyOptions()` on `IPriceLine` | Move an existing price line to a new price level |
| `priceToCoordinate()` / `coordinateToPrice()` | Custom drawing / overlay positioning |
| `moveToPane()` | Move a series between panes dynamically |

### 2.3 ITimeScaleApi

| Method group | Use case |
|---|---|
| `fitContent()` | Reset the view to show all data — most-wanted single command |
| `scrollToRealTime()` | Jump to latest data in live feeds |
| `setVisibleRange(range)` | Programmatic zoom: `ts.set_visible_range(from_time, to_time)` |
| `setVisibleLogicalRange(range)` | Zoom by bar count: `ts.set_visible_logical_range(0, 200)` |
| `scrollToPosition(pos, animated)` | Animated scroll to a specific bar offset |
| `resetTimeScale()` | Reset zoom |
| `applyOptions(opts)` | Change bar spacing, right offset, etc. |
| `subscribeVisibleTimeRangeChange` | Python callback when user pans/zooms — enables linked charts |
| `getVisibleRange()` / `getVisibleLogicalRange()` | Synchronous queries (require request-response) |

### 2.4 IPriceScaleApi

| Method group | Use case |
|---|---|
| `setVisibleRange(range)` | Lock the y-axis to a specific price range |
| `setAutoScale(on)` | Toggle autoscaling on/off at runtime |
| `applyOptions(opts)` | Change scale margins, mode, visibility |
| `getVisibleRange()` | Query current range (requires request-response) |

### 2.5 Events

| Event | Use case |
|---|---|
| `subscribeClick` | "Click a candle, run an order" or "click to annotate" workflows |
| `subscribeDblClick` | Double-click to zoom or reset view |
| `subscribeCrosshairMove` | Real-time price display in external Python UI elements |
| `subscribeVisibleTimeRangeChange` | Multi-chart pan sync; trigger data fetches on range change |
| `subscribeVisibleLogicalRangeChange` | Same, in logical index space |
| `subscribeDataChanged` (ISeriesApi) | React in Python when the JS-side data changes |

---

## 3. Architecture Options

### Option A: Command Channel (Python → JS, fire-and-forget)

Extend the existing `MessageStream` with a new message type that Python can send to JS at any time
after the chart is initialized.

**Wire protocol (Python → JS):**
```json
{
  "type": "COMMAND",
  "id": "cmd_001",
  "target": "chart",
  "method": "applyOptions",
  "args": { "grid": { "vertLines": { "visible": false } } }
}
```

**Wire protocol variants for targeting:**
```json
{ "target": "chart",      "method": "applyOptions",     "args": {...} }
{ "target": "timescale",  "method": "fitContent",        "args": {} }
{ "target": "timescale",  "method": "setVisibleRange",   "args": {"from": 1700000000, "to": 1700100000} }
{ "target": "pricescale", "scaleId": "right",           "method": "setAutoScale", "args": {"on": true} }
{ "target": "series",     "seriesId": "series_0",       "method": "applyOptions", "args": {"color": "red"} }
{ "target": "priceline",  "seriesId": "series_0",       "lineId": "pl_001",
  "method": "applyOptions", "args": {"price": 150.0} }
```

**Python side: new handle classes**

```text
class ChartHandle:
    """Live handle to a running TradingView chart. Returned alongside TvlChart."""

    def __init__(self, connection: TvlChartConnection):
        self._conn = connection

    def apply_options(self, **options) -> None:
        self._conn.send_command("chart", "applyOptions", options)

    def fit_content(self) -> None:
        self._conn.send_command("timescale", "fitContent", {})

    def set_visible_range(self, from_time, to_time) -> None:
        self._conn.send_command("timescale", "setVisibleRange",
                                {"from": from_time, "to": to_time})

    def time_scale(self) -> "TimeScaleHandle":
        return TimeScaleHandle(self._conn)

    def price_scale(self, scale_id: str = "right") -> "PriceScaleHandle":
        return PriceScaleHandle(self._conn, scale_id)

    def series(self, series_id: str) -> "SeriesHandle":
        return SeriesHandle(self._conn, series_id)


class TimeScaleHandle:
    def fit_content(self) -> None: ...
    def scroll_to_real_time(self) -> None: ...
    def set_visible_range(self, from_time, to_time) -> None: ...
    def set_visible_logical_range(self, from_idx: float, to_idx: float) -> None: ...
    def scroll_to_position(self, position: float, animated: bool = True) -> None: ...
    def reset_time_scale(self) -> None: ...
    def apply_options(self, **options) -> None: ...


class PriceScaleHandle:
    def set_visible_range(self, from_price: float, to_price: float) -> None: ...
    def set_auto_scale(self, on: bool) -> None: ...
    def apply_options(self, **options) -> None: ...


class SeriesHandle:
    def apply_options(self, **options) -> None: ...
    def create_price_line(self, price: float, **options) -> "PriceLineHandle": ...
    def remove_price_line(self, handle: "PriceLineHandle") -> None: ...


class PriceLineHandle:
    def apply_options(self, **options) -> None: ...
    def remove(self) -> None: ...
```

**JS side: command dispatcher**

In `TradingViewChartModel.ts`, the widget's `addEventListener('message', ...)` handler
(or equivalent) processes incoming messages. Add a branch for `type === "COMMAND"`:

```typescript
function handleCommand(renderer: TradingViewChartRenderer, msg: CommandMessage): void {
  const chart = renderer.getChart();
  switch (msg.target) {
    case 'chart':
      if (msg.method === 'applyOptions') chart.applyOptions(msg.args);
      else if (msg.method === 'fitContent') chart.timeScale().fitContent();
      // ...
      break;
    case 'timescale': {
      const ts = chart.timeScale();
      if (msg.method === 'fitContent') ts.fitContent();
      else if (msg.method === 'scrollToRealTime') ts.scrollToRealTime();
      else if (msg.method === 'setVisibleRange') ts.setVisibleRange(msg.args);
      else if (msg.method === 'setVisibleLogicalRange') ts.setVisibleLogicalRange(msg.args);
      else if (msg.method === 'applyOptions') ts.applyOptions(msg.args);
      // ...
      break;
    }
    case 'pricescale': {
      const ps = chart.priceScale(msg.scaleId);
      if (msg.method === 'setVisibleRange') ps.setVisibleRange(msg.args);
      else if (msg.method === 'setAutoScale') ps.setAutoScale(msg.args.on);
      else if (msg.method === 'applyOptions') ps.applyOptions(msg.args);
      break;
    }
    case 'series': {
      const series = renderer.getSeriesById(msg.seriesId);
      if (!series) return;
      if (msg.method === 'applyOptions') series.applyOptions(msg.args);
      else if (msg.method === 'createPriceLine') {
        const line = series.createPriceLine(msg.args);
        renderer.registerPriceLine(msg.lineId, line);
      }
      else if (msg.method === 'removePriceLine') {
        const line = renderer.getPriceLine(msg.lineId);
        if (line) { series.removePriceLine(line); renderer.unregisterPriceLine(msg.lineId); }
      }
      break;
    }
    case 'priceline': {
      const line = renderer.getPriceLine(msg.lineId);
      if (line && msg.method === 'applyOptions') line.applyOptions(msg.args);
      break;
    }
  }
}
```

**Pros:**
- Builds directly on the existing `MessageStream` infrastructure
- No new dependencies or concepts needed
- Fire-and-forget is simple on both ends: no coroutine or async complexity on Python side
- Covers the vast majority of high-value runtime methods (all void-returning methods)
- Command arrives on the JS main thread so chart mutations are safe

**Cons:**
- No way to get a return value (cannot implement `getVisibleRange()`, `priceToCoordinate()`, etc.)
- No error reporting: if JS throws on a bad command, Python has no way to know
- Commands sent before the chart is fully initialized (before `NEW_FIGURE` is processed) will be lost
  unless the JS side queues them

**Complexity:** Low-to-medium. Mostly mechanical wiring.

**Feasible runtime methods:** All 22 ITimeScaleApi methods that are void (`fitContent`,
`scrollToRealTime`, `setVisibleRange`, `setVisibleLogicalRange`, `scrollToPosition`,
`resetTimeScale`, `applyOptions`). All 5 void IPriceScaleApi methods. All void IChartApi
methods (`applyOptions`, `addSeries`, `removeSeries`, `addPane`, `removePane`, `swapPanes`,
`setCrosshairPosition`, `clearCrosshairPosition`). All void ISeriesApi methods
(`applyOptions`, `createPriceLine`, `removePriceLine`, `moveToPane`, `setSeriesOrder`).

---

### Option B: Event Channel (JS → Python, push-based)

Extend the `MessageStream` with JS-originated messages that Python can register callbacks for.

**Wire protocol (JS → Python):**
```json
{
  "type": "EVENT",
  "event": "click",
  "params": {
    "time": 1700000000,
    "logical": 142,
    "point": { "x": 320, "y": 180 },
    "paneIndex": 0,
    "seriesData": [
      { "seriesId": "series_0", "value": 4200.5, "time": 1700000000 }
    ]
  }
}
```

```json
{ "type": "EVENT", "event": "crosshairMove",    "params": { ... } }
{ "type": "EVENT", "event": "dblClick",          "params": { ... } }
{ "type": "EVENT", "event": "visibleRangeChange","params": {"from": ..., "to": ...} }
{ "type": "EVENT", "event": "logicalRangeChange","params": {"from": ..., "to": ...} }
```

**Python side: callback registry**

In `TvlChartListener.process_message()`, add a branch for `type == "EVENT"`:

```text
class TvlChartListener:
    def __init__(self, chart, client_connection):
        ...
        self._event_handlers: dict[str, list[Callable]] = {}

    def process_message(self, payload, references):
        message = json.loads(payload.decode())
        msg_type = message.get("type", "")

        if msg_type == "RETRIEVE":
            return self._handle_retrieve()
        elif msg_type == "EVENT":
            self._dispatch_event(message)
            return b"", []

        return b"", []

    def _dispatch_event(self, message: dict) -> None:
        event_name = message.get("event", "")
        params_raw = message.get("params", {})
        handlers = self._event_handlers.get(event_name, [])
        if not handlers:
            return
        # Build Python-typed params object
        params = MouseEventParams.from_dict(params_raw)
        for handler in handlers:
            try:
                handler(params)
            except Exception:
                log.exception("Error in TVL event handler for '%s'", event_name)

    def subscribe(self, event: str, handler: Callable) -> None:
        self._event_handlers.setdefault(event, []).append(handler)
        # Tell JS to start emitting this event
        self._send_subscription_command(event, subscribe=True)

    def unsubscribe(self, event: str, handler: Callable) -> None:
        handlers = self._event_handlers.get(event, [])
        if handler in handlers:
            handlers.remove(handler)
        if not handlers:
            self._send_subscription_command(event, subscribe=False)
```

**`MouseEventParams` Python dataclass:**

```text
from dataclasses import dataclass, field
from typing import Optional, Any

@dataclass
class Point:
    x: float
    y: float

@dataclass
class TouchMouseEventData:
    client_x: float
    client_y: float
    page_x: float
    page_y: float
    screen_x: float
    screen_y: float
    local_x: float
    local_y: float
    ctrl_key: bool
    alt_key: bool
    shift_key: bool
    meta_key: bool

@dataclass
class SeriesDataItem:
    series_id: str
    value: Optional[float]
    time: Optional[Any]  # int (UTCTimestamp) or str (BusinessDay ISO)

@dataclass
class MouseEventParams:
    time: Optional[Any] = None                         # UTCTimestamp or None if outside data
    logical: Optional[float] = None                    # Fractional logical index
    point: Optional[Point] = None                      # Pixel coords (None if outside chart)
    pane_index: Optional[int] = None
    series_data: list[SeriesDataItem] = field(default_factory=list)
    hovered_series_id: Optional[str] = None
    hovered_object_id: Optional[Any] = None
    source_event: Optional[TouchMouseEventData] = None

    @classmethod
    def from_dict(cls, d: dict) -> "MouseEventParams":
        point = Point(**d["point"]) if d.get("point") else None
        se = d.get("sourceEvent")
        source = TouchMouseEventData(**{
            k: se[k] for k in TouchMouseEventData.__dataclass_fields__
        }) if se else None
        series_data = [
            SeriesDataItem(**item) for item in d.get("seriesData", [])
        ]
        return cls(
            time=d.get("time"),
            logical=d.get("logical"),
            point=point,
            pane_index=d.get("paneIndex"),
            series_data=series_data,
            hovered_series_id=d.get("hoveredSeriesId"),
            hovered_object_id=d.get("hoveredObjectId"),
            source_event=source,
        )
```

**JS side: event emitter**

The JS side needs a subscription-management layer so it only subscribes to events that Python
has actually requested (to avoid flooding the channel with high-frequency `crosshairMove` events
when Python has no handler).

```typescript
type EventSubscriptionMessage = {
  type: 'SUBSCRIBE_EVENT' | 'UNSUBSCRIBE_EVENT';
  event: string;
};

class TvlEventEmitter {
  private activeSubscriptions: Set<string> = new Set();
  private cleanups: Map<string, () => void> = new Map();
  private sendToServer: (payload: string) => void;
  private chart: IChartApi;
  private renderer: TradingViewChartRenderer;

  subscribeEvent(eventName: string): void {
    if (this.activeSubscriptions.has(eventName)) return;
    this.activeSubscriptions.add(eventName);

    let cleanup: () => void;

    if (eventName === 'click') {
      const handler = (params: MouseEventParams) => this.emit('click', params);
      this.chart.subscribeClick(handler);
      cleanup = () => this.chart.unsubscribeClick(handler);
    } else if (eventName === 'dblClick') {
      const handler = (params: MouseEventParams) => this.emit('dblClick', params);
      this.chart.subscribeDblClick(handler);
      cleanup = () => this.chart.unsubscribeDblClick(handler);
    } else if (eventName === 'crosshairMove') {
      const handler = (params: MouseEventParams) => this.emitThrottled('crosshairMove', params);
      this.chart.subscribeCrosshairMove(handler);
      cleanup = () => this.chart.unsubscribeCrosshairMove(handler);
    } else if (eventName === 'visibleRangeChange') {
      const handler = (range: Range<Time> | null) => this.emit('visibleRangeChange', range);
      this.chart.timeScale().subscribeVisibleTimeRangeChange(handler);
      cleanup = () => this.chart.timeScale().unsubscribeVisibleTimeRangeChange(handler);
    }
    // ... etc.

    if (cleanup!) this.cleanups.set(eventName, cleanup);
  }

  private emit(event: string, params: unknown): void {
    const payload = JSON.stringify({
      type: 'EVENT',
      event,
      params: this.serializeParams(event, params),
    });
    this.sendToServer(payload);
  }

  private serializeParams(event: string, params: unknown): unknown {
    // Serialize MouseEventParams: replace ISeriesApi keys with seriesId strings
    // so JSON is self-contained (ISeriesApi is not serializable)
    if (event === 'click' || event === 'dblClick' || event === 'crosshairMove') {
      const p = params as MouseEventParams<Time>;
      return {
        time: p.time,
        logical: p.logical,
        point: p.point,
        paneIndex: p.paneIndex,
        seriesData: p.seriesData
          ? Array.from(p.seriesData.entries()).map(([series, data]) => ({
              seriesId: this.renderer.getSeriesId(series),
              ...data,
            }))
          : [],
        hoveredSeriesId: p.hoveredSeries
          ? this.renderer.getSeriesId(p.hoveredSeries)
          : undefined,
        sourceEvent: p.sourceEvent,
      };
    }
    return params;
  }
}
```

**Throttling note for `crosshairMove`:**
`crosshairMove` fires on every pixel of mouse movement — potentially hundreds of times per second.
Sending every event to Python would saturate the WebSocket. The JS side must throttle or debounce
this event (e.g., send at most once per 50–100ms) before forwarding to Python. The Python handler
should document that it receives a sampled stream, not every event.

**Threading note (Python side):**
`on_data()` is called on the Deephaven server's message-handling thread. Python event handlers
registered by the user (e.g., `chart.on_click(my_fn)`) will be called on that same thread.
If the user's handler is slow or blocks, it will delay subsequent messages. The implementation
should:
1. Document that handlers must be fast and non-blocking
2. Optionally, dispatch handlers to a thread pool executor and return from `on_data()` immediately
3. Provide guidance that users should queue work rather than do it inline:
   ```python
   import queue

   q = queue.Queue()


   def on_click(params):
       q.put(params)  # non-blocking; process in another thread
   ```

**Pros:**
- Enables the entire Python callback system: click, dblClick, crosshairMove, range changes
- Clean separation: Python registers interest, JS only emits what Python wants
- Demand-driven: no events are sent until Python subscribes

**Cons:**
- High-frequency events (crosshairMove, visibleRangeChange) require throttling logic
- JS must serialize `MouseEventParams` carefully (ISeriesApi → seriesId string mapping)
- Threading model requires careful documentation
- `crosshairMove` over a WebSocket introduces measurable latency; Python callbacks will not feel
  as instantaneous as a browser-native handler

**Complexity:** Medium. The protocol is simple, but the JS serialization and Python threading model
require careful design.

---

### Option C: Request-Response (Python queries JS, awaits reply)

For methods that return a value — `getVisibleRange()`, `getVisibleLogicalRange()`,
`priceToCoordinate()`, `coordinateToPrice()`, `scrollPosition()` — a fire-and-forget command
is insufficient. Python must send a query and wait for JS to respond.

**Wire protocol:**
```json
// Python → JS
{ "type": "QUERY", "id": "q_42", "target": "timescale", "method": "getVisibleRange" }

// JS → Python (in response)
{ "type": "QUERY_RESPONSE", "id": "q_42", "result": {"from": 1700000000, "to": 1700100000} }
{ "type": "QUERY_RESPONSE", "id": "q_42", "error": "chart not yet initialized" }
```

**Python side:**

The current `on_data()` contract only allows Python to *respond* to incoming messages — it cannot
*initiate* a message and then block waiting for a reply. The `client_connection.on_data()` (the
push direction) returns immediately and provides no way to correlate responses. To implement
request-response in Python, the system needs either:

**Sub-option C1: Blocking with threading.Event**

```text
import threading
import uuid

class TvlChartListener:
    def __init__(self, ...):
        ...
        self._pending_queries: dict[str, threading.Event] = {}
        self._query_results: dict[str, Any] = {}

    def query(self, target: str, method: str, timeout: float = 5.0) -> Any:
        """Send a query to JS and block until the response arrives."""
        query_id = str(uuid.uuid4())
        event = threading.Event()
        self._pending_queries[query_id] = event

        payload = json.dumps({
            "type": "QUERY",
            "id": query_id,
            "target": target,
            "method": method,
        }).encode()
        self._client_connection.on_data(payload, [])

        if not event.wait(timeout=timeout):
            del self._pending_queries[query_id]
            raise TimeoutError(f"Query '{method}' timed out after {timeout}s")

        result = self._query_results.pop(query_id)
        if isinstance(result, dict) and "error" in result:
            raise RuntimeError(result["error"])
        return result

    def process_message(self, payload, references):
        message = json.loads(payload.decode())
        msg_type = message.get("type", "")

        if msg_type == "QUERY_RESPONSE":
            qid = message.get("id")
            event = self._pending_queries.pop(qid, None)
            if event:
                self._query_results[qid] = message.get("result") or message.get("error")
                event.set()
            return b"", []
        ...
```

**CRITICAL WARNING:** This approach has a fundamental deadlock risk. If `query()` is called on
the Deephaven server's message-handling thread (the same thread that calls `on_data()`), the
`event.wait()` will block that thread, preventing the `QUERY_RESPONSE` from ever being processed.
This would deadlock permanently. This sub-option is only safe if:
- `query()` is always called from a *user thread* (not from within an event handler)
- The Deephaven server uses a separate thread for message dispatch

**Sub-option C2: Async/Future-based (Python 3.10+)**

Instead of blocking, `query()` returns a `concurrent.futures.Future` that Python code can
`.result()` on a user thread:

```text
def query_async(self, target: str, method: str) -> Future:
    fut: Future = Future()
    query_id = str(uuid.uuid4())
    self._pending_futures[query_id] = fut
    # push to JS
    ...
    return fut

# User code:
fut = handle.time_scale().get_visible_range_async()
# do other work ...
result = fut.result(timeout=5.0)  # blocks until JS responds
```

**Sub-option C3: Polling (simplest, safest)**

Instead of true request-response, JS proactively pushes the visible range whenever it changes
(as an `EVENT` message), and Python caches the last-known value. A `get_visible_range()` call
on the Python handle returns the cached value (which may be slightly stale):

```text
class TimeScaleHandle:
    def __init__(self, listener):
        self._cached_range = None
        listener.subscribe("visibleRangeChange", self._cache_range)

    def _cache_range(self, params):
        self._cached_range = params

    def get_visible_range(self):
        return self._cached_range  # may be None if no range received yet
```

This avoids all deadlock risk and is appropriate for the `visibleRangeChange`/
`logicalRangeChange` use cases where Python usually wants to track the current range for
downstream computation.

**Pros of C:** Enables the full query API; Python can ask "what is currently visible?" and act on it
**Cons of C:** Deadlock risk is substantial; adds significant complexity; latency (~1–5ms round-trip
over localhost WebSocket) makes it unsuitable for tight loops; sub-option C3 (polling) avoids most
risks at the cost of possible staleness

**Complexity:** High (C1/C2), Low (C3).

**Feasible runtime methods (C3 only):** `getVisibleRange`, `getVisibleLogicalRange`, `scrollPosition`
as cached/approximate reads. True synchronous queries (C1/C2) are inadvisable.

---

### Option D: Deephaven UI Integration

If the plugin is used inside a `deephaven.ui` application, Deephaven UI's callback mechanism could
be used instead of rolling a new message channel. `deephaven.ui` provides:
- `ui.use_state()` for reactive state
- `use_effect()` for side effects
- Callback functions that are called from JS on user interaction

This would allow wiring TVL events to UI callbacks through DH UI's existing infrastructure.
However, this approach has significant constraints:
- Requires the user to write their chart inside a `@ui.component` function
- Adds a mandatory dependency on `deephaven-plugin-ui`
- Coupling TVL tightly to DH UI would be architecturally unsound
- DH UI's callback mechanism is designed for UI components, not for raw WebSocket messages

**Verdict:** Option D is not a viable general-purpose approach. It could complement the other
options as a higher-level ergonomic layer for users who are already in a DH UI context, but it
cannot be the foundation.

---

## 4. Comparison Summary

| Criterion | Option A (Commands) | Option B (Events) | Option C (Request-Response) | Option D (DH UI) |
|---|:---:|:---:|:---:|:---:|
| Implementation complexity | Low | Medium | High | Very high |
| Deadlock risk | None | None | High (C1/C2) / None (C3) | N/A |
| Covers void-returning methods | Yes | N/A | N/A | Partial |
| Covers JS→Python callbacks | No | Yes | No | Yes |
| Covers value-returning queries | No | Partial (C3 only) | Yes | Partial |
| Requires new JS infrastructure | Yes (small) | Yes (larger) | Yes (larger) | No |
| Requires new Python classes | Yes | Yes | Yes | No |
| Works without DH UI | Yes | Yes | Yes | No |
| Suitable for crosshairMove | N/A | Yes (with throttling) | N/A | N/A |
| Recommended | Phase 1 | Phase 1 | Phase 3 only | Not recommended |

---

## 5. Python-Side Class Hierarchy

The following new module structure is proposed. These classes are not part of the
static-configuration layer; they are runtime handles returned when a chart is opened.

```
communication/
  connection.py       # TvlChartConnection (existing, extend)
  listener.py         # TvlChartListener (existing, extend)
  command.py          # NEW: command serialization helpers
  event_dispatcher.py # NEW: event routing to Python callbacks

handles/
  __init__.py
  chart_handle.py     # ChartHandle
  series_handle.py    # SeriesHandle
  time_scale_handle.py # TimeScaleHandle
  price_scale_handle.py # PriceScaleHandle
  price_line_handle.py  # PriceLineHandle

types/
  events.py           # MouseEventParams, Point, TouchMouseEventData, SeriesDataItem
```

### Handle acquisition

There are two design choices for how Python code gets a `ChartHandle`:

**Design 1: Explicit open() call**
```text
chart = tvl.line(table, time='ts', value='price')
handle = chart.open()  # returns ChartHandle; chart must be displayed first
handle.time_scale().fit_content()
```
Problem: the chart must be displayed in Deephaven before `open()` can work (the WebSocket
connection is established when the UI renders the widget). `open()` would need to block until
the JS side sends `RETRIEVE`.

**Design 2: Callbacks on connection**
```text
def on_ready(handle: ChartHandle):
    handle.time_scale().fit_content()

chart = tvl.line(table, time='ts', value='price', on_ready=on_ready)
```
The `TvlChartListener` calls `on_ready` after successfully handling `RETRIEVE` and sending
`NEW_FIGURE`. This avoids blocking and is consistent with how Deephaven UI handles async
widget initialization.

**Design 3: Return handle alongside chart (deferred commands queue)**
```text
chart, handle = tvl.line_with_handle(table, time='ts', value='price')
handle.time_scale().fit_content()  # queued; sent when connection opens
```
Commands issued before the connection is ready are queued in `TvlChartListener` and flushed
when `RETRIEVE` is processed. This gives the smoothest user experience (no callbacks needed),
at the cost of silently discarding commands if the chart is never opened.

**Recommendation:** Design 3 (command queuing) for Phase 1, with Design 2 (on_ready callback)
added in Phase 2 for event subscriptions.

---

## 6. JS-Side Changes

### 6.1 `TradingViewChartModel.ts`

Add a `handleIncomingServerMessage(msg: ServerMessage): void` method that processes:
- `COMMAND` messages → forwards to `TradingViewChartRenderer`
- `SUBSCRIBE_EVENT` / `UNSUBSCRIBE_EVENT` → controls `TvlEventEmitter` subscriptions
- `QUERY` messages → queries `TradingViewChartRenderer`, sends `QUERY_RESPONSE`

The model already receives widget messages (it calls `model.init(exported, dataString)` which
processes `NEW_FIGURE`). Extend the widget message listener to handle the new types.

### 6.2 `TradingViewChartRenderer.ts`

Add:
- `executeCommand(target, method, args): void` — dispatches void commands to the right API object
- `executeQuery(target, method): unknown` — dispatches value-returning queries
- `getSeriesById(id: string): ISeriesApi | undefined` — reverse lookup by series ID
- `registerPriceLine(id: string, line: IPriceLine): void` — tracks dynamically created price lines
- `getPriceLine(id: string): IPriceLine | undefined`
- `unregisterPriceLine(id: string): void`
- `getSeriesId(series: ISeriesApi): string | undefined` — forward lookup for event serialization

### 6.3 New: `TvlEventEmitter.ts`

Standalone class that manages chart event subscriptions and serializes `MouseEventParams` to
JSON-safe objects. Uses a throttle (50ms default for `crosshairMove`) before sending to server.

```typescript
const THROTTLE_MS: Record<string, number> = {
  crosshairMove: 50,
  visibleRangeChange: 100,
  logicalRangeChange: 100,
};
```

### 6.4 Message routing in `TradingViewChart.tsx`

The React component currently initializes the model and renderer but does not wire up the widget's
ongoing message stream. Add a `useEffect` that listens to widget messages after initialization and
routes them to the model's `handleIncomingServerMessage`.

The Deephaven widget API provides `widget.addEventListener('message', handler)` for this purpose.
The handler receives `{ type: 'message', payload: string }` events.

---

## 7. Phased Implementation Recommendation

### Phase 1: Command Channel (Options A) — Highest Value, Lowest Risk

**Scope:** Implement the Python→JS command channel for void-returning methods only.
No events, no queries.

**Specific methods to implement (in priority order):**

1. `TimeScaleHandle.fit_content()` — most-requested single operation; users commonly want to
   reset the view after programmatic data updates
2. `ChartHandle.apply_options(**opts)` — live visual updates without chart rebuild
3. `TimeScaleHandle.apply_options(**opts)` — change bar spacing, right offset at runtime
4. `TimeScaleHandle.set_visible_range(from_time, to_time)` — programmatic zoom
5. `TimeScaleHandle.scroll_to_real_time()` — jump to latest in live feeds
6. `TimeScaleHandle.set_visible_logical_range(from, to)` — zoom by bar count
7. `PriceScaleHandle.set_auto_scale(on)` — toggle autoscaling
8. `PriceScaleHandle.set_visible_range(from_price, to_price)` — lock y-axis range
9. `SeriesHandle.apply_options(**opts)` — change series color, width, visibility
10. `SeriesHandle.create_price_line(price, **opts)` — add dynamic threshold line
11. `PriceLineHandle.apply_options(**opts)` — move/restyle an existing price line
12. `SeriesHandle.remove_price_line(handle)` — remove a price line

**What to skip in Phase 1:**
- `addSeries` / `removeSeries` (requires tracking series handles across the boundary — complex)
- `addPane` / `removePane` / `swapPanes` (complex state management)
- All value-returning queries
- All JS→Python events

**Python API surface (Phase 1):**

```text
# Usage example
chart = tvl.line(table, time='ts', value='price')
# chart is a TvlChart as before — existing API unchanged

# New: get a live handle
handle = chart.handle()  # returns ChartHandle; commands queued until widget connects
ts = handle.time_scale()
ts.fit_content()
ts.set_visible_range(from_time=1700000000, to_time=1700100000)

ps = handle.price_scale("right")
ps.set_auto_scale(False)
ps.set_visible_range(100.0, 200.0)

s = handle.series("series_0")
s.apply_options(color="#ff0000")
pl = s.create_price_line(price=150.0, color="#00ff00", title="Target")
# later:
pl.apply_options(price=155.0)
pl.remove()
```

**Estimated effort:** 3–5 days (Python classes + JS dispatcher + integration test).

**Files to create/modify:**

*Python (new files):*
- `communication/command.py` — `build_command()` serialization helper
- `handles/__init__.py`
- `handles/chart_handle.py` — `ChartHandle` with command queue
- `handles/time_scale_handle.py`
- `handles/price_scale_handle.py`
- `handles/series_handle.py`
- `handles/price_line_handle.py`

*Python (modify):*
- `communication/listener.py` — add command queue flush on `RETRIEVE`, outgoing `send_command()`
- `communication/connection.py` — expose `send_command()` to handles
- `chart.py` — add `handle()` method on `TvlChart` returning a `ChartHandle`

*JS (new files):*
- `TvlCommandDispatcher.ts` — `executeCommand()` + `executeQuery()` logic

*JS (modify):*
- `TradingViewChartModel.ts` — add server-message handling after widget init
- `TradingViewChartRenderer.ts` — add `getSeriesById()`, price line registry

---

### Phase 2: Event Channel (Option B) — High Value, Moderate Complexity

**Scope:** Implement the JS→Python event channel for user interaction callbacks.

**Specific events to implement (in priority order):**

1. `ChartHandle.on_click(callback)` / `ChartHandle.off_click(callback)` — click callbacks
2. `ChartHandle.on_dbl_click(callback)` / `ChartHandle.off_dbl_click(callback)`
3. `TimeScaleHandle.on_visible_range_change(callback)` — range subscriptions for linked charts
4. `TimeScaleHandle.on_visible_logical_range_change(callback)`
5. `ChartHandle.on_crosshair_move(callback)` — throttled crosshair feed

**Python API surface (Phase 2):**

```text
handle = chart.handle()

def on_click(params: MouseEventParams):
    print(f"Clicked at time={params.time}, price via series_data={params.series_data}")

handle.on_click(on_click)
handle.off_click(on_click)  # unsubscribe

def on_range_change(range_params):
    print(f"Visible range: {range_params.from_time} to {range_params.to_time}")

handle.time_scale().on_visible_range_change(on_range_change)
```

**Throttle defaults:**
- `crosshairMove`: 50ms (20 events/sec max)
- `visibleRangeChange`: 100ms (10 events/sec max)
- `click` / `dblClick`: no throttle (low frequency)

**What to skip in Phase 2:**
- `subscribeDataChanged` (ISeriesApi) — low value, the data is already in Python tables
- `subscribeSizeChange` (ITimeScaleApi) — low value

**Estimated effort:** 3–4 days (event emitter + Python dispatcher + throttling + serialization).

**Files to create/modify:**

*Python (new files):*
- `types/events.py` — `MouseEventParams`, `Point`, `TouchMouseEventData`, `SeriesDataItem`
- `communication/event_dispatcher.py` — routes incoming `EVENT` messages to callbacks

*Python (modify):*
- `communication/listener.py` — add `EVENT` message handling, `subscribe()` / `unsubscribe()`
- `handles/chart_handle.py` — add `on_click()`, `on_dbl_click()`, `on_crosshair_move()`
- `handles/time_scale_handle.py` — add `on_visible_range_change()`, `on_visible_logical_range_change()`

*JS (new files):*
- `TvlEventEmitter.ts` — chart event subscriptions with throttling + serialization

*JS (modify):*
- `TradingViewChartModel.ts` — handle `SUBSCRIBE_EVENT` / `UNSUBSCRIBE_EVENT` messages
- `TradingViewChart.tsx` — wire widget message listener post-init

---

### Phase 3: Dynamic Series & Request-Response — Nice-to-Have

**Scope:** The remaining high-complexity runtime APIs.

**3A: Dynamic series management**

`addSeries()` / `removeSeries()` from Python requires:
- A mechanism to generate stable series IDs for dynamically added series
- The Python `SeriesHandle` to track which series it refers to
- The JS side to create the series, bind it to a table (or accept manual data via `setData()`)
- If table-bound: re-doing the Deephaven subscription machinery for the new table reference
- If manually fed: a new `COMMAND` subtype for `setData` / `update` with embedded data arrays

This is significantly more complex than Phases 1 and 2 because it changes the chart's structure
after initialization. Recommended approach: support only *static-data series* (data provided as a
Python list, not a Deephaven table) in Phase 3A, deferring table-bound dynamic series further.

```text
handle.add_series(
    series_type="Line",
    data=[{"time": 1700000000, "value": 100.0}, ...],
    color="#ff0000",
    title="Manual Series",
)
```

**3B: Request-response queries (C3 / polling)**

Implement `get_visible_range()` and `get_visible_logical_range()` using the cached-value pattern
(Option C3). JS subscribes to `visibleRangeChange` automatically when a `TimeScaleHandle` is
created and caches the last value. Python `get_visible_range()` returns the cached value.

```text
ts = handle.time_scale()
# Range is auto-cached as the user pans/zooms
r = ts.get_visible_range()  # returns last-known range (may be None before first pan)
if r:
    print(f"Visible: {r.from_time} to {r.to_time}")
```

**3C: Pane management**

`addPane()`, `removePane()`, `swapPanes()` — useful for dynamic dashboard layouts. Medium
complexity because pane indices shift when panes are added/removed, requiring the Python side
to track current pane layout.

**3D: True blocking request-response (C1/C2)**

Implement `priceToCoordinate()`, `coordinateToPrice()`, `scrollPosition()`, `paneSize()` as true
round-trip queries. This requires careful threading design (see Option C deadlock discussion above).
Only recommended if there is a clear user demand for these coordinate conversion methods from
Python.

**Estimated effort for Phase 3:** 5–10 days depending on scope.

---

## 8. Protocol Versioning & Backward Compatibility

The existing `RETRIEVE` / `NEW_FIGURE` exchange must remain intact. All new message types
(`COMMAND`, `EVENT`, `SUBSCRIBE_EVENT`, `UNSUBSCRIBE_EVENT`, `QUERY`, `QUERY_RESPONSE`) are
additions, not replacements.

The JS side should be tolerant of unknown `type` values (already the case — `process_message`
returns `b""` for unknown types). Adding a `version` field to the initial `NEW_FIGURE` message
would allow the JS side to know which message types the Python server supports.

```json
{
  "type": "NEW_FIGURE",
  "version": 2,
  "figure": { ... },
  "capabilities": ["COMMAND", "EVENT"]
}
```

The JS side only enables its command/event infrastructure if it sees the appropriate
`capabilities` in `NEW_FIGURE`. This makes the feature backward-compatible with older server
versions that send `version: 1` (or no version) and do not understand the new message types.

---

## 9. Key Implementation Risks

| Risk | Likelihood | Impact | Mitigation |
|---|:---:|:---:|---|
| Deadlock in blocking query (C1/C2) | High | Critical | Only implement C3 (caching) for Phase 1–2; defer C1/C2 to Phase 3 with clear warnings |
| `crosshairMove` flooding the WebSocket | High | High | Throttle to 50ms on JS side before any Phase 2 release |
| Commands arriving before JS chart is initialized | Medium | Medium | Queue commands on Python side (in `ChartHandle`); flush after `RETRIEVE` processed |
| `ISeriesApi` handle lifetime mismatch | Medium | High | Never expose `ISeriesApi` directly to Python; use opaque string IDs throughout |
| Price line ID collision for dynamic lines | Low | Medium | Use `uuid4()` for all dynamically generated price line IDs |
| Thread safety in Python callback dispatch | Medium | Medium | Document handler must be non-blocking; consider `ThreadPoolExecutor` for handlers |
| JS `sendMessage` called before widget channel is open | Low | Low | Buffer in JS until model is initialized; model's `init()` promise resolves first |

---

## 10. Deferred / Out-of-Scope Items

The following runtime methods from the coverage report are architecturally infeasible or
out-of-scope for all three phases:

| Method | Reason |
|---|---|
| `takeScreenshot()` | Returns an `HTMLCanvasElement` — DOM object, not serializable. Would require canvas-to-PNG conversion in JS and binary transport |
| `chartElement()` | Returns a DOM `HTMLDivElement` — meaningless in Python |
| `remove()` | Chart lifecycle is controlled by Deephaven's widget system, not by Python |
| `autoSizeActive()` | Read-only query; low value from Python |
| `paneSize()` | Pixel dimensions; low value from Python |
| `horzBehaviour()` | Returns `IHorzScaleBehavior` — JS-only concept |
| `addCustomSeries()` | Requires a JS custom renderer — cannot be expressed in Python |
| `attachPrimitive()` / `detachPrimitive()` | JS-only drawing primitives |
| `autoscaleInfoProvider` | JS callback function — cannot cross the Python boundary |
| `priceFormatter` (custom) | Same — requires a JS function |
| `tickMarkFormatter` | Same |
| `colorParsers` | Same |
| `subscribeDataChanged` (ISeriesApi) | Data already flows through DH table subscriptions |
| `dataByIndex()` / `barsInLogicalRange()` | Query into live chart state; low value vs. complexity |

---

## 11. Testing Strategy

Each phase should add tests at three levels:

**Unit (Python):**
- `ChartHandle`, `TimeScaleHandle`, etc.: verify `send_command()` is called with correct JSON
- `TvlChartListener`: verify `COMMAND` messages are forwarded and `EVENT` messages dispatch callbacks
- `MouseEventParams.from_dict()`: round-trip serialization tests

**Unit (JS):**
- `TvlCommandDispatcher`: mock `IChartApi` + verify the right methods are called for each
  `COMMAND` message
- `TvlEventEmitter`: verify throttling, verify serialization maps `ISeriesApi` to `seriesId`

**Integration:**
- Start the DH server (via `start-server.sh`), execute Python code that issues commands,
  screenshot the chart and verify visual changes
- Specifically test: `fit_content()` after data load, `apply_options()` color change,
  `set_visible_range()` zoom, `on_click()` callback fires after simulated browser click
