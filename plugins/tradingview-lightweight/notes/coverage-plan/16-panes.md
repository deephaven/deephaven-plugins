# Implementation Plan: Panes Coverage

**Target files:**
- `src/deephaven/plot/tradingview_lightweight/chart.py`
- `src/deephaven/plot/tradingview_lightweight/series.py`
- `src/js/src/TradingViewTypes.ts`
- `src/js/src/TradingViewChartRenderer.ts`

**Test file:** `test/deephaven/plot/tradingview_lightweight/test_chart.py`

**Coverage report section:** §24 Panes

**Status before this plan:**
- `pane=N` on series functions: ✅ (serializes as `paneIndex` in series config)
- `pane_stretch_factors=[...]` on `chart()`: ✅ (serializes as top-level `paneStretchFactors`)
- `LayoutPanesOptions` (3/3): ✅ (`pane_separator_color`, `pane_separator_hover_color`, `pane_enable_resize`)
- `IPaneApi` methods: 1/15 effective (only `setStretchFactor` expressed indirectly via `pane_stretch_factors`)
- `IChartApi` pane management (`addPane`, `removePane`, `swapPanes`): all N/A (runtime-only)
- `addCustomSeries` via pane: ❌ (deferred to custom series plan)
- `attachPrimitive` / `detachPrimitive`: ❌ (not feasible in static model)

---

## 1. Current State

### 1.1 What Is Already Implemented

**Pane assignment per series** (`series.py`, `SeriesSpec.to_dict`):

Every series function (`candlestick_series`, `line_series`, `bar_series`, `area_series`, `baseline_series`, `histogram_series`) accepts `pane: Optional[int] = None`. When set, `SeriesSpec.to_dict()` emits `"paneIndex": N` in the series JSON. The JS renderer passes this as the third argument to `chart.addSeries(definition, options, paneIndex)`, which creates panes implicitly.

**Stretch factors** (`chart.py`, `TvlChart`):

`chart()` accepts `pane_stretch_factors: Optional[list[float]]`. `TvlChart.to_dict()` emits it as top-level `"paneStretchFactors"` (alongside, not inside, `chartOptions`). The JS renderer's `applyPaneStretchFactors()` in `TradingViewChartRenderer.ts` iterates `chart.panes()` and calls `panes[i].setStretchFactor(factors[i])` for each index.

**LayoutPanesOptions** (`chart.py`, layout block):

Three parameters already exist in `chart()`:
- `pane_separator_color` → `layout.panes.separatorColor`
- `pane_separator_hover_color` → `layout.panes.separatorHoverColor`
- `pane_enable_resize` → `layout.panes.enableResize`

**Existing test coverage** (`test_chart.py`):
- `TestPaneSeparatorOptions` (4 tests): covers all three layout pane options plus their interaction with background
- `TestPaneStretchFactors` (5 tests): covers serialization, top-level placement, property access, and `None` defaults

### 1.2 What Is Missing

From the 15 `IPaneApi` methods:
- **`preserveEmptyPane` / `setPreserveEmptyPane()`** — static-config-possible (see §4)
- **`priceScale(priceScaleId)`** — covered indirectly via per-series `price_scale_id`; no new Python surface needed
- **`getStretchFactor()`** — read-only runtime query; N/A
- **`getHeight()` / `setHeight()`** — runtime only (see §3)
- **`moveTo()`** — runtime only
- **`paneIndex()`** — runtime only
- **`getSeries()`** — runtime only
- **`getHTMLElement()`** — browser DOM; N/A
- **`addSeries()`** — series added at build time (already covered by `pane=N`)
- **`addCustomSeries()`** — deferred to custom series plan (see §7)
- **`attachPrimitive()` / `detachPrimitive()`** — not feasible (see §6)

The `PaneSize` type (`{ height, width }`) surfaces only through `getHeight()` — which is runtime-only — so it has no static-config relevance.

From `IChartApi` pane management:
- `addPane()`, `removePane()`, `swapPanes()` — all runtime-only (see §3)
- `panes()` — read-only runtime query; N/A

---

## 2. IPaneApi Method-by-Method Classification

| # | Method | Signature | Classification | Rationale |
|---|--------|-----------|----------------|-----------|
| 1 | `getHeight()` | `() → number` | **N/A (runtime)** | Returns live pixel height from the DOM |
| 2 | `setHeight()` | `(height: number) → void` | **N/A (runtime)** | Conflicts with stretch-factor layout; pixel heights are viewport-dependent |
| 3 | `moveTo()` | `(paneIndex: number) → void` | **N/A (runtime)** | Reorders panes after creation |
| 4 | `paneIndex()` | `() → number` | **N/A (runtime)** | Read-only query of current index |
| 5 | `getSeries()` | `() → ISeriesApi[]` | **N/A (runtime)** | Returns live JS references |
| 6 | `getHTMLElement()` | `() → HTMLElement` | **N/A (browser)** | DOM access; no Python equivalent |
| 7 | `priceScale()` | `(id: string) → IPriceScaleApi` | **N/A (runtime)** | Returns live price scale handle; Python configures via per-series options |
| 8 | `getStretchFactor()` | `() → number` | **N/A (runtime)** | Read-only query of factor set by `pane_stretch_factors` |
| 9 | `setStretchFactor()` | `(factor: number) → void` | **Already covered (⚠️)** | Expressed as `pane_stretch_factors=[...]` list on `chart()` |
| 10 | `setPreserveEmptyPane()` | `(preserve: boolean) → void` | **STATIC — implement** | Boolean per pane; expressible as a list; useful for multi-pane layouts |
| 11 | `preserveEmptyPane()` | `() → boolean` | **N/A (runtime)** | Read-only query of current setting |
| 12 | `addSeries()` | `(def, opts?) → ISeriesApi` | **Already covered (✅)** | `pane=N` on each series function routes series to the correct pane |
| 13 | `addCustomSeries()` | `(view, opts?) → ISeriesApi` | **Deferred** | Requires custom series infrastructure; see §7 |
| 14 | `attachPrimitive()` | `(prim) → void` | **Not feasible** | Requires JS callable `IPanePrimitive`; see §6 |
| 15 | `detachPrimitive()` | `(prim) → void` | **Not feasible** | Same as above |

### Summary

Only **one new static-config capability** is worth adding from the IPaneApi surface: `setPreserveEmptyPane()`, expressed as `pane_preserve_empty: Optional[list[bool]]` on `chart()`. All other missing methods are either runtime-only, already covered, or not feasible.

---

## 3. Runtime-Only Methods — Why N/A

The Python plugin is a **static configuration builder**. At chart-creation time it serializes options to JSON. The JS frontend uses that JSON to initialize a TradingView Lightweight Charts instance. There is no persistent Python handle on the live chart object after it starts rendering.

This means:

- `getHeight()` / `setHeight()`: The pane height in pixels is determined by the browser layout at runtime and changes as the user resizes the DH panel. There is no mechanism to read or write pixel heights from Python at chart-creation time. `setHeight()` in particular conflicts with the stretch-factor model — the TradingView library uses stretch factors as the canonical sizing mechanism for multi-pane layouts, and pixel heights are computed from them.

- `moveTo()` / `swapPanes()` / `removePane()`: These are post-creation mutation operations. The static model establishes pane order implicitly through the `pane=N` index assigned to each series. Reordering after the fact requires a live JS reference to `IPaneApi`, which does not exist in Python.

- `addPane()`: In the JS API, `addPane()` returns a live `IPaneApi` to which you can subsequently call `addSeries()`. In the Python model, panes are created implicitly when `addSeries(def, opts, paneIndex)` is called with a `paneIndex` argument. The Python `pane=N` parameter is a direct expression of this implicit creation path. There is no user benefit to wrapping `addPane()` separately.

- `panes()` / `getSeries()` / `paneIndex()` / `getStretchFactor()` / `preserveEmptyPane()` / `priceScale()`: All are read-only queries of the live chart state. Equivalent information lives in the Python-side `SeriesSpec` objects at build time, but there is no round-trip channel to return live JS values to Python.

- `getHTMLElement()`: Browser DOM. Cannot be accessed from server-side Python.

---

## 4. New Static Configuration: `pane_preserve_empty`

### 4.1 What It Does

`IPaneApi.setPreserveEmptyPane(preserve: boolean)` controls whether an empty pane (one with no series) is kept alive or automatically removed. The JS default is `false` — empty panes are removed.

This is relevant in practice when a user creates a multi-pane chart and one pane's series is conditionally absent. Without `preserveEmptyPane=true`, the JS library collapses that pane, shifting the other panes and potentially confusing the layout.

### 4.2 Python API Design

Add a single new parameter to `chart()`:

```text
pane_preserve_empty: Optional[list[bool]] = (None,)
```

**Design rationale:**
- Parallel structure with `pane_stretch_factors: Optional[list[float]]` — a list indexed by pane number.
- Index 0 = first pane, index 1 = second pane, etc. Trailing entries beyond the actual pane count are silently ignored (matching the behavior of `applyPaneStretchFactors` in the JS renderer).
- `None` means "use the library default" (`false` for all panes).
- An empty list `[]` is treated as `None` — no entries to apply.
- Mixed `True`/`False` entries are valid: e.g., `pane_preserve_empty=[True, False]` keeps the first pane alive when empty but lets the second collapse.

**Validation:** No strict length validation against the number of unique `pane` indices in the series list. Users may specify more entries than panes (extra entries are silently dropped in JS) or fewer (unspecified panes use the default). This matches how `pane_stretch_factors` is validated (it is not validated against pane count).

### 4.3 Serialization

Add to `TvlChart.__init__` and `TvlChart.to_dict`:

**`chart.py`, `TvlChart.__init__`** — add `pane_preserve_empty` parameter:

```text
def __init__(
    self,
    series_list: list[SeriesSpec],
    chart_options: dict,
    pane_stretch_factors: Optional[list[float]] = None,
    pane_preserve_empty: Optional[list[bool]] = None,  # NEW
    chart_type: str = "standard",
):
    self._series_list = series_list
    self._chart_options = chart_options
    self._pane_stretch_factors = pane_stretch_factors
    self._pane_preserve_empty = pane_preserve_empty  # NEW
    self._chart_type = chart_type
    ...
```

**`chart.py`, `TvlChart.pane_preserve_empty` property** (add after `pane_stretch_factors` property):

```text
@property
def pane_preserve_empty(self) -> Optional[list[bool]]:
    return self._pane_preserve_empty
```

**`chart.py`, `TvlChart.to_dict`** — add emission after `paneStretchFactors`:

```text
if self._pane_stretch_factors is not None:
    result["paneStretchFactors"] = self._pane_stretch_factors
if self._pane_preserve_empty is not None:  # NEW
    result["panePreserveEmpty"] = self._pane_preserve_empty
```

**`chart.py`, `chart()` function signature** — add in the `# Panes` section (after `pane_stretch_factors`):

```text
# Panes
pane_separator_color: Optional[str] = (None,)
pane_separator_hover_color: Optional[str] = (None,)
pane_enable_resize: Optional[bool] = (None,)
pane_stretch_factors: Optional[list[float]] = (None,)
pane_preserve_empty: Optional[list[bool]] = (None,)  # NEW
```

**`chart.py`, `chart()` function body** — update the `TvlChart(...)` call:

```text
return TvlChart(
    series_list=list(series),
    chart_options=chart_options,
    pane_stretch_factors=pane_stretch_factors,
    pane_preserve_empty=pane_preserve_empty,  # NEW
    chart_type=resolved_type,
)
```

### 4.4 JS Type Changes

**`src/js/src/TradingViewTypes.ts`** — add `panePreserveEmpty` to `TvlFigureData`:

```typescript
export interface TvlFigureData {
  chartType?: TvlChartType;
  chartOptions: Record<string, unknown>;
  series: TvlSeriesConfig[];
  partitionSpec?: TvlPartitionSpec;
  paneStretchFactors?: number[];
  panePreserveEmpty?: boolean[];   // NEW
  deephaven: {
    mappings: TvlDataMapping[];
  };
}
```

### 4.5 JS Renderer Changes

**`src/js/src/TradingViewChartRenderer.ts`** — add `applyPanePreserveEmpty` method adjacent to `applyPaneStretchFactors`:

```typescript
/**
 * Apply preserve-empty settings to panes.
 * Must be called after configureSeries() since panes are created
 * implicitly by addSeries(def, opts, paneIndex).
 */
applyPanePreserveEmpty(preserve: boolean[]): void {
  const panes = this.chart.panes();
  for (let i = 0; i < preserve.length && i < panes.length; i += 1) {
    panes[i].setPreserveEmptyPane(preserve[i]);
  }
}
```

**`src/js/src/TradingViewChart.tsx`** — call `applyPanePreserveEmpty` in both `handleFigureUpdate` and `replayAllData`, immediately after the `paneStretchFactors` block (the same two locations where `applyPaneStretchFactors` is already called):

```typescript
if (figure.paneStretchFactors) {
  renderer.applyPaneStretchFactors(figure.paneStretchFactors);
}
if (figure.panePreserveEmpty) {          // NEW
  renderer.applyPanePreserveEmpty(figure.panePreserveEmpty);
}
```

---

## 5. `PaneSize` Type

`PaneSize` has two properties: `height: number` and `width: number`. Both are outputs of `getHeight()` / `getWidth()` — runtime read queries on a live `IPaneApi` object.

**Decision: Do not implement.** There is no static-config use for `PaneSize`. It exists solely as the return type of runtime query methods (`getHeight()`, implicitly `getWidth()`). Since all those query methods are N/A, `PaneSize` has no role in the Python plugin.

No Python type alias, no JS type reference, no documentation note needed beyond this plan.

---

## 6. Primitives (`attachPrimitive` / `detachPrimitive`) — Architectural Assessment

### 6.1 What JS Primitives Are

`IPanePrimitive` is a JS interface with methods that the TradingView library calls at render time:
- `attached(params)` — called when primitive is attached to a pane
- `detached()` — called on removal
- `paneViews()` — returns `IPanePrimitiveView[]`; each view's `draw()` method receives a canvas rendering context

Pane primitives are **callable JS objects**. They draw arbitrary canvas content into the pane (shapes, annotations, backgrounds, overlays). They are entirely imperative, browser-side, and require live references to `CanvasRenderingContext2D` at draw time.

### 6.2 Why Not Feasible

The Python plugin is a static configuration builder that serializes options to JSON. There is no mechanism to:

1. Express a JS callable object (with `paneViews()`, `draw()` methods, etc.) as JSON
2. Serialize Python functions as executable JavaScript
3. Round-trip a live canvas rendering context from the browser to the Python server

Even if a "declarative primitive" concept were invented (e.g., specifying a rectangle annotation as JSON), that would be a custom feature extending the TradingView API, not a coverage of `attachPrimitive`. The JS library's `IPanePrimitive` interface is imperatively oriented.

### 6.3 Decision

Mark `attachPrimitive` and `detachPrimitive` as **N/A** in the coverage report. Do not add placeholder parameters, stub implementations, or partial workarounds. Add a comment in `chart.py` near the layout/pane block:

```text
# Pane primitives (attachPrimitive / detachPrimitive) are not supported.
# They require callable JS objects with a draw() method that receives a
# canvas rendering context at browser render time. The Python plugin is a
# static configuration builder with no mechanism to express JS callables.
```

---

## 7. `addCustomSeries` via Pane

`IPaneApi.addCustomSeries(customPaneView, options?)` adds a custom series whose rendering logic is provided by a user-supplied JS object implementing `ICustomSeriesPaneView`. This requires:

1. A JS custom renderer class with `renderer()`, `priceValueBuilder()`, `defaultOptions()` etc.
2. The ability to reference that class from Python

**Decision: Defer to the custom series plan.** Custom series require their own infrastructure (a mechanism for users to register named JS renderers, a Python `custom_series()` function, and JS-side lookup by name). This is a substantial independent feature. When custom series are implemented, they will naturally support pane assignment via the same `pane=N` mechanism as all other series. There is no pane-specific work required here; the routing through `paneIndex` is already in place.

**Reference:** See the custom series coverage plan when it is created. The `addCustomSeries` row in the coverage report should remain `❌` with the note "deferred to custom series plan."

---

## 8. `IChartApi` Pane Management — Why Not Implemented

The four `IChartApi` pane management methods are all runtime-only:

| Method | Status | Reason |
|--------|--------|--------|
| `addPane(preserveEmptyPane?)` | N/A | Panes created implicitly by `pane=N`; no user-facing equivalent needed |
| `panes()` | N/A | Runtime read of live pane array |
| `removePane(index)` | N/A | Runtime mutation |
| `swapPanes(first, second)` | N/A | Runtime mutation |

The implicit pane creation model (panes are created by `chart.addSeries(def, opts, paneIndex)`) covers the entire `addPane` use case. Python users set `pane=0`, `pane=1`, etc. on their series functions; the JS renderer calls `addSeries` with those indices and panes appear automatically. Calling `addPane` explicitly before adding series is unnecessary.

`removePane` and `swapPanes` are post-creation operations that require a live chart handle. They cannot be expressed in the static model.

---

## 9. Coverage Report Update

After implementing §4 (`pane_preserve_empty`), the coverage report section §24 should be updated:

**IPaneApi (15 methods) after this plan:**

| # | Method | Status | Notes |
|---|--------|:------:|-------|
| 1 | `getHeight()` | N/A | Runtime query |
| 2 | `setHeight()` | N/A | Runtime mutation; conflicts with stretch model |
| 3 | `moveTo()` | N/A | Runtime reorder |
| 4 | `paneIndex()` | N/A | Runtime query |
| 5 | `getSeries()` | N/A | Runtime query |
| 6 | `getHTMLElement()` | N/A | Browser DOM |
| 7 | `priceScale()` | N/A | Runtime query; Python configures via per-series options |
| 8 | `getStretchFactor()` | N/A | Runtime query |
| 9 | `setStretchFactor()` | ⚠️ | Initial `pane_stretch_factors=[...]` list |
| 10 | `setPreserveEmptyPane()` | ✅ | `pane_preserve_empty=[...]` list on `chart()` |
| 11 | `preserveEmptyPane()` | N/A | Runtime query |
| 12 | `addSeries()` | ✅ | `pane=N` on each series function |
| 13 | `addCustomSeries()` | ❌ | Deferred to custom series plan |
| 14 | `attachPrimitive()` | N/A | Requires JS callable; not expressible in static config |
| 15 | `detachPrimitive()` | N/A | Requires JS callable; not expressible in static config |

**Pane Assignment (unchanged):**

| Feature | Status | Notes |
|---------|:------:|-------|
| Assign series to pane by index | ✅ | `pane=0`, `pane=1`, ... |
| `pane_stretch_factors` | ✅ | Initial factors list |
| `pane_preserve_empty` | ✅ | Per-pane boolean list (NEW) |

**IChartApi Pane Management (unchanged, all N/A):**

| Method | Status |
|--------|:------:|
| `addPane()` | N/A |
| `panes()` | N/A |
| `removePane()` | N/A |
| `swapPanes()` | N/A |

**LayoutPanesOptions (unchanged, all ✅):**

| Property | Status | Python Param |
|----------|:------:|--------------|
| `enableResize` | ✅ | `pane_enable_resize` |
| `separatorColor` | ✅ | `pane_separator_color` |
| `separatorHoverColor` | ✅ | `pane_separator_hover_color` |

---

## 10. Test Coverage

All new tests go in `test/deephaven/plot/tradingview_lightweight/test_chart.py`. Add them to a new class `TestPanePreserveEmpty`.

### 10.1 Python-Side Tests (No JS Required)

These tests run in the standard unit test environment (`$PY -m pytest test/ -v`).

```text
class TestPanePreserveEmpty(unittest.TestCase):
    """Tests for pane_preserve_empty on chart()."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_preserve_empty_serialization(self):
        """pane_preserve_empty list should appear as top-level panePreserveEmpty."""
        s1 = candlestick_series(self.table, pane=0)
        s2 = histogram_series(self.table, pane=1)
        c = chart(s1, s2, pane_preserve_empty=[True, False])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["panePreserveEmpty"], [True, False])

    def test_preserve_empty_not_set_by_default(self):
        """panePreserveEmpty must be absent from output when not specified."""
        s = line_series(self.table)
        c = chart(s)
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertNotIn("panePreserveEmpty", result)

    def test_preserve_empty_top_level(self):
        """panePreserveEmpty must be top-level, not nested inside chartOptions."""
        s = line_series(self.table)
        c = chart(s, pane_preserve_empty=[True])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertNotIn("panePreserveEmpty", result.get("chartOptions", {}))
        self.assertIn("panePreserveEmpty", result)

    def test_preserve_empty_single_pane(self):
        """Single-element list with True."""
        s = line_series(self.table, pane=0)
        c = chart(s, pane_preserve_empty=[True])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["panePreserveEmpty"], [True])

    def test_preserve_empty_all_false(self):
        """All False is a valid explicit list."""
        s1 = line_series(self.table, pane=0)
        s2 = histogram_series(self.table, pane=1)
        c = chart(s1, s2, pane_preserve_empty=[False, False])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["panePreserveEmpty"], [False, False])

    def test_preserve_empty_property_access(self):
        """pane_preserve_empty should be accessible via property."""
        s = line_series(self.table)
        c = chart(s, pane_preserve_empty=[True, False])
        self.assertEqual(c.pane_preserve_empty, [True, False])

    def test_preserve_empty_none_property(self):
        """pane_preserve_empty property returns None when not set."""
        s = line_series(self.table)
        c = chart(s)
        self.assertIsNone(c.pane_preserve_empty)

    def test_preserve_empty_with_stretch_factors(self):
        """pane_preserve_empty and pane_stretch_factors coexist as separate top-level keys."""
        s1 = candlestick_series(self.table, pane=0)
        s2 = histogram_series(self.table, pane=1)
        c = chart(
            s1, s2, pane_stretch_factors=[3.0, 1.0], pane_preserve_empty=[True, False]
        )
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        self.assertEqual(result["paneStretchFactors"], [3.0, 1.0])
        self.assertEqual(result["panePreserveEmpty"], [True, False])

    def test_preserve_empty_more_entries_than_panes(self):
        """Extra entries beyond pane count are valid (JS renderer ignores them)."""
        s = line_series(self.table, pane=0)
        c = chart(s, pane_preserve_empty=[True, True, True])
        table_id_map = {id(self.table): 0}
        result = c.to_dict(table_id_map)
        # Serialized as-is; JS renderer bounds-checks against actual pane count
        self.assertEqual(result["panePreserveEmpty"], [True, True, True])

    def test_preserve_empty_tvl_chart_direct(self):
        """TvlChart constructor should accept and store pane_preserve_empty."""
        s = line_series(self.table)
        c = TvlChart(
            series_list=[s],
            chart_options={},
            pane_preserve_empty=[False, True],
        )
        self.assertEqual(c.pane_preserve_empty, [False, True])
```

### 10.2 Tests That Verify Existing Behavior Is Unchanged

These go in the existing `TestPaneStretchFactors` class (or inline in `TestPanePreserveEmpty`):

```text
def test_existing_stretch_factors_unaffected(self):
    """Adding pane_preserve_empty must not change paneStretchFactors behavior."""
    s1 = candlestick_series(self.table, pane=0)
    s2 = histogram_series(self.table, pane=1)
    c = chart(s1, s2, pane_stretch_factors=[3.0, 1.0])
    table_id_map = {id(self.table): 0}
    result = c.to_dict(table_id_map)
    self.assertEqual(result["paneStretchFactors"], [3.0, 1.0])
    self.assertNotIn("panePreserveEmpty", result)
```

---

## 11. Code Examples

### 11.1 Basic Multi-Pane Chart (Already Works)

```text
import deephaven.plot.tradingview_lightweight as tvl

# Candlestick in pane 0, volume histogram in pane 1 with 3:1 height ratio
my_chart = tvl.chart(
    tvl.candlestick_series(prices_table, pane=0),
    tvl.histogram_series(prices_table, value="Volume", pane=1),
    pane_stretch_factors=[3.0, 1.0],
)
```

### 11.2 Preserve Empty Pane (New)

```text
# Reserve space for pane 1 even if its series is absent.
# Useful for dynamically composed charts where a series may not
# have data yet on initial load.
my_chart = tvl.chart(
    tvl.candlestick_series(prices_table, pane=0),
    tvl.histogram_series(volume_table, value="Volume", pane=1),
    pane_stretch_factors=[3.0, 1.0],
    pane_preserve_empty=[False, True],
)
```

### 11.3 Full Pane Configuration

```text
my_chart = tvl.chart(
    tvl.candlestick_series(prices_table, pane=0),
    tvl.line_series(rsi_table, value="RSI", pane=1),
    tvl.histogram_series(volume_table, value="Volume", pane=2),
    # Relative heights: main=60%, rsi=25%, volume=15%
    pane_stretch_factors=[6.0, 2.5, 1.5],
    # Keep pane 1 alive even if RSI data hasn't loaded
    pane_preserve_empty=[False, True, False],
    # Separator appearance
    pane_separator_color="#2B2B43",
    pane_separator_hover_color="rgba(178,181,189,0.2)",
    pane_enable_resize=True,
)
```

---

## 12. Serialization Contract

The Python-to-JS serialization for all pane configuration is as follows:

| Python param | JSON location | JS consumption |
|---|---|---|
| `pane=N` on series | `series[i].paneIndex` | `chart.addSeries(def, opts, paneIndex)` |
| `pane_stretch_factors=[f0, f1, ...]` | Top-level `paneStretchFactors` | `renderer.applyPaneStretchFactors()` → `panes[i].setStretchFactor()` |
| `pane_preserve_empty=[b0, b1, ...]` | Top-level `panePreserveEmpty` (NEW) | `renderer.applyPanePreserveEmpty()` → `panes[i].setPreserveEmptyPane()` |
| `pane_separator_color` | `chartOptions.layout.panes.separatorColor` | `createChart(container, options)` |
| `pane_separator_hover_color` | `chartOptions.layout.panes.separatorHoverColor` | `createChart(container, options)` |
| `pane_enable_resize` | `chartOptions.layout.panes.enableResize` | `createChart(container, options)` |

The `paneStretchFactors` and `panePreserveEmpty` arrays are emitted at the top level of the figure JSON (not inside `chartOptions`) because they are applied to live `IPaneApi` objects after chart and series creation, not passed to `createChart()` directly.

**Timing note (important for JS implementation):** Both `applyPaneStretchFactors()` and `applyPanePreserveEmpty()` must be called **after** `configureSeries()`. Panes are created implicitly when `chart.addSeries(def, opts, paneIndex)` is called, so the panes only exist in `chart.panes()` after all series have been added. Calling either method before `configureSeries()` would find an empty `panes()` array and silently do nothing. In `TradingViewChart.tsx`, both calls already follow `configureSeries()` for `paneStretchFactors`; the new `applyPanePreserveEmpty` call goes in the same position.

---

## 13. Implementation Order

The following steps are sequenced to minimize risk. Each step is independently testable.

**Step 1: Python changes** (no JS required; can run unit tests immediately)

1. **`chart.py`, `TvlChart.__init__`** — Add `pane_preserve_empty: Optional[list[bool]] = None` parameter and `self._pane_preserve_empty = pane_preserve_empty` assignment.

2. **`chart.py`, `TvlChart`** — Add `pane_preserve_empty` property after `pane_stretch_factors` property.

3. **`chart.py`, `TvlChart.to_dict`** — Add emission of `panePreserveEmpty` after `paneStretchFactors` block.

4. **`chart.py`, `chart()` function** — Add `pane_preserve_empty: Optional[list[bool]] = None` to the signature in the `# Panes` section; pass it to `TvlChart(...)`.

5. **`chart.py`** — Add the architectural comment about `attachPrimitive` / `detachPrimitive` near the pane section.

6. **`test_chart.py`** — Add `TestPanePreserveEmpty` class with all tests from §10.1 and the backwards-compatibility guard from §10.2.

7. **Run Python tests** — `$PY -m pytest test/ -v` — all should pass.

**Step 2: JS type changes**

8. **`src/js/src/TradingViewTypes.ts`** — Add `panePreserveEmpty?: boolean[]` to `TvlFigureData`.

9. **Run TypeScript type check** — `cd src/js && npx tsc --noEmit` — must pass.

**Step 3: JS renderer changes**

10. **`src/js/src/TradingViewChartRenderer.ts`** — Add `applyPanePreserveEmpty(preserve: boolean[]): void` method adjacent to `applyPaneStretchFactors`.

11. **`src/js/src/TradingViewChart.tsx`** — Add the `if (figure.panePreserveEmpty)` block in both `handleFigureUpdate` and `replayAllData`, directly after the `paneStretchFactors` block.

12. **Run TypeScript type check again** — `cd src/js && npx tsc --noEmit`.

13. **Run JS tests** — `cd src/js && npx jest --verbose` — all should pass.

**Step 4: Coverage report update**

14. **`notes/api-coverage-report.md`**, section §24 — Update the `setPreserveEmptyPane()` row to ✅ and add the new `pane_preserve_empty` feature row. Update `attachPrimitive` and `detachPrimitive` from ❌ to N/A with a rationale note.

---

## 14. Files to Modify (Summary)

| File | Change type | Details |
|---|---|---|
| `src/deephaven/plot/tradingview_lightweight/chart.py` | Add param + serialization | `pane_preserve_empty` in `TvlChart.__init__`, property, `to_dict`, `chart()` signature, architectural comment |
| `test/deephaven/plot/tradingview_lightweight/test_chart.py` | Add test class | `TestPanePreserveEmpty` with ~10 tests |
| `src/js/src/TradingViewTypes.ts` | Add field | `panePreserveEmpty?: boolean[]` in `TvlFigureData` |
| `src/js/src/TradingViewChartRenderer.ts` | Add method | `applyPanePreserveEmpty(preserve: boolean[]): void` |
| `src/js/src/TradingViewChart.tsx` | Add two call sites | `applyPanePreserveEmpty` in `handleFigureUpdate` and `replayAllData` |
| `notes/api-coverage-report.md` | Update §24 | Reflect new ✅ and N/A statuses |

No new files. No changes to `series.py`, `options.py`, or any other Python module.
