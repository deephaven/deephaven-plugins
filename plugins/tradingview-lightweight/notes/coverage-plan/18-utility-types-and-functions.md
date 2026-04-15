# Implementation Plan: Utility Types and Top-Level Functions Coverage (§26–27)

**Coverage report sections:** §26 Utility Types, §27 Top-Level Functions & Variables
**Primary files affected:**
- `src/deephaven/plot/tradingview_lightweight/options.py`
- `src/deephaven/plot/tradingview_lightweight/chart.py`
- `src/deephaven/plot/tradingview_lightweight/__init__.py`
- `test/deephaven/plot/tradingview_lightweight/test_chart.py`

**Status before this plan:**

| Item | Current Status |
|---|:---:|
| `LineWidth` | ⚠️ unconstrained `int` |
| `PriceFormatCustom` | ❌ not implemented |
| `VerticalGradientColor` | ❌ not supported (handled in plan 03) |
| `HorzAlign` | ⚠️ raw string, no validation |
| `VertAlign` | ⚠️ raw string, no validation |
| `SolidColor` | ⚠️ hardcoded inline |
| `Coordinate` / `Logical` | N/A |
| `DeepPartial<T>` | N/A |
| `isBusinessDay()` | ❌ |
| `isUTCTimestamp()` | ❌ |
| `version()` | ❌ |
| `createUpDownMarkers()` | ❌ |
| `customSeriesDefaultOptions` | ❌ |

---

## 1. Architectural Context

The Python plugin is a **static configuration builder**: it serializes chart options to JSON at chart-creation time and streams table data to the JS frontend. There is no live Python handle on the running JS chart. This constraint drives every feasibility decision in this plan.

The existing pattern is:
- Python-friendly `Literal` type aliases live in `options.py`
- The `chart()` function in `chart.py` consumes them, validates, maps to JS-expected values, and builds a dict
- `__init__.py` re-exports everything users need from the public surface
- Tests in `test_chart.py` assert on the serialized dict

---

## 2. Utility Types

### 2.1 `LineWidth` — Constrain to `Literal[1, 2, 3, 4]`

#### Current State

`LineWidth` is referenced implicitly throughout the codebase wherever a line width is accepted (e.g., `crosshair_vert_line_width: Optional[int]`, `PriceLine.line_width: Optional[int]`). There is no `LineWidth` type alias; callers pass any `int` and the library silently clamps or ignores out-of-range values.

#### Decision: Add `Literal[1, 2, 3, 4]` type alias; do NOT change existing parameter types

**Tradeoffs:**

| Approach | Pros | Cons |
|---|---|---|
| `Literal[1, 2, 3, 4]` alias (recommended) | Matches JS API exactly; enables mypy/pyright checking at call sites; documents valid range | Runtime enforcement requires explicit `if` guards; `Literal` ints work poorly with `isinstance` |
| Keep `int` unchanged | Zero migration cost; avoids false-security of static-only enforcement | Valid range is undiscoverable from signature; no type-checker benefit |
| `int` with runtime guard | Catches bad values eagerly | More verbose; breaks existing code that passes `int` values; inconsistent with how `LineStyle` is handled (no runtime guards) |

**Chosen approach:** Add `LineWidth = Literal[1, 2, 3, 4]` to `options.py` and use it as the annotation for **all** line-width parameters. Do not add runtime validation guards; keep behavior consistent with `LineStyle` and `CrosshairMode` (annotation-only enforcement). The type alias is the primary deliverable — it documents the constraint and enables static analysis without behavioral change.

#### Code Change — `options.py`

After the existing `LineType` definition (line 15), insert:

```text
LineWidth = Literal[1, 2, 3, 4]
```

#### Code Change — `chart.py`

Import `LineWidth` from `.options`:

```text
from .options import (
    ChartType,
    CrosshairMode,
    LineStyle,
    LineType,
    LineWidth,          # <-- add
    PriceScaleMode,
    PriceFormatter,
    CHART_TYPE_MAP,
    CROSSHAIR_MODE_MAP,
    LINE_STYLE_MAP,
    PRICE_SCALE_MODE_MAP,
)
```

Update all crosshair line-width parameters in the `chart()` signature:

```text
# Before:
crosshair_vert_line_width: Optional[int] = None,
crosshair_horz_line_width: Optional[int] = None,

# After:
crosshair_vert_line_width: Optional[LineWidth] = None,
crosshair_horz_line_width: Optional[LineWidth] = None,
```

#### Code Change — `markers.py`

Import `LineWidth` and annotate `PriceLine.line_width`:

```text
from .options import (
    LineStyle,
    LineWidth,          # <-- add
    MarkerPosition,
    MarkerShape,
    LINE_STYLE_MAP,
    MARKER_POSITION_MAP,
    MARKER_SHAPE_MAP,
)

@dataclass
class PriceLine:
    ...
    line_width: Optional[LineWidth] = None   # was Optional[int]
```

#### Export in `__init__.py`

Add `LineWidth` to the imports from `.options` and to `__all__`:

```text
from .options import (
    ChartType,
    PriceFormat,
    PriceFormatter,
    LineStyle,
    LineType,
    LineWidth,          # <-- add
    CrosshairMode,
    PriceScaleMode,
    MarkerShape,
    MarkerPosition,
)
```

```text
__all__ = [
    ...
    "LineWidth",        # <-- add alongside LineStyle, LineType
    ...
]
```

#### Test Coverage

Add to `test_chart.py` in a new `TestLineWidth` class:

```text
class TestLineWidth(unittest.TestCase):
    """Tests that LineWidth annotation is exported and its values are accepted."""

    def setUp(self):
        self.table = MagicMock(name="table")

    def test_linewidth_exported(self):
        """LineWidth must be importable from the top-level package."""
        from deephaven.plot.tradingview_lightweight.options import LineWidth
        # Verify it is a Literal type (not None or int)
        import typing
        args = typing.get_args(LineWidth)
        self.assertEqual(set(args), {1, 2, 3, 4})

    def test_linewidth_values_accepted_in_chart(self):
        """All four valid LineWidth values should serialize without error."""
        s = line_series(self.table)
        for w in (1, 2, 3, 4):
            c = chart(s, crosshair_vert_line_width=w)
            self.assertEqual(
                c.chart_options["crosshair"]["vertLine"]["width"],
                w,
                f"Width {w} should pass through verbatim",
            )

    def test_linewidth_price_line_annotation(self):
        """PriceLine.line_width accepts LineWidth-typed ints."""
        from deephaven.plot.tradingview_lightweight.markers import PriceLine
        pl = PriceLine(price=100.0, line_width=2)
        self.assertEqual(pl.to_dict()["lineWidth"], 2)
```

---

### 2.2 `PriceFormatCustom` — Not Feasible; Document Clearly

#### Decision: Skip; add an explicit `NotImplementedError` guard

`PriceFormatCustom` requires a JS callable `formatter: (priceValue: BarPrice) => string`. The Python plugin serializes configuration to JSON — there is no mechanism to ship a Python callable as a JS function. There is no serializable representation for arbitrary JS formatter logic.

The existing `PriceFormat` TypedDict in `options.py` (line 78–83) already includes `type: Literal["price", "volume", "percent", "custom"]`. The `"custom"` literal should be **removed** from this union to prevent users from accidentally passing `type="custom"` and getting silent failures.

#### Code Change — `options.py`

Update the `PriceFormat` TypedDict:

```text
class PriceFormat(TypedDict, total=False):
    """Price format configuration (built-in formats only).

    The ``type`` field selects the formatting mode:
      - ``'price'``: standard decimal price (default)
      - ``'volume'``: abbreviated volume (e.g., ``1.2K``, ``3.4M``)
      - ``'percent'``: percentage

    Note:
        The ``'custom'`` type from the TradingView JS API requires a JavaScript
        formatter callback and cannot be expressed in this Python plugin. Passing
        ``type='custom'`` will raise ``ValueError`` at chart-building time.
    """

    type: Literal["price", "volume", "percent"]  # removed "custom"
    precision: int
    min_move: float
```

#### Code Change — `chart.py` (series serialization)

When serializing a `PriceFormat` that contains `type="custom"` (for defensive correctness), raise a `ValueError` with a clear message. Locate the code path that serializes `price_format` in `series.py` and add a guard:

```text
# In series.py, wherever price_format is serialized:
if price_format.get("type") == "custom":
    raise ValueError(
        "PriceFormatCustom (type='custom') is not supported by the Python plugin. "
        "The TradingView JS API requires a JavaScript formatter callback which "
        "cannot be serialized from Python. Use type='price', 'volume', or 'percent'."
    )
```

#### Documentation Comment in `options.py`

Add a module-level comment block after `PriceFormat`:

```text
# PriceFormatCustom is intentionally not implemented.
# The JS API defines:
#   { type: 'custom'; formatter: (priceValue: BarPrice) => string; minMove?: number }
# The 'formatter' field is a JavaScript callback. Since this plugin serializes
# configuration to JSON, there is no way to express a Python callable as JS code.
# See: notes/api-coverage-report.md §26.
```

#### Test Coverage

```text
class TestPriceFormat(unittest.TestCase):

    def test_price_format_builtin_types_accepted(self):
        """Valid built-in type values should not raise."""
        from deephaven.plot.tradingview_lightweight.options import PriceFormat
        for t in ("price", "volume", "percent"):
            pf: PriceFormat = {"type": t, "precision": 2, "min_move": 0.01}
            self.assertEqual(pf["type"], t)

    def test_price_format_custom_type_not_in_literal(self):
        """The 'custom' literal must not appear in PriceFormat.type."""
        import typing
        from deephaven.plot.tradingview_lightweight.options import PriceFormat
        hints = typing.get_type_hints(PriceFormat)
        type_args = typing.get_args(hints.get("type", None))
        self.assertNotIn("custom", type_args)
```

---

### 2.3 `VerticalGradientColor` — Coordinate with Layout Options Plan (Plan 03)

#### Status

`VerticalGradientColor` is the gradient background type. It is covered in detail by the layout-options plan (`notes/coverage-plan/03-layout-options.md`, §4). That plan adds `background_top_color` and `background_bottom_color` parameters to `chart()` and serializes them as `{ type: 'gradient', topColor: ..., bottomColor: ... }`.

#### Action Required in This Plan

**Do not re-implement.** Reference the layout plan and note that `VerticalGradientColor` coverage is complete once plan 03 is merged.

Add a `VerticalGradientColor` type alias to `options.py` as a `TypedDict` for documentation completeness, but do not export it — it is an internal serialization detail, not a user-facing type:

```text
class _VerticalGradientColor(TypedDict):
    """Internal shape: serialized as layout.background when gradient is used."""
    type: Literal["gradient"]
    topColor: str
    bottomColor: str
```

The underscore prefix signals it is internal. Users configure gradient backgrounds via `background_top_color` / `background_bottom_color` kwargs, not by constructing this dict directly.

#### No new exports. No new tests beyond those in plan 03.

---

### 2.4 `HorzAlign` and `VertAlign` — Add Proper `Literal` Type Constraints

#### Current State

`HorzAlign` and `VertAlign` appear wherever text alignment is configured (watermark text, axis labels). Currently they accept raw `str` with no validation or type annotation. Any string is accepted silently.

#### Decision: Add `Literal` aliases and annotate all relevant parameters

```text
# In options.py, after LineType:
HorzAlign = Literal["left", "center", "right"]
VertAlign = Literal["top", "center", "bottom"]
```

These pass through verbatim to JS (no mapping dict needed — the Python values are identical to the JS values).

#### Where They Are Used

Search the codebase for all parameters that accept alignment strings. Based on the API reference, `HorzAlign` appears in:
- `TextWatermarkLineOptions.horzAlign` — watermark line horizontal alignment
- Any future text-label primitives

`VertAlign` appears in:
- `TextWatermarkOptions.vertAlign` — overall watermark vertical position
- Any future text-label primitives

At the time of this plan the watermark parameters in `chart.py` use raw `Optional[str]`. Update each:

```text
# In chart.py, import additions:
from .options import (
    ...
    HorzAlign,
    VertAlign,
)

# In chart() signature, locate watermark parameters and update:
watermark_horz_align: Optional[HorzAlign] = None,   # was Optional[str]
watermark_vert_align: Optional[VertAlign] = None,   # was Optional[str]
```

If no watermark alignment parameters currently exist in `chart()`, they may need to be added as part of a separate watermark-options plan. In that case, this plan establishes the type aliases only, and the watermark plan consumes them. Mark this dependency explicitly.

#### Export in `__init__.py`

```text
from .options import (
    ...
    HorzAlign,
    VertAlign,
)

__all__ = [
    ...
    "HorzAlign",
    "VertAlign",
]
```

#### Test Coverage

```text
class TestAlignTypes(unittest.TestCase):

    def test_horz_align_literal_values(self):
        """HorzAlign must be exactly {'left', 'center', 'right'}."""
        import typing
        from deephaven.plot.tradingview_lightweight.options import HorzAlign
        args = typing.get_args(HorzAlign)
        self.assertEqual(set(args), {"left", "center", "right"})

    def test_vert_align_literal_values(self):
        """VertAlign must be exactly {'top', 'center', 'bottom'}."""
        import typing
        from deephaven.plot.tradingview_lightweight.options import VertAlign
        args = typing.get_args(VertAlign)
        self.assertEqual(set(args), {"top", "center", "bottom"})

    def test_horz_align_exported(self):
        """HorzAlign must be importable from the top-level package."""
        from deephaven.plot import tradingview_lightweight as tvl
        self.assertTrue(hasattr(tvl, "HorzAlign"))

    def test_vert_align_exported(self):
        """VertAlign must be importable from the top-level package."""
        from deephaven.plot import tradingview_lightweight as tvl
        self.assertTrue(hasattr(tvl, "VertAlign"))
```

---

### 2.5 `Coordinate` and `Logical` — Document as N/A

#### Decision: Do not implement; add a module-level comment

`Coordinate` (`Nominal<number, "Coordinate">`) represents pixel positions on the chart canvas.
`Logical` (`Nominal<number, "Logical">`) represents index-based positions in the chart's data array.

Both are used exclusively by JS runtime APIs:
- `ITimeScaleApi.logicalToCoordinate(logical: Logical): Coordinate`
- `ITimeScaleApi.coordinateToLogical(x: Coordinate): Logical | null`
- Mouse event handlers (`MouseEventParams.point.x` is a `Coordinate`)

Since the Python plugin has no live handle on the running JS chart and no event system, there is no Python-side use case for either type. They exist purely within the JS event and query system.

#### Action

Add a comment in `options.py` before or after the `LineWidth` definition:

```text
# Coordinate and Logical are JS-only nominal types used by ITimeScaleApi
# (logicalToCoordinate, coordinateToLogical) and mouse event handlers.
# These APIs are architecturally unavailable from Python (no live chart handle).
# See: notes/api-coverage-report.md §16, §26.
```

No type alias, no export, no test. The comment is sufficient for future contributors.

---

### 2.6 `SolidColor` — Expose as a Named Type Alias

#### Current State

`SolidColor` is hardcoded inline in `chart.py`:

```text
if background_color is not None:
    layout["background"] = {"type": "solid", "color": background_color}
```

There is no named `SolidColor` type visible to users or to mypy.

#### Decision: Add a `TypedDict` for internal use; do not export to users

The solid background is configured via `background_color: Optional[str]` — a flat parameter. Users never construct `SolidColor` directly. Exporting the dict type would be confusing because users cannot pass it where `background_color` is expected (the API doesn't accept a dict for that param).

However, add a private `_SolidColor` TypedDict for internal type correctness and future use:

```text
class _SolidColor(TypedDict):
    """Internal shape: serialized as layout.background for solid backgrounds."""
    type: Literal["solid"]
    color: str
```

Use it in an internal helper if desired:

```text
def _make_solid_color(color: str) -> _SolidColor:
    return {"type": "solid", "color": color}
```

This helper can then be called wherever solid backgrounds are constructed to ensure consistent serialization.

#### Why Not Export It?

The user-facing API for solid backgrounds is `background_color="..."`. Exporting `SolidColor` would suggest to users that they could do `chart(s, background=SolidColor(color="#000"))`, which is not supported. Keeping the type internal prevents this confusion. If a future refactor adds a dict-accepting `background` parameter, this internal type can be promoted at that time.

#### No new test coverage required. The existing `test_background_color_only` and `test_layout_options` tests cover this.

---

## 3. Top-Level Functions

### 3.1 `isBusinessDay()` / `isUTCTimestamp()` — Python Utility Functions

#### JS API

```typescript
isBusinessDay(time: Time): time is BusinessDay
isUTCTimestamp(time: Time): time is UTCTimestamp
```

These are JS type guards that narrow `Time` (a union of `BusinessDay | UTCTimestamp | string`) to a concrete type at runtime.

#### Python Equivalents

In Python, `Time` values passed to markers and series data are plain Python objects:
- `BusinessDay` would be a `dict` like `{"year": 2024, "month": 1, "day": 15}` (see §17 of the coverage report)
- `UTCTimestamp` is a numeric `int` or `float`
- ISO string is a `str`

Python already has natural type-checking via `isinstance`. However, providing explicit helpers mirrors the JS API and aids users who are porting JS code or reading the API reference.

#### Decision: Implement as simple Python predicate functions in a new `utils.py` module

These are pure Python utility functions with no plugin dependency. They belong in a dedicated `utils.py` so they can be tested without mocking Deephaven imports.

**File:** `src/deephaven/plot/tradingview_lightweight/utils.py` (new file)

```text
"""Utility functions for the TradingView Lightweight Charts plugin.

These mirror the top-level utility functions in the JavaScript library.
"""

from __future__ import annotations

from typing import Any, Union


def is_business_day(time: Any) -> bool:
    """Return True if *time* is a BusinessDay dict.

    A BusinessDay is a dict with integer keys ``year``, ``month``, and ``day``.
    This mirrors the JS ``isBusinessDay()`` type guard.

    Args:
        time: A time value — either a BusinessDay dict, a numeric UTC timestamp,
            or an ISO date string.

    Returns:
        ``True`` if *time* is a ``dict`` containing ``year``, ``month``, and
        ``day`` integer keys; ``False`` otherwise.

    Example::

        from deephaven.plot.tradingview_lightweight import is_business_day

        is_business_day({"year": 2024, "month": 3, "day": 15})  # True
        is_business_day(1710460800)                              # False
        is_business_day("2024-03-15")                           # False
    """
    return (
        isinstance(time, dict)
        and isinstance(time.get("year"), int)
        and isinstance(time.get("month"), int)
        and isinstance(time.get("day"), int)
    )


def is_utc_timestamp(time: Any) -> bool:
    """Return True if *time* is a numeric UTC timestamp.

    A UTCTimestamp is a Unix epoch timestamp (seconds since 1970-01-01 UTC)
    expressed as an ``int`` or ``float``. This mirrors the JS ``isUTCTimestamp()``
    type guard.

    Args:
        time: A time value — either a BusinessDay dict, a numeric UTC timestamp,
            or an ISO date string.

    Returns:
        ``True`` if *time* is an ``int`` or ``float`` (but not a ``bool``);
        ``False`` otherwise.

    Example::

        from deephaven.plot.tradingview_lightweight import is_utc_timestamp

        is_utc_timestamp(1710460800)                              # True
        is_utc_timestamp(1710460800.5)                           # True
        is_utc_timestamp({"year": 2024, "month": 3, "day": 15}) # False
        is_utc_timestamp("2024-03-15")                           # False
    """
    # Explicitly exclude bool: in Python, bool is a subclass of int
    return isinstance(time, (int, float)) and not isinstance(time, bool)
```

#### Export in `__init__.py`

```text
from .utils import is_business_day, is_utc_timestamp

__all__ = [
    ...
    "is_business_day",
    "is_utc_timestamp",
]
```

#### Test Coverage

Create `test/deephaven/plot/tradingview_lightweight/test_utils.py`:

```text
"""Tests for utility functions."""

from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(
    0, os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "src")
)

from deephaven.plot.tradingview_lightweight.utils import (
    is_business_day,
    is_utc_timestamp,
)


class TestIsBusinessDay(unittest.TestCase):

    def test_valid_business_day(self):
        self.assertTrue(is_business_day({"year": 2024, "month": 3, "day": 15}))

    def test_extra_keys_ok(self):
        """Extra keys beyond year/month/day are acceptable."""
        self.assertTrue(
            is_business_day({"year": 2024, "month": 3, "day": 15, "extra": "data"})
        )

    def test_integer_timestamp_is_not_business_day(self):
        self.assertFalse(is_business_day(1710460800))

    def test_float_timestamp_is_not_business_day(self):
        self.assertFalse(is_business_day(1710460800.5))

    def test_iso_string_is_not_business_day(self):
        self.assertFalse(is_business_day("2024-03-15"))

    def test_none_is_not_business_day(self):
        self.assertFalse(is_business_day(None))

    def test_dict_missing_year(self):
        self.assertFalse(is_business_day({"month": 3, "day": 15}))

    def test_dict_missing_month(self):
        self.assertFalse(is_business_day({"year": 2024, "day": 15}))

    def test_dict_missing_day(self):
        self.assertFalse(is_business_day({"year": 2024, "month": 3}))

    def test_dict_string_year(self):
        """Non-integer year should return False."""
        self.assertFalse(is_business_day({"year": "2024", "month": 3, "day": 15}))

    def test_empty_dict(self):
        self.assertFalse(is_business_day({}))

    def test_list_is_not_business_day(self):
        self.assertFalse(is_business_day([2024, 3, 15]))


class TestIsUtcTimestamp(unittest.TestCase):

    def test_integer_is_utc_timestamp(self):
        self.assertTrue(is_utc_timestamp(1710460800))

    def test_float_is_utc_timestamp(self):
        self.assertTrue(is_utc_timestamp(1710460800.5))

    def test_zero_is_utc_timestamp(self):
        self.assertTrue(is_utc_timestamp(0))

    def test_negative_is_utc_timestamp(self):
        """Negative timestamps (before epoch) are valid."""
        self.assertTrue(is_utc_timestamp(-86400))

    def test_bool_is_not_utc_timestamp(self):
        """bool is a subclass of int in Python; must be excluded."""
        self.assertFalse(is_utc_timestamp(True))
        self.assertFalse(is_utc_timestamp(False))

    def test_business_day_dict_is_not_utc_timestamp(self):
        self.assertFalse(is_utc_timestamp({"year": 2024, "month": 3, "day": 15}))

    def test_iso_string_is_not_utc_timestamp(self):
        self.assertFalse(is_utc_timestamp("2024-03-15"))

    def test_none_is_not_utc_timestamp(self):
        self.assertFalse(is_utc_timestamp(None))

    def test_list_is_not_utc_timestamp(self):
        self.assertFalse(is_utc_timestamp([1710460800]))
```

---

### 3.2 `version()` — Expose the JS Library Version from Python

#### JS API

```typescript
version(): string  // e.g. "5.1.0"
```

Returns the version of the `lightweight-charts` JS package that is bundled with the plugin. This is useful for debugging and for users who need to check API compatibility.

#### Decision: Implement as a Python function that reads from the JS bundle's package manifest

The plugin's JS bundle is built from `src/js/`. The `lightweight-charts` version is pinned in `src/js/package.json`. At build time, this version becomes part of the installed wheel. The best approach is to read this version from the installed package metadata rather than hardcoding it or making a JS call.

Two sub-approaches:

**Option A: Hardcode in `utils.py`** — Simple, but must be updated manually when `lightweight-charts` is upgraded. Risk of drift.

**Option B: Read from `package.json` at import time** — Requires the `package.json` to be included as package data in the wheel. More robust; auto-updates when the dependency is upgraded.

**Option C: Read via `importlib.metadata` (recommended)** — The Python package metadata can include an `[options.package_data]` entry or the `lightweight-charts` version can be baked into a `_version.py` module during build. This is the most Pythonic approach.

**Recommended approach for this plan: `_version.py` + `version()` function**

At build time, a `_version.py` file is generated (or manually maintained) containing:

```text
# Auto-generated by build process — do not edit manually.
# Reflects the lightweight-charts JS package version bundled with this plugin.
__js_version__ = "5.1.0"
```

The `version()` function reads this:

```text
# In utils.py:

def version() -> str:
    """Return the version of the bundled lightweight-charts JS library.

    This mirrors the ``version()`` function in the JavaScript API. Useful
    for debugging and API compatibility checks.

    Returns:
        Version string of the bundled ``lightweight-charts`` package,
        e.g. ``'5.1.0'``.

    Example::

        from deephaven.plot.tradingview_lightweight import version
        print(version())  # '5.1.0'
    """
    try:
        from ._version import __js_version__
        return __js_version__
    except ImportError:
        return "unknown"
```

#### Build-time `_version.py` Generation

Add a step to `setup.py` / `pyproject.toml` that reads the `lightweight-charts` version from `src/js/package.json` and writes `src/deephaven/plot/tradingview_lightweight/_version.py`. If the project uses `hatch` or `setuptools`, a custom build hook accomplishes this.

Example `build_hooks.py` snippet:

```text
import json
import pathlib

def write_js_version():
    package_json = pathlib.Path(__file__).parent / "src" / "js" / "package.json"
    with open(package_json) as f:
        deps = json.load(f).get("dependencies", {})
    js_version = deps.get("lightweight-charts", "unknown").lstrip("^~")
    version_file = (
        pathlib.Path(__file__).parent
        / "src" / "deephaven" / "plot" / "tradingview_lightweight"
        / "_version.py"
    )
    version_file.write_text(
        f'# Auto-generated by build process — do not edit manually.\n'
        f'__js_version__ = "{js_version}"\n'
    )
```

If implementing the build hook is out of scope for this iteration, fall back to **Option A** (hardcode `__js_version__ = "5.1.0"` in a manually-maintained `_version.py`) and add a comment: `# Update this when lightweight-charts is upgraded in src/js/package.json`.

#### Export in `__init__.py`

```text
from .utils import is_business_day, is_utc_timestamp, version

__all__ = [
    ...
    "version",
]
```

#### Test Coverage

Add to `test_utils.py`:

```text
class TestVersion(unittest.TestCase):

    def test_version_returns_string(self):
        """version() must return a non-empty string."""
        from deephaven.plot.tradingview_lightweight.utils import version
        v = version()
        self.assertIsInstance(v, str)
        self.assertTrue(len(v) > 0)

    def test_version_format(self):
        """version() should return either a semver string or 'unknown'."""
        from deephaven.plot.tradingview_lightweight.utils import version
        v = version()
        if v != "unknown":
            parts = v.split(".")
            self.assertGreaterEqual(len(parts), 2, f"Expected semver, got: {v!r}")

    def test_version_exported(self):
        """version must be importable from the top-level package."""
        from deephaven.plot import tradingview_lightweight as tvl
        self.assertTrue(callable(tvl.version))
```

---

### 3.3 `createUpDownMarkers()` — Deferred; Reference Markers Plan

#### JS API

```typescript
createUpDownMarkers<T>(
    series: ISeriesApi,
    options?: UpDownMarkersPluginOptions
): ISeriesUpDownMarkerPluginApi<T>
```

Creates a plugin that automatically places up/down arrow markers on each bar of a series, with arrows colored by whether the bar moved up or down from the previous bar.

#### Feasibility Assessment

This is partially feasible in a static-configuration model:
- The plugin accepts `options` (colors, sizes) — these are serializable
- The series reference is a runtime JS object — the Python side would need to attach it to a specific series by reference

However, the series reference problem is the same one faced by all series-level plugins (like `createSeriesMarkers()`). The existing approach in this plugin is to embed marker configuration as part of the `SeriesSpec` dict (the `markers` / `marker_spec` fields). The same approach could be used for up/down markers.

#### Decision: Defer to a dedicated markers-extension plan

`createUpDownMarkers` is tightly coupled with the marker/series architecture. It should be implemented alongside or after the main markers plan is finalized. This avoids designing a parallel attachment mechanism that might conflict.

**What this plan does:**
1. Notes the deferral with a clear rationale
2. Proposes the eventual Python surface API so implementers can plan ahead

**Proposed future Python API:**

```text
# As a parameter on series creation functions:
line_series(
    table,
    up_down_markers=True,                          # enable with defaults
    up_down_marker_up_color="#26a69a",             # optional color override
    up_down_marker_down_color="#ef5350",           # optional color override
)

# Or as a dedicated helper:
from deephaven.plot.tradingview_lightweight import up_down_markers

s = line_series(table)
s_with_markers = up_down_markers(s, up_color="#26a69a", down_color="#ef5350")
```

**Serialization:** When `up_down_markers=True`, the series dict gains an `"upDownMarkers"` key with the plugin options. The JS plugin's series renderer detects this key and calls `createUpDownMarkers(series, options)` after adding the series to the chart.

**Action for this plan:** Document the deferral and proposed API shape. Do not implement. Add a TODO comment in `series.py`:

```text
# TODO: createUpDownMarkers plugin support — see notes/coverage-plan/18-utility-types-and-functions.md §3.3
# When implementing, add up_down_markers, up_down_marker_up_color, up_down_marker_down_color
# params to series creation functions and serialize as seriesOptions.upDownMarkers.
```

---

## 4. Variables

### 4.1 `customSeriesDefaultOptions` — Defer; Document Dependency on Custom Series Support

#### JS API

```typescript
const customSeriesDefaultOptions: CustomSeriesOptions = {
    // default options for custom series
};
```

A constant that holds the default options for a custom series definition. Used as a base when building custom series plugins in JS.

#### Feasibility Assessment

`customSeriesDefaultOptions` is meaningful only if the Python plugin supports custom series (`chart_type="custom"` or `addSeries(CustomSeriesDefinition)`). The coverage report (§10) shows `CustomSeries` type is not implemented (0/7 series types = Custom). The `ChartType` Literal in `options.py` does not include `"custom"`.

Custom series require:
1. A JS `ICustomSeriesView` implementation (user-supplied JS code)
2. A way to pass the custom series definition to the Python plugin
3. The Python plugin to forward it to JS

This is a substantial undertaking that goes well beyond adding a default options constant. The constant is meaningless without the surrounding infrastructure.

#### Decision: Document as blocked on custom series support; add a sentinel

Do not add a Python `customSeriesDefaultOptions` variable. Instead, add a documentation comment in `options.py`:

```text
# customSeriesDefaultOptions is not implemented.
# It is only meaningful in the context of custom series (ICustomSeriesView).
# Custom series require user-supplied JavaScript ICustomSeriesView implementations,
# which the Python plugin has no mechanism to accept or forward.
# Implementation is blocked until custom series support is added.
# See: notes/api-coverage-report.md §10, §27.
```

If custom series support is ever added, `customSeriesDefaultOptions` should be exposed as a module-level constant mirroring the JS defaults:

```text
# Future: when custom series support lands
from typing import TypedDict

class CustomSeriesOptions(TypedDict, total=False):
    title: str
    priceScaleId: str
    visible: bool
    lastValueVisible: bool
    priceLineVisible: bool
    # ... all SeriesOptionsCommon fields

customSeriesDefaultOptions: CustomSeriesOptions = {
    "title": "",
    "visible": True,
    "lastValueVisible": True,
    "priceLineVisible": True,
}
```

**No test coverage required** for a deferred/not-implemented item.

---

## 5. Summary of All Changes

### 5.1 Files to Create

| File | Purpose |
|---|---|
| `src/deephaven/plot/tradingview_lightweight/utils.py` | `is_business_day()`, `is_utc_timestamp()`, `version()` |
| `src/deephaven/plot/tradingview_lightweight/_version.py` | `__js_version__` constant (manually maintained or build-generated) |
| `test/deephaven/plot/tradingview_lightweight/test_utils.py` | Unit tests for all three utility functions |

### 5.2 Files to Modify

| File | Changes |
|---|---|
| `src/deephaven/plot/tradingview_lightweight/options.py` | Add `LineWidth`, `HorzAlign`, `VertAlign`; update `PriceFormat`; add `_SolidColor`, `_VerticalGradientColor` privates; add N/A comments for `Coordinate`/`Logical`/`customSeriesDefaultOptions` |
| `src/deephaven/plot/tradingview_lightweight/chart.py` | Import `LineWidth`, `HorzAlign`, `VertAlign`; update crosshair width param types |
| `src/deephaven/plot/tradingview_lightweight/markers.py` | Import `LineWidth`; annotate `PriceLine.line_width` |
| `src/deephaven/plot/tradingview_lightweight/series.py` | Add `PriceFormatCustom` guard |
| `src/deephaven/plot/tradingview_lightweight/__init__.py` | Export `LineWidth`, `HorzAlign`, `VertAlign`, `is_business_day`, `is_utc_timestamp`, `version` |
| `test/deephaven/plot/tradingview_lightweight/test_chart.py` | Add `TestLineWidth`, `TestPriceFormat`, `TestAlignTypes` test classes |

### 5.3 Items with No Action Required

| Item | Reason |
|---|---|
| `DeepPartial<T>` | TS generic; Python uses `Optional[...]` kwargs everywhere |
| `Coordinate` | JS event system only; no Python runtime |
| `Logical` | JS time-scale only; no Python runtime |
| `VerticalGradientColor` (user-facing) | Covered by plan 03 (`background_top_color` / `background_bottom_color`) |
| `SolidColor` (user-facing) | Covered by existing `background_color` param |
| `SeriesOptionsMap` / `SeriesPartialOptionsMap` | TS generics; Python uses separate functions per series type |
| `createChart()` | Already implemented as `chart()` |
| `createChartEx()` | Custom horizontal scale; architecturally not applicable |
| `createYieldCurveChart()` | Already implemented as `yield_curve()` |
| `createTextWatermark()` | Partially covered by existing watermark kwargs; see watermark plan |
| `createImageWatermark()` | Out of scope for this plan; no URL-as-series-data pattern exists |
| `createSeriesMarkers()` | Already covered via `markers=` / `marker_spec=` params |
| Series definition variables (`LineSeries`, `AreaSeries`, etc.) | All six already exported (§27 coverage: 6/7) |
| `customSeriesDefaultOptions` | Blocked on custom series support |
| `createUpDownMarkers()` | Deferred to markers extension plan |

---

## 6. Implementation Order

Execute in this order to minimize merge conflicts and keep tests green throughout:

1. **`options.py` — type aliases** (no behavioral change; safe first step)
   - Add `LineWidth = Literal[1, 2, 3, 4]`
   - Add `HorzAlign = Literal["left", "center", "right"]`
   - Add `VertAlign = Literal["top", "center", "bottom"]`
   - Remove `"custom"` from `PriceFormat.type` union; update docstring
   - Add `_SolidColor`, `_VerticalGradientColor` private TypedDicts
   - Add N/A comments for `Coordinate`, `Logical`, `customSeriesDefaultOptions`
   - Run existing tests — all must pass unchanged

2. **`chart.py` + `markers.py` — annotation updates**
   - Import `LineWidth`, `HorzAlign`, `VertAlign`
   - Change `crosshair_vert_line_width` / `crosshair_horz_line_width` annotations to `Optional[LineWidth]`
   - Change `PriceLine.line_width` annotation to `Optional[LineWidth]`
   - No logic changes; run existing tests

3. **`series.py` — `PriceFormatCustom` guard**
   - Locate the price_format serialization path
   - Add `ValueError` for `type="custom"`
   - Add test in `test_chart.py` `TestPriceFormat` class

4. **`utils.py` — new file**
   - Implement `is_business_day()`, `is_utc_timestamp()`, `version()`
   - No imports from the rest of the plugin (pure utility)

5. **`_version.py` — new file**
   - Manually create with current `lightweight-charts` version from `src/js/package.json`
   - Add build hook integration if the build system supports it

6. **`__init__.py` — new exports**
   - Add `LineWidth`, `HorzAlign`, `VertAlign` to imports and `__all__`
   - Add `is_business_day`, `is_utc_timestamp`, `version` imports and `__all__`

7. **`test_utils.py` — new test file**
   - All `TestIsBusinessDay`, `TestIsUtcTimestamp`, `TestVersion` classes

8. **`test_chart.py` — new test classes**
   - `TestLineWidth`, `TestPriceFormat`, `TestAlignTypes`

9. **Run full test suite** and verify zero regressions:
   ```bash
   PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
   $PY -m pytest test/ -v
   ```

---

## 7. Serialization Contracts (JSON Wire Format)

### `LineWidth`

Pass-through: `Optional[LineWidth]` values are integers 1–4 that serialize directly as JSON integers. No mapping dict needed.

| Python param | JSON key | JS type |
|---|---|---|
| `crosshair_vert_line_width: Optional[LineWidth]` | `crosshair.vertLine.width` | `LineWidth` (1\|2\|3\|4) |
| `crosshair_horz_line_width: Optional[LineWidth]` | `crosshair.horzLine.width` | `LineWidth` (1\|2\|3\|4) |
| `PriceLine.line_width: Optional[LineWidth]` | `lineWidth` in price line dict | `LineWidth` |

### `HorzAlign` / `VertAlign`

Pass-through: Python string values are identical to JS values; no mapping needed.

| Python value | JSON value | JS type |
|---|---|---|
| `"left"` | `"left"` | `HorzAlign` |
| `"center"` | `"center"` | `HorzAlign` / `VertAlign` |
| `"right"` | `"right"` | `HorzAlign` |
| `"top"` | `"top"` | `VertAlign` |
| `"bottom"` | `"bottom"` | `VertAlign` |

### `version()`

Not serialized to JSON; Python-only return value.

### `is_business_day()` / `is_utc_timestamp()`

Not serialized; Python-only predicates.

---

## 8. Worked Examples for Documentation

### `LineWidth`

```text
from deephaven.plot.tradingview_lightweight import chart, line_series, LineWidth

# With type annotation (for IDEs and mypy):
width: LineWidth = 2

c = chart(
    line_series(table, value="Price"),
    crosshair_vert_line_width=2,    # 1, 2, 3, or 4
    crosshair_horz_line_width=1,
)
```

### `HorzAlign` / `VertAlign`

```text
from deephaven.plot.tradingview_lightweight import chart, line_series, HorzAlign, VertAlign

# When watermark alignment is supported (see watermark plan):
c = chart(
    line_series(table, value="Price"),
    watermark_text="DEMO",
    watermark_horz_align="center",  # type: HorzAlign
    watermark_vert_align="top",     # type: VertAlign
)
```

### `is_business_day()` / `is_utc_timestamp()`

```text
from deephaven.plot.tradingview_lightweight import is_business_day, is_utc_timestamp

time_values = [
    {"year": 2024, "month": 3, "day": 15},
    1710460800,
    "2024-03-15",
]

for t in time_values:
    if is_business_day(t):
        print(f"{t} is a BusinessDay")
    elif is_utc_timestamp(t):
        print(f"{t} is a UTC timestamp")
    else:
        print(f"{t} is an ISO date string")
```

### `version()`

```text
from deephaven.plot.tradingview_lightweight import version

print(f"Using lightweight-charts JS library v{version()}")
# Using lightweight-charts JS library v5.1.0
```

---

## 9. Open Questions for Implementer

1. **Build hook for `_version.py`:** Does the project use a custom build hook (e.g., `hatchling` build hooks, `setuptools` `cmdclass`)? If yes, the `_version.py` generation should be integrated into the existing build pipeline. If no build hook infrastructure exists, manually maintain `_version.py` and document the update procedure.

2. **`series.py` price_format path:** Locate exactly where `PriceFormat` is serialized into the series dict (probably in `SeriesSpec.to_dict()` or a helper function). The `ValueError` guard for `type="custom"` must be placed at that serialization point, not at the TypedDict definition level.

3. **Watermark alignment params:** Verify whether `watermark_horz_align` and `watermark_vert_align` already exist in `chart()`. If they do, simply change their type annotations from `Optional[str]` to `Optional[HorzAlign]` / `Optional[VertAlign]`. If they do not yet exist, they belong in the watermark plan (not this plan). In that case, this plan only establishes the type aliases.

4. **`LineWidth` in series style options:** Some series style options (e.g., `line_width` in `LineSeriesOptions`, `area_line_width`) may also use `int` where `LineWidth` should apply. These are covered by the per-series style plans (§13). This plan scopes `LineWidth` annotation only to crosshair and `PriceLine`; the per-series plans should import and reuse the alias.
