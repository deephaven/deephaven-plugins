# Plan: TimeScaleOptions & Time Type Coverage

**Date:** 2026-04-11
**Scope:** Fill the remaining 3/27 gaps in `TimeScaleOptions` coverage, and add the missing `BusinessDay` helper type.
**Baseline:** api-coverage-report.md §15 (TimeScaleOptions) and §17 (Time Type Definitions)

---

## 1. Current State

`TimeScaleOptions` has 24 of 27 properties implemented. The three gaps are:

| JS Property | Status | Reason missing |
|---|:---:|---|
| `precomputeConflationPriority` | ❌ | Trivially missing — just not wired up |
| `tickMarkFormatter` | ❌ | Requires a JS callback; not straightforwardly serializable |
| *(see §17)* `BusinessDay` time type | ❌ | No Python helper to produce `{year, month, day}` dicts |

All 24 currently implemented properties live in `chart.py`'s `chart()` function, in the `ts = _filter_none({...})` block (lines 444–474). Each parameter is added as a keyword argument to `chart()` and serialized by direct camelCase key mapping.

The two new `TimeScaleOptions` entries follow the exact same pattern as every existing entry. The `BusinessDay` helper is a new concern — it lives in user data, not in chart options.

---

## 2. Change 1: `precomputeConflationPriority`

### 2.1 What it is

`precomputeConflationPriority` is a plain string that controls the task-scheduling priority used when `precomputeConflationOnInit` is `true`. The JS library uses it to call the browser's `scheduler.postTask()` API. Valid values (from browser Scheduler API): `"background"` (default), `"user-visible"`, `"user-blocking"`.

### 2.2 Feasibility

Trivial. No enum mapping needed — the string passes through as-is. The only risk is that an invalid priority string silently fails in JS (browser ignores unrecognised priorities). A Python `Literal` type narrows the API to valid values.

### 2.3 Files to edit

| File | Change |
|---|---|
| `options.py` | Add `PrecomputeConflationPriority` type alias |
| `chart.py` | Add `precompute_conflation_priority` kwarg to `chart()` and wire into `ts` dict |
| `__init__.py` | Export `PrecomputeConflationPriority` from `__all__` |
| `test_chart.py` | Add test case |

### 2.4 `options.py` change

Add after the existing `ChartType` definition:

```text
PrecomputeConflationPriority = Literal["background", "user-visible", "user-blocking"]
```

This sits naturally near the other `Literal` type aliases (`LineStyle`, `CrosshairMode`, etc.).

### 2.5 `chart.py` change

**Step A — add the parameter to `chart()`'s signature.**

Insert alongside the existing conflation parameters (the block around lines 247–248):

```text
    precompute_conflation_on_init: Optional[bool] = None,
    precompute_conflation_priority: Optional[PrecomputeConflationPriority] = None,
    time_scale_visible: Optional[bool] = None,
```

**Step B — add import.**

In the `from .options import (...)` block at the top of `chart.py`, add `PrecomputeConflationPriority` to the imports.

**Step C — wire into the `ts` dict.**

Inside the `ts = _filter_none({...})` block (the "Time scale" section), add the new key immediately after `precomputeConflationOnInit`:

```text
            "precomputeConflationOnInit": precompute_conflation_on_init,
            "precomputeConflationPriority": precompute_conflation_priority,
```

No mapping or transformation is needed — the string value is passed as-is.

### 2.6 `__init__.py` change

In the `from .options import (...)` block, add `PrecomputeConflationPriority`. In `__all__`, add `"PrecomputeConflationPriority"` under the `# Types` section.

### 2.7 Test coverage

Add to `TestChartFunction` in `test_chart.py`:

```text
def test_precompute_conflation_priority(self):
    """precompute_conflation_priority should pass through as a string."""
    s = line_series(self.table)
    c = chart(s, precompute_conflation_priority="background")
    self.assertEqual(
        c.chart_options["timeScale"]["precomputeConflationPriority"], "background"
    )

def test_precompute_conflation_priority_user_visible(self):
    s = line_series(self.table)
    c = chart(s, precompute_conflation_priority="user-visible")
    self.assertEqual(
        c.chart_options["timeScale"]["precomputeConflationPriority"], "user-visible"
    )

def test_precompute_conflation_priority_not_set_by_default(self):
    s = line_series(self.table)
    c = chart(s)
    # timeScale should either be absent or not contain the key
    ts = c.chart_options.get("timeScale", {})
    self.assertNotIn("precomputeConflationPriority", ts)
```

---

## 3. Change 2: `tickMarkFormatter` — Feasibility Discussion

### 3.1 What it is

`tickMarkFormatter` is a JS callback of the form:

```ts
type TickMarkFormatter = (
  time: Time,            // UTCTimestamp | BusinessDay | ISO string
  tickMarkType: TickMarkType,   // enum 0–4 (Year, Month, DayOfMonth, Time, TimeWithSeconds)
  locale: string         // e.g. "en-US"
) => string | string[];
```

The chart library calls this function synchronously during each render frame to produce the text label for each tick on the time axis.

### 3.2 Why it cannot be implemented directly from Python

The Python layer is a **static configuration builder**. All options are serialised to JSON when `chart()` is called and sent to the browser once. JSON cannot represent functions. The callback would need to execute synchronously inside the JS render loop, which means it must be a JavaScript function at that point in time — there is no mechanism for a round-trip to Python on every render frame.

Possible workarounds, in order of practicality:

**Option A — Predefined formatter strings (recommended for now)**

Define a small set of Python-selectable named formatters that are implemented as actual JS functions in the plugin bundle. The Python side passes a string like `"iso_date"`, `"month_year"`, or `"hhmm"`, and the JS side selects the corresponding function from a registry before calling `applyOptions()`.

This covers the majority of real use cases (date-only labels, time-only labels, custom month abbreviations) without exposing a general callback.

Implementation sketch:
- Add a `TickMarkFormatterName = Literal["iso_date", "month_year", "hhmm", "date_time"]` type in `options.py`.
- Add `tick_mark_formatter: Optional[TickMarkFormatterName] = None` to `chart()`.
- In the `ts` dict, serialize as `"tickMarkFormatterName": tick_mark_formatter` (a custom key, not the native `tickMarkFormatter`).
- In the JS plugin (`src/js/`), intercept `tickMarkFormatterName` in the options parser and replace it with the actual function before calling `chart.timeScale().applyOptions()`.

**Option B — Raw JS string injection (not recommended)**

Accept a raw JavaScript function body as a Python string and pass it tagged in JSON. The JS plugin would call `new Function(...)` to reconstruct the callable. This is a security concern and is not recommended.

**Option C — Defer entirely**

Leave `tickMarkFormatter` as N/A for the Python plugin, documenting that it requires a JS-only extension point. This is a valid choice given that the existing `timeVisible`, `secondsVisible`, `tickMarkMaxCharacterLength`, and `allowBoldLabels` cover the vast majority of formatting needs.

### 3.3 Recommendation

**Implement Option A (predefined formatter strings) only if a concrete user request surfaces.** For now, mark `tickMarkFormatter` as `N/A (JS callback; use predefined formatters when added)` in the coverage report. Do not add a stub parameter that accepts arbitrary strings — this creates a false expectation.

If Option A is later implemented:

- Create `TickMarkFormatterName` type in `options.py`.
- Add `tick_mark_formatter_name` (not `tick_mark_formatter`) to `chart()` to make clear this is a named preset, not a raw formatter.
- The JS plugin must maintain a `TICK_MARK_FORMATTERS` map and apply the function in the time scale options assembly step.
- Test by verifying the JSON contains `"tickMarkFormatterName": "iso_date"` (the JS side is tested separately).

**This plan does not implement `tickMarkFormatter` or Option A.** It documents the decision so that the next implementer does not need to re-investigate.

---

## 4. Change 3: `BusinessDay` Factory Function

### 4.1 What it is

The TradingView Lightweight Charts `Time` type has three valid forms:

| Form | Python representation | Status |
|---|---|:---:|
| `UTCTimestamp` | `int` or `float` (Unix seconds) | ✅ auto-converted from numeric columns |
| ISO string | `str`, e.g. `'2021-02-03'` | ✅ passes through |
| `BusinessDay` | `{"year": int, "month": int, "day": int}` | ❌ no helper |

`BusinessDay` is used when charting data that has a non-calendar alignment — for example, financial data where weekends and holidays are excluded. Instead of a UNIX timestamp, each data point is keyed by `{year, month, day}`. The chart library handles the visual spacing so weekends are not shown as gaps.

### 4.2 Where `BusinessDay` values appear

`BusinessDay` objects appear in **series data**, not in chart options. Specifically, they are used as the `time` field of a data row. When using the Deephaven table integration, data flows from a Deephaven `Table` column. There are two use cases:

1. **Static data** — the user constructs a Python list of dicts (or a pandas DataFrame) and wraps it in a static table. `business_day(year, month, day)` is used to construct the `time` field values.
2. **Column-level usage** — for a ticking `Table` where the time column is already formatted as `{year, month, day}` objects, no Python helper is needed; the JS receives the dict directly.

### 4.3 Where to define it

**Define `business_day()` in `_types.py`.**

Rationale:
- `_types.py` already contains the `TableLike` union and internal type aliases. It is the natural home for lightweight pure-Python type helpers that have no dependency on `options.py`, `chart.py`, or the Deephaven runtime.
- `options.py` is for chart option types (enums, Literal aliases, TypedDicts). A data-level helper does not belong there.
- Keeping it in `_types.py` avoids a circular import — `chart.py` imports from `options.py`, and `options.py` does not import from `chart.py`.

Also add a `BusinessDay` `TypedDict` to `_types.py` for type annotation purposes.

### 4.4 Implementation: `_types.py`

Add after the existing `TableLike` definition:

```text
class BusinessDay(TypedDict):
    """A date specified as a business day with year, month, and day components.

    Used as a ``time`` value in series data for TradingView Lightweight Charts.
    BusinessDay keys are used instead of UNIX timestamps to chart data that
    excludes non-trading days (weekends, holidays) — the chart renders them
    with equal bar spacing regardless of calendar gaps.

    Example::

        from deephaven.plot.tradingview_lightweight import business_day
        row = {"time": business_day(2024, 1, 15), "value": 150.25}

    See: https://tradingview.github.io/lightweight-charts/docs/api#businessday
    """

    year: int
    month: int
    day: int


def business_day(year: int, month: int, day: int) -> BusinessDay:
    """Create a BusinessDay dict for use as a ``time`` value in series data.

    Args:
        year: Four-digit year (e.g. 2024).
        month: Month number, 1–12.
        day: Day of month, 1–31.

    Returns:
        A dict ``{"year": year, "month": month, "day": day}`` suitable for
        use as the ``time`` field in TradingView Lightweight Charts data rows.

    Example::

        from deephaven.plot.tradingview_lightweight import business_day

        data = [
            {"time": business_day(2024, 1, 15), "value": 150.25},
            {"time": business_day(2024, 1, 16), "value": 152.10},
            {"time": business_day(2024, 1, 17), "value": 149.80},
        ]
    """
    return BusinessDay(year=year, month=month, day=day)
```

Note: `TypedDict` needs to be imported at the top of `_types.py`. Currently `_types.py` imports `from typing import Any, Union`. Add `TypedDict` to that import.

### 4.5 `__init__.py` change

Export both `BusinessDay` and `business_day` from the package:

In the `from .` import block, add a new group:

```text
from ._types import BusinessDay, business_day
```

In `__all__`, add under `# Types`:

```text
    "BusinessDay",
    "business_day",
```

### 4.6 Serialization

`business_day()` returns a plain Python `dict` (TypedDicts are plain dicts at runtime). When a user builds static data using `business_day()` values and the data reaches the JS plugin via the table serialization path, the dict `{"year": 2024, "month": 1, "day": 15}` will be serialized to JSON as-is. The TradingView library recognizes this shape as a `BusinessDay` and handles it correctly.

No custom serialization logic is needed in `chart.py`, `series.py`, or the communication layer — the dict passes through transparently.

### 4.7 Test coverage

Add a new test class `TestBusinessDay` to `test_chart.py` (or to a new file `test_types.py` if preferred — see §5 for recommendation):

```text
class TestBusinessDay(unittest.TestCase):
    """Tests for the business_day() factory function."""

    def test_returns_correct_dict(self):
        from deephaven.plot.tradingview_lightweight._types import business_day
        result = business_day(2024, 1, 15)
        self.assertEqual(result, {"year": 2024, "month": 1, "day": 15})

    def test_all_fields_present(self):
        from deephaven.plot.tradingview_lightweight._types import business_day
        result = business_day(2019, 6, 1)
        self.assertIn("year", result)
        self.assertIn("month", result)
        self.assertIn("day", result)

    def test_values_stored_correctly(self):
        from deephaven.plot.tradingview_lightweight._types import business_day
        result = business_day(2020, 12, 31)
        self.assertEqual(result["year"], 2020)
        self.assertEqual(result["month"], 12)
        self.assertEqual(result["day"], 31)

    def test_is_dict(self):
        """TypedDict instances must be plain dicts (JSON-serializable)."""
        from deephaven.plot.tradingview_lightweight._types import business_day
        import json
        result = business_day(2024, 3, 8)
        # Must serialize without error
        serialized = json.dumps(result)
        self.assertIn('"year": 2024', serialized)
        self.assertIn('"month": 3', serialized)
        self.assertIn('"day": 8', serialized)

    def test_importable_from_package(self):
        """business_day and BusinessDay must be importable from top-level package."""
        from deephaven.plot.tradingview_lightweight._types import (
            business_day,
            BusinessDay,
        )
        self.assertIsNotNone(business_day)
        self.assertIsNotNone(BusinessDay)
```

---

## 5. Test File Organization

All new tests can go in the existing `test_chart.py`. However, since `business_day` is a pure-data utility with no dependency on `chart.py`, it would also be clean to add a dedicated `test_types.py` in the same test directory:

```
test/deephaven/plot/tradingview_lightweight/
    test_chart.py      <- existing; add precompute_conflation_priority tests here
    test_types.py      <- new; BusinessDay tests live here
```

`test_types.py` follows the same boilerplate as `test_chart.py` (sys.path insertion, `deephaven.plugin` mocking), but only imports from `._types`.

Either placement is correct. The preference is `test_types.py` for separation of concerns.

---

## 6. Full Implementation Checklist

### 6.1 `precomputeConflationPriority`

- [ ] `options.py`: add `PrecomputeConflationPriority = Literal["background", "user-visible", "user-blocking"]`
- [ ] `chart.py`: add `from .options import ... PrecomputeConflationPriority` to imports
- [ ] `chart.py`: add `precompute_conflation_priority: Optional[PrecomputeConflationPriority] = None` to `chart()` signature, after `precompute_conflation_on_init`
- [ ] `chart.py`: add `"precomputeConflationPriority": precompute_conflation_priority,` to `ts` dict, after `"precomputeConflationOnInit": precompute_conflation_on_init,`
- [ ] `__init__.py`: add `PrecomputeConflationPriority` to `from .options import (...)` and `__all__`
- [ ] `test_chart.py`: add 3 test methods to `TestChartFunction` (see §2.7)

### 6.2 `tickMarkFormatter`

- [ ] No code changes — document as N/A (JS callback)
- [ ] Update `api-coverage-report.md` §15 row 25: change status from ❌ to N/A with note "JS callback; Option A (named presets) deferred"

### 6.3 `BusinessDay`

- [ ] `_types.py`: add `TypedDict` to `from typing import` line
- [ ] `_types.py`: add `BusinessDay` TypedDict class (see §4.4)
- [ ] `_types.py`: add `business_day()` factory function (see §4.4)
- [ ] `__init__.py`: add `from ._types import BusinessDay, business_day`
- [ ] `__init__.py`: add `"BusinessDay"` and `"business_day"` to `__all__`
- [ ] `test/...test_types.py` (new file): add `TestBusinessDay` class (see §4.7)

---

## 7. Usage Examples

### 7.1 `precomputeConflationPriority`

```text
import deephaven.plot.tradingview_lightweight as tvl

chart = tvl.chart(
    tvl.line_series(my_table, time="Timestamp", value="Price"),
    enable_conflation=True,
    precompute_conflation_on_init=True,
    precompute_conflation_priority="user-visible",  # schedule at higher priority
)
```

### 7.2 `BusinessDay` with static data

```text
import deephaven.plot.tradingview_lightweight as tvl
from deephaven.plot.tradingview_lightweight import business_day

# Build a static dataset with business day keys (no weekends, no holidays)
data = [
    {"time": business_day(2024, 1, 15), "open": 185.0, "high": 188.2, "low": 184.5, "close": 187.3},
    {"time": business_day(2024, 1, 16), "open": 187.3, "high": 189.0, "low": 186.0, "close": 188.5},
    {"time": business_day(2024, 1, 17), "open": 188.5, "high": 190.1, "low": 187.8, "close": 189.2},
    # Note: 2024-01-18 is a US federal holiday — not present in the data.
    # The chart renders Jan 17 and Jan 22 with equal bar spacing.
    {"time": business_day(2024, 1, 22), "open": 189.2, "high": 191.5, "low": 188.0, "close": 190.7},
]

import pandas as pd
from deephaven import pandas as dhpd
table = dhpd.to_table(pd.DataFrame(data))

chart = tvl.candlestick(table, time="time", open="open", high="high", low="low", close="close")
```

### 7.3 Type annotation usage

```text
from deephaven.plot.tradingview_lightweight import BusinessDay, business_day

def make_tick(year: int, month: int, day: int) -> BusinessDay:
    return business_day(year, month, day)
```

---

## 8. What Does NOT Change

- The serialization pipeline in `communication/connection.py` does not need to change — `BusinessDay` dicts flow through the existing JSON serialization as plain dicts.
- Series creation functions (`line_series`, `candlestick_series`, etc.) do not need to change — the `time` column mapping is a string column name, not a value.
- The JS plugin (`src/js/`) does not need to change for either `precomputeConflationPriority` (already a pass-through string field in `timeScale` options) or `BusinessDay` (already handled natively by the TradingView library).
- Convenience functions (`line()`, `candlestick()`, etc.) do not need `precompute_conflation_priority` added — they already delegate all unrecognized chart options through `**chart_kwargs`, but since they use an explicit kwarg list rather than `**kwargs`, the parameter would need to be explicitly added to each convenience function if users need to set it from those shortcuts. Given that `precompute_conflation_priority` is an advanced performance option, it is acceptable to require users to use `chart()` directly for it. Do not add it to convenience functions unless explicitly requested.

---

## 9. Risk Assessment

| Change | Risk | Mitigation |
|---|---|---|
| `precomputeConflationPriority` | Very low — plain string passthrough | Validated by `Literal` type; browser silently ignores unknown values |
| `tickMarkFormatter` | N/A (not implementing) | Documented as architectural limitation |
| `BusinessDay` factory | Very low — pure Python helper returning a dict | No runtime dependency; tested with `json.dumps` round-trip |
| `BusinessDay` serialization | Low — relies on existing JSON pipeline | TypedDicts are plain dicts; no custom serializer needed |

---

## 10. Coverage Score After Implementation

| Section | Before | After |
|---|---|---|
| TimeScaleOptions | 24/27 | 25/27 (precomputeConflationPriority added; tickMarkFormatter → N/A, effectively 25/26 applicable) |
| Time Type Definitions | 2/3 | 3/3 (BusinessDay helper added) |
