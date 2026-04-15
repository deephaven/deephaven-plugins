# Implementation Plan: Markers — Missing Coverage

**Target file:** `plugins/tradingview-lightweight/notes/coverage-plan/15-markers.md`
**Date:** 2026-04-11
**Covers:** API coverage report §22 — Markers

---

## 1. Current State

### What Exists

**`Marker` dataclass** (`markers.py`):
- Fields: `time`, `position`, `shape`, `color`, `text`, `size`
- `to_dict()` serializes all fields; `size` is omitted when `None`
- Stores already-mapped camelCase values for `position` and `shape`

**`marker()` factory** (`markers.py`):
- Accepts Python-style aliases (`above_bar`, `arrow_up`, etc.)
- Applies `MARKER_POSITION_MAP` and `MARKER_SHAPE_MAP` lookups before storing
- Unknown values fall back to `"aboveBar"` / `"circle"` respectively

**`MarkerSpec` dataclass** (`markers.py`):
- Table-driven markers; each row produces one marker
- Fixed defaults: `position`, `shape`, `color`, `text`, `size`
- Per-row column overrides: `position_column`, `shape_column`, `color_column`, `text_column`, `size_column`
- `get_columns()` returns all referenced column names
- `to_dict(table_id)` emits `{ tableId, columns, defaults }`

**`markers_from_table()` factory** (`markers.py`):
- Thin wrapper over `MarkerSpec`; same parameters

**`MARKER_POSITION_MAP`** (`options.py`):
```text
MARKER_POSITION_MAP = {
    "above_bar": "aboveBar",
    "below_bar": "belowBar",
    "in_bar":    "inBar",
}
```

**`MarkerPosition` type alias** (`options.py`):
```text
MarkerPosition = Literal["above_bar", "below_bar", "in_bar"]
```

### Coverage Gaps (from API Report §22)

| Item | Status |
|------|--------|
| `SeriesMarker.id` property | ❌ Missing |
| `SeriesMarker.price` property | ❌ Missing |
| `atPriceTop` position | ❌ Missing |
| `atPriceBottom` position | ❌ Missing |
| `atPriceMiddle` position | ❌ Missing |
| `createUpDownMarkers()` equivalent | ❌ Missing |
| `price_column` on `MarkerSpec` | ❌ Missing |

---

## 2. What Needs to Be Added

### 2.1 Missing Marker Properties: `id` and `price`

**`id`** — an optional string that uniquely identifies a marker. Used by the JS layer to correlate markers with hover events (`MouseEventParams.hoveredObjectId`). It is never required for rendering.

**`price`** — an optional float that is **required** when using any of the three price-based positions (`atPriceTop`, `atPriceBottom`, `atPriceMiddle`). When using bar-relative positions (`aboveBar`, `belowBar`, `inBar`) the `price` field must be absent from the serialized dict — do not emit `None` as a JSON `null`.

### 2.2 Missing Positions: `atPriceTop`, `atPriceBottom`, `atPriceMiddle`

These three positions pin the marker to an explicit price level rather than to the OHLC bar at that time. The `price` field on the marker determines the Y coordinate. Omitting `price` when using any of these three positions is a runtime error in the JS library.

### 2.3 `createUpDownMarkers()` Equivalent

**What `createUpDownMarkers()` does in JS:**
The JS function `createUpDownMarkers(series, upMarkers, downMarkers, options?)` is a convenience helper that creates a `SeriesMarkersPlugin` instance from two separate lists — one for bullish/up events and one for bearish/down events — and merges them into a single sorted marker array. It applies sensible defaults: up-markers use `arrowUp` + `belowBar`, down-markers use `arrowDown` + `aboveBar`, with caller-overridable colors.

**Python design — `up_down_markers()` factory:**
In Python there is no runtime plugin to manage; all markers are declared at chart-build time. The equivalent is a pure Python helper that accepts two lists of time values (or two data frames / table rows) and emits a combined list of `Marker` objects with appropriate defaults baked in.

The function signature should be:

```text
def up_down_markers(
    up_times: list[Any],
    down_times: list[Any],
    up_color: str = "#26a69a",      # green (matches LW default)
    down_color: str = "#ef5350",    # red   (matches LW default)
    up_text: str = "",
    down_text: str = "",
    up_size: Optional[int] = None,
    down_size: Optional[int] = None,
) -> list[Marker]:
```

It returns a single flat list of `Marker` objects — up events first, then down events — the same order the caller can pass directly to a `markers=` parameter on any series factory. The JS library sorts markers by time automatically, so Python does not need to sort them.

Up-markers default: `shape="arrow_up"`, `position="below_bar"`.
Down-markers default: `shape="arrow_down"`, `position="above_bar"`.

---

## 3. Detailed Implementation Steps

### Step 1 — Update `options.py`

**File:** `src/deephaven/plot/tradingview_lightweight/options.py`

#### 3.1.1 Extend `MarkerPosition` type alias

Replace:
```text
MarkerPosition = Literal["above_bar", "below_bar", "in_bar"]
```
With:
```text
MarkerPosition = Literal[
    "above_bar",
    "below_bar",
    "in_bar",
    "at_price_top",
    "at_price_bottom",
    "at_price_middle",
]
```

The new aliases use the same snake_case convention as the existing three.

#### 3.1.2 Extend `MARKER_POSITION_MAP`

Replace:
```text
MARKER_POSITION_MAP = {
    "above_bar": "aboveBar",
    "below_bar": "belowBar",
    "in_bar":    "inBar",
}
```
With:
```text
MARKER_POSITION_MAP = {
    "above_bar":       "aboveBar",
    "below_bar":       "belowBar",
    "in_bar":          "inBar",
    "at_price_top":    "atPriceTop",
    "at_price_bottom": "atPriceBottom",
    "at_price_middle": "atPriceMiddle",
}
```

No other change to this file is needed.

---

### Step 2 — Update `Marker` dataclass in `markers.py`

**File:** `src/deephaven/plot/tradingview_lightweight/markers.py`

#### 3.2.1 Add `id` and `price` fields

The `Marker` dataclass acquires two new optional fields. Because `dataclass` requires fields with defaults to come after fields without defaults, and all existing fields already have defaults, the new fields can be appended in any order. Place them after `size` to preserve the existing field order:

```text
@dataclass
class Marker:
    """A marker to place on a series at a specific time."""

    time: Any  # str, int, or float
    position: str = "aboveBar"
    shape: str = "circle"
    color: str = "#2196F3"
    text: str = ""
    size: Optional[int] = None
    id: Optional[str] = None       # NEW: unique identifier for hover events
    price: Optional[float] = None  # NEW: required for at_price_* positions
```

#### 3.2.2 Update `to_dict()`

The method must:
- Emit `"id"` only when it is not `None`
- Emit `"price"` only when it is not `None`
- Never emit `None` as a JSON value for either field

```text
def to_dict(self) -> dict:
    result = {
        "time": self.time,
        "position": self.position,
        "shape": self.shape,
        "color": self.color,
        "text": self.text,
    }
    if self.size is not None:
        result["size"] = self.size
    if self.id is not None:
        result["id"] = self.id
    if self.price is not None:
        result["price"] = self.price
    return result
```

#### 3.2.3 Add `__post_init__` validation

Add a `__post_init__` method to `Marker` that raises `ValueError` when a price-based position is used without supplying `price`:

```text
_PRICE_POSITIONS = {"atPriceTop", "atPriceBottom", "atPriceMiddle"}

@dataclass
class Marker:
    ...

    def __post_init__(self) -> None:
        if self.position in _PRICE_POSITIONS and self.price is None:
            raise ValueError(
                f"Marker position '{self.position}' requires the 'price' field to be set."
            )
```

Define `_PRICE_POSITIONS` as a module-level constant just above the `Marker` class so it can also be referenced in tests.

---

### Step 3 — Update `marker()` factory in `markers.py`

#### 3.3.1 Add `id` and `price` parameters

```text
def marker(
    time: Any,
    position: MarkerPosition = "above_bar",
    shape: MarkerShape = "circle",
    color: str = "#2196F3",
    text: str = "",
    size: Optional[int] = None,
    id: Optional[str] = None,        # NEW
    price: Optional[float] = None,   # NEW
) -> Marker:
    """Create a marker to place on a series at a specific time.

    For price-based positions ('at_price_top', 'at_price_bottom',
    'at_price_middle') you must also supply ``price``.
    """
    return Marker(
        time=time,
        position=MARKER_POSITION_MAP.get(position, "aboveBar"),
        shape=MARKER_SHAPE_MAP.get(shape, "circle"),
        color=color,
        text=text,
        size=size,
        id=id,
        price=price,
    )
```

Note: the `__post_init__` validation on `Marker` will fire automatically when `Marker(...)` is constructed inside `marker()`, so no separate guard is needed in the factory.

---

### Step 4 — Update `MarkerSpec` for price-column support

**File:** `src/deephaven/plot/tradingview_lightweight/markers.py`

#### 3.4.1 Add `price` and `price_column` fields

```text
@dataclass
class MarkerSpec:
    ...
    size: Optional[int] = None
    # NEW fields
    price: Optional[float] = None        # static price for at_price_* positions
    id_column: Optional[str] = None      # per-row marker id
    price_column: Optional[str] = None   # per-row price for at_price_* positions
    # Per-row column overrides (existing)
    position_column: Optional[str] = None
    ...
```

A static `price` applies the same price level to every row; `price_column` reads a different price per row. Both are mutually exclusive (validate in `__post_init__`).

#### 3.4.2 Add `__post_init__` validation to `MarkerSpec`

```text
def __post_init__(self) -> None:
    if self.price is not None and self.price_column is not None:
        raise ValueError("Cannot specify both 'price' and 'price_column' on MarkerSpec.")
```

#### 3.4.3 Update `get_columns()`

Add `id_column` and `price_column` to the list of columns returned:

```text
def get_columns(self) -> list[str]:
    cols = [self.time]
    for col in (
        self.position_column,
        self.shape_column,
        self.color_column,
        self.text_column,
        self.size_column,
        self.id_column,      # NEW
        self.price_column,   # NEW
    ):
        if col is not None:
            cols.append(col)
    return cols
```

#### 3.4.4 Update `to_dict()`

The serialized `columns` and `defaults` dicts must include `price` and `id`:

```text
def to_dict(self, table_id: int) -> dict:
    columns: dict = {"time": self.time}
    if self.position_column is not None:
        columns["position"] = self.position_column
    if self.shape_column is not None:
        columns["shape"] = self.shape_column
    if self.color_column is not None:
        columns["color"] = self.color_column
    if self.text_column is not None:
        columns["text"] = self.text_column
    if self.size_column is not None:
        columns["size"] = self.size_column
    if self.id_column is not None:       # NEW
        columns["id"] = self.id_column
    if self.price_column is not None:    # NEW
        columns["price"] = self.price_column

    defaults: dict = {}
    if self.position_column is None:
        defaults["position"] = MARKER_POSITION_MAP.get(self.position, "aboveBar")
    if self.shape_column is None:
        defaults["shape"] = MARKER_SHAPE_MAP.get(self.shape, "circle")
    if self.color_column is None:
        defaults["color"] = self.color
    if self.text_column is None:
        defaults["text"] = self.text
    if self.size_column is None and self.size is not None:
        defaults["size"] = self.size
    if self.price_column is None and self.price is not None:   # NEW
        defaults["price"] = self.price

    return {
        "tableId": table_id,
        "columns": columns,
        "defaults": defaults,
    }
```

Note: `id` has no fixed default (it is always optional) so it is only ever emitted via `columns["id"]` when `id_column` is set.

---

### Step 5 — Update `markers_from_table()` factory

```text
def markers_from_table(
    table: Any,
    time: str = "Timestamp",
    # Fixed defaults
    position: MarkerPosition = "above_bar",
    shape: MarkerShape = "circle",
    color: str = "#2196F3",
    text: str = "",
    size: Optional[int] = None,
    price: Optional[float] = None,          # NEW
    # Per-row column overrides
    position_column: Optional[str] = None,
    shape_column: Optional[str] = None,
    color_column: Optional[str] = None,
    text_column: Optional[str] = None,
    size_column: Optional[str] = None,
    id_column: Optional[str] = None,        # NEW
    price_column: Optional[str] = None,     # NEW
) -> MarkerSpec:
    """Create markers from a table.  Each row produces a marker.

    ``time`` is always a column name.  For each other property, you may
    pass a fixed value (e.g. ``color="#FF0000"``) that applies to every
    marker, or a ``*_column`` name (e.g. ``color_column="Color"``) to
    read the value per-row from the table.

    For price-based positions ('at_price_top', 'at_price_bottom',
    'at_price_middle') supply either ``price`` (same price for every row)
    or ``price_column`` (different price per row).
    """
    return MarkerSpec(
        table=table,
        time=time,
        position=position,
        shape=shape,
        color=color,
        text=text,
        size=size,
        price=price,
        position_column=position_column,
        shape_column=shape_column,
        color_column=color_column,
        text_column=text_column,
        size_column=size_column,
        id_column=id_column,
        price_column=price_column,
    )
```

---

### Step 6 — Add `up_down_markers()` factory

Add this new public function to `markers.py`, after `marker()` and before `price_line()`:

```text
def up_down_markers(
    up_times: list[Any],
    down_times: list[Any],
    up_color: str = "#26a69a",
    down_color: str = "#ef5350",
    up_text: str = "",
    down_text: str = "",
    up_size: Optional[int] = None,
    down_size: Optional[int] = None,
) -> list[Marker]:
    """Create a combined list of up and down markers.

    Equivalent to the JS ``createUpDownMarkers()`` convenience helper.
    Up-markers are placed below the bar with an upward arrow; down-markers
    are placed above the bar with a downward arrow.

    The returned list can be passed directly to the ``markers=`` parameter
    of any series factory.  The JS library will sort markers by time, so
    Python ordering does not matter.

    Args:
        up_times: Time values for bullish / up events.
        down_times: Time values for bearish / down events.
        up_color: Fill color for up-markers.  Default: ``"#26a69a"`` (green).
        down_color: Fill color for down-markers.  Default: ``"#ef5350"`` (red).
        up_text: Label text for up-markers.  Default: ``""`` (no label).
        down_text: Label text for down-markers.  Default: ``""`` (no label).
        up_size: Size multiplier for up-markers.  Default: library default (1).
        down_size: Size multiplier for down-markers.  Default: library default (1).

    Returns:
        Flat list of :class:`Marker` objects — up events followed by down events.
    """
    up_markers = [
        Marker(
            time=t,
            position="belowBar",
            shape="arrowUp",
            color=up_color,
            text=up_text,
            size=up_size,
        )
        for t in up_times
    ]
    down_markers = [
        Marker(
            time=t,
            position="aboveBar",
            shape="arrowDown",
            color=down_color,
            text=down_text,
            size=down_size,
        )
        for t in down_times
    ]
    return up_markers + down_markers
```

Note: `up_down_markers()` constructs `Marker` objects directly with already-camelCased `position` and `shape` strings, bypassing the mapping step. This is safe because the values are hard-coded constants from the known-good set.

---

### Step 7 — Update `__init__.py` exports

**File:** `src/deephaven/plot/tradingview_lightweight/__init__.py`

Check whether `up_down_markers` needs to be added to the public API surface. Follow the same pattern as `marker` and `markers_from_table`. Add `up_down_markers` to the import list and the `__all__` list (if one exists).

Locate the current import block for markers in `__init__.py` and add the new name:

```text
from .markers import (
    Marker,
    MarkerSpec,
    PriceLine,
    marker,
    markers_from_table,
    up_down_markers,   # NEW
    price_line,
)
```

---

## 4. Test Coverage

All new tests belong in:
`test/deephaven/plot/tradingview_lightweight/test_markers.py`

Add the following test classes. Insert them after the existing `TestMarkerFunction` class and before `TestPriceLineDataclass`.

---

### 4.1 `TestMarkerIdAndPrice` — new properties on `Marker` and `marker()`

```text
class TestMarkerIdAndPrice(unittest.TestCase):
    """Tests for the new 'id' and 'price' fields on Marker."""

    def test_id_default_is_none(self):
        m = Marker(time="2024-01-01")
        self.assertIsNone(m.id)

    def test_price_default_is_none(self):
        m = Marker(time="2024-01-01")
        self.assertIsNone(m.price)

    def test_id_not_emitted_when_none(self):
        m = Marker(time="2024-01-01")
        d = m.to_dict()
        self.assertNotIn("id", d)

    def test_price_not_emitted_when_none(self):
        m = Marker(time="2024-01-01")
        d = m.to_dict()
        self.assertNotIn("price", d)

    def test_id_emitted_when_set(self):
        m = Marker(time="2024-01-01", id="marker-42")
        d = m.to_dict()
        self.assertEqual(d["id"], "marker-42")

    def test_price_emitted_when_set(self):
        m = Marker(time="2024-01-01", position="atPriceTop", price=150.5)
        d = m.to_dict()
        self.assertEqual(d["price"], 150.5)

    def test_factory_id_param(self):
        m = marker(time="t", id="sig-001")
        self.assertEqual(m.id, "sig-001")
        self.assertEqual(m.to_dict()["id"], "sig-001")

    def test_factory_price_param(self):
        m = marker(time="t", position="at_price_top", price=200.0)
        self.assertEqual(m.price, 200.0)
        self.assertEqual(m.to_dict()["price"], 200.0)

    def test_factory_id_and_price_together(self):
        m = marker(
            time="2024-06-01",
            position="at_price_middle",
            price=175.25,
            id="signal-x",
            color="orange",
            text="Mid",
        )
        d = m.to_dict()
        self.assertEqual(d["id"], "signal-x")
        self.assertEqual(d["price"], 175.25)
        self.assertEqual(d["position"], "atPriceMiddle")
```

---

### 4.2 `TestPriceBasedPositions` — the three new positions

```text
class TestPriceBasedPositions(unittest.TestCase):
    """Tests for atPriceTop, atPriceBottom, atPriceMiddle positions."""

    def test_at_price_top_mapping(self):
        m = marker(time="t", position="at_price_top", price=100.0)
        self.assertEqual(m.position, "atPriceTop")

    def test_at_price_bottom_mapping(self):
        m = marker(time="t", position="at_price_bottom", price=100.0)
        self.assertEqual(m.position, "atPriceBottom")

    def test_at_price_middle_mapping(self):
        m = marker(time="t", position="at_price_middle", price=100.0)
        self.assertEqual(m.position, "atPriceMiddle")

    def test_at_price_top_in_position_map(self):
        from deephaven.plot.tradingview_lightweight.options import MARKER_POSITION_MAP
        self.assertEqual(MARKER_POSITION_MAP["at_price_top"], "atPriceTop")
        self.assertEqual(MARKER_POSITION_MAP["at_price_bottom"], "atPriceBottom")
        self.assertEqual(MARKER_POSITION_MAP["at_price_middle"], "atPriceMiddle")

    def test_price_position_without_price_raises(self):
        """Using a price-based position without price= must raise ValueError."""
        with self.assertRaises(ValueError):
            Marker(time="t", position="atPriceTop")

    def test_price_position_without_price_raises_via_factory(self):
        with self.assertRaises(ValueError):
            marker(time="t", position="at_price_top")  # no price=

    def test_bar_position_without_price_is_fine(self):
        """Bar positions do not require price."""
        m = marker(time="t", position="above_bar")
        self.assertIsNone(m.price)

    def test_price_serialized_for_price_position(self):
        m = marker(time="2024-01-15", position="at_price_bottom", price=99.5)
        d = m.to_dict()
        self.assertEqual(d["position"], "atPriceBottom")
        self.assertEqual(d["price"], 99.5)

    def test_all_six_positions_map_correctly(self):
        from deephaven.plot.tradingview_lightweight.options import MARKER_POSITION_MAP
        expected = {
            "above_bar":       "aboveBar",
            "below_bar":       "belowBar",
            "in_bar":          "inBar",
            "at_price_top":    "atPriceTop",
            "at_price_bottom": "atPriceBottom",
            "at_price_middle": "atPriceMiddle",
        }
        self.assertEqual(MARKER_POSITION_MAP, expected)
```

---

### 4.3 `TestUpDownMarkers` — the new factory

```text
from deephaven.plot.tradingview_lightweight.markers import up_down_markers

class TestUpDownMarkers(unittest.TestCase):
    """Tests for the up_down_markers() convenience factory."""

    def test_returns_list_of_markers(self):
        result = up_down_markers(["2024-01-01"], ["2024-01-02"])
        self.assertIsInstance(result, list)
        self.assertTrue(all(isinstance(m, Marker) for m in result))

    def test_total_count(self):
        result = up_down_markers(["t1", "t2", "t3"], ["t4"])
        self.assertEqual(len(result), 4)

    def test_up_marker_defaults(self):
        result = up_down_markers(["t1"], [])
        m = result[0]
        self.assertEqual(m.position, "belowBar")
        self.assertEqual(m.shape, "arrowUp")
        self.assertEqual(m.color, "#26a69a")
        self.assertEqual(m.text, "")
        self.assertIsNone(m.size)

    def test_down_marker_defaults(self):
        result = up_down_markers([], ["t1"])
        m = result[0]
        self.assertEqual(m.position, "aboveBar")
        self.assertEqual(m.shape, "arrowDown")
        self.assertEqual(m.color, "#ef5350")
        self.assertEqual(m.text, "")
        self.assertIsNone(m.size)

    def test_custom_colors(self):
        result = up_down_markers(["t1"], ["t2"], up_color="blue", down_color="orange")
        self.assertEqual(result[0].color, "blue")   # up marker
        self.assertEqual(result[1].color, "orange") # down marker

    def test_custom_text(self):
        result = up_down_markers(["t1"], ["t2"], up_text="Buy", down_text="Sell")
        self.assertEqual(result[0].text, "Buy")
        self.assertEqual(result[1].text, "Sell")

    def test_custom_size(self):
        result = up_down_markers(["t1"], ["t2"], up_size=3, down_size=2)
        self.assertEqual(result[0].size, 3)
        self.assertEqual(result[1].size, 2)

    def test_empty_up_list(self):
        result = up_down_markers([], ["t1", "t2"])
        self.assertEqual(len(result), 2)
        self.assertTrue(all(m.shape == "arrowDown" for m in result))

    def test_empty_down_list(self):
        result = up_down_markers(["t1", "t2"], [])
        self.assertEqual(len(result), 2)
        self.assertTrue(all(m.shape == "arrowUp" for m in result))

    def test_empty_both(self):
        result = up_down_markers([], [])
        self.assertEqual(result, [])

    def test_time_values_preserved(self):
        result = up_down_markers(["2024-01-01", 1704067200], ["2024-02-01"])
        self.assertEqual(result[0].time, "2024-01-01")
        self.assertEqual(result[1].time, 1704067200)
        self.assertEqual(result[2].time, "2024-02-01")

    def test_ordering_up_then_down(self):
        """Up markers are first in the returned list."""
        result = up_down_markers(["u1", "u2"], ["d1"])
        self.assertEqual(result[0].shape, "arrowUp")
        self.assertEqual(result[1].shape, "arrowUp")
        self.assertEqual(result[2].shape, "arrowDown")

    def test_serializes_correctly_in_series(self):
        """Combined list can be attached to a series and serializes cleanly."""
        from deephaven.plot.tradingview_lightweight.series import candlestick_series
        table = MagicMock(name="table")
        markers = up_down_markers(["2024-01-05"], ["2024-01-10"])
        spec = candlestick_series(table, markers=markers)
        d = spec.to_dict("s0", 0)
        self.assertEqual(len(d["markers"]), 2)
        self.assertEqual(d["markers"][0]["shape"], "arrowUp")
        self.assertEqual(d["markers"][0]["position"], "belowBar")
        self.assertEqual(d["markers"][1]["shape"], "arrowDown")
        self.assertEqual(d["markers"][1]["position"], "aboveBar")
```

---

### 4.4 `TestMarkerSpecPriceAndId` — new `MarkerSpec` fields

```text
class TestMarkerSpecPriceAndId(unittest.TestCase):
    """Tests for price, price_column, and id_column on MarkerSpec."""

    def test_price_default_is_none(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table)
        self.assertIsNone(spec.price)

    def test_price_column_default_is_none(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table)
        self.assertIsNone(spec.price_column)

    def test_id_column_default_is_none(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table)
        self.assertIsNone(spec.id_column)

    def test_static_price_in_defaults(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table, price=123.45)
        d = spec.to_dict(table_id=0)
        self.assertEqual(d["defaults"]["price"], 123.45)
        self.assertNotIn("price", d["columns"])

    def test_price_not_in_defaults_when_none(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table)
        d = spec.to_dict(table_id=0)
        self.assertNotIn("price", d["defaults"])

    def test_price_column_in_columns(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table, price_column="BidPrice")
        d = spec.to_dict(table_id=0)
        self.assertEqual(d["columns"]["price"], "BidPrice")
        self.assertNotIn("price", d["defaults"])

    def test_id_column_in_columns(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table, id_column="MarkerId")
        d = spec.to_dict(table_id=0)
        self.assertEqual(d["columns"]["id"], "MarkerId")

    def test_price_and_price_column_raises(self):
        table = MagicMock(name="table")
        with self.assertRaises(ValueError):
            MarkerSpec(table=table, price=100.0, price_column="PriceCol")

    def test_get_columns_includes_price_column(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table, time="T", price_column="Px")
        cols = spec.get_columns()
        self.assertIn("Px", cols)

    def test_get_columns_includes_id_column(self):
        table = MagicMock(name="table")
        spec = MarkerSpec(table=table, time="T", id_column="Mid")
        cols = spec.get_columns()
        self.assertIn("Mid", cols)

    def test_markers_from_table_price_param(self):
        table = MagicMock(name="table")
        spec = markers_from_table(table, price=99.0)
        self.assertEqual(spec.price, 99.0)

    def test_markers_from_table_price_column(self):
        table = MagicMock(name="table")
        spec = markers_from_table(table, price_column="AskPrice")
        self.assertEqual(spec.price_column, "AskPrice")

    def test_markers_from_table_id_column(self):
        table = MagicMock(name="table")
        spec = markers_from_table(table, id_column="EventId")
        self.assertEqual(spec.id_column, "EventId")
```

---

### 4.5 Update existing tests that check `TestMarkerDataclass.test_defaults`

The `test_defaults` test in `TestMarkerDataclass` must be extended to assert the new defaults:

```text
def test_defaults(self):
    m = Marker(time="2024-01-01")
    self.assertEqual(m.time, "2024-01-01")
    self.assertEqual(m.position, "aboveBar")
    self.assertEqual(m.shape, "circle")
    self.assertEqual(m.color, "#2196F3")
    self.assertEqual(m.text, "")
    self.assertIsNone(m.size)
    self.assertIsNone(m.id)      # NEW assertion
    self.assertIsNone(m.price)   # NEW assertion
```

Similarly update `TestMarkerFunction.test_defaults`:

```text
def test_defaults(self):
    m = marker(time="2024-01-01")
    ...
    self.assertIsNone(m.size)
    self.assertIsNone(m.id)      # NEW
    self.assertIsNone(m.price)   # NEW
```

---

## 5. Code Examples (for Docstrings / User Documentation)

### Using `id` for hover identification

```text
import deephaven.plot.tradingview_lightweight as tvl

markers = [
    tvl.marker(time="2024-01-10", position="above_bar", shape="arrow_down",
               color="red", text="Sell", id="sell-001"),
    tvl.marker(time="2024-01-15", position="below_bar", shape="arrow_up",
               color="green", text="Buy", id="buy-001"),
]
chart = tvl.candlestick(data_table, markers=markers)
```

### Using price-based positions

```text
# Pin a marker to a specific price level (e.g. a support break)
m = tvl.marker(
    time="2024-03-01",
    position="at_price_bottom",  # marker sits at the bottom edge of the price label
    price=145.0,                 # Y position on the chart
    shape="circle",
    color="purple",
    text="Support Break",
)
chart = tvl.line(price_table, markers=[m])
```

### Using `up_down_markers()` convenience helper

```text
# Two lists of signal timestamps
buy_signals  = ["2024-01-05", "2024-01-22", "2024-02-10"]
sell_signals = ["2024-01-15", "2024-02-05"]

markers = tvl.up_down_markers(
    up_times=buy_signals,
    down_times=sell_signals,
    up_color="#26a69a",    # teal
    down_color="#ef5350",  # red
    up_text="Buy",
    down_text="Sell",
)
chart = tvl.candlestick(ohlc_table, markers=markers)
```

### Using `markers_from_table()` with price-based positions

```text
# A table with columns: Timestamp, Price, Label
# All rows use "at_price_middle" — Price column sets Y coordinate per row.
ms = tvl.markers_from_table(
    signal_table,
    time="Timestamp",
    position="at_price_middle",
    price_column="Price",        # per-row Y coordinate
    text_column="Label",
    color="#ff9800",
    shape="circle",
)
chart = tvl.line(price_table, marker_spec=ms)
```

### Using `markers_from_table()` with id column

```text
ms = tvl.markers_from_table(
    signal_table,
    time="Timestamp",
    id_column="SignalId",    # each row gets a unique id for JS hover events
    text_column="Label",
    color_column="Color",
)
chart = tvl.candlestick(ohlc_table, marker_spec=ms)
```

---

## 6. Summary of All Changes

| File | Change |
|------|--------|
| `options.py` | Add `"at_price_top"`, `"at_price_bottom"`, `"at_price_middle"` to `MarkerPosition` Literal and `MARKER_POSITION_MAP` |
| `markers.py` | Add `id: Optional[str]` and `price: Optional[float]` to `Marker` dataclass |
| `markers.py` | Add `__post_init__` validation on `Marker` (price required for price-based positions) |
| `markers.py` | Update `Marker.to_dict()` to emit `id` and `price` when not `None` |
| `markers.py` | Add `id` and `price` params to `marker()` factory |
| `markers.py` | Add `price: Optional[float]`, `price_column: Optional[str]`, `id_column: Optional[str]` to `MarkerSpec` |
| `markers.py` | Add `__post_init__` validation on `MarkerSpec` (price and price_column mutually exclusive) |
| `markers.py` | Update `MarkerSpec.get_columns()` to include `id_column` and `price_column` |
| `markers.py` | Update `MarkerSpec.to_dict()` to emit `id` / `price` in `columns` and `defaults` |
| `markers.py` | Add `price`, `price_column`, `id_column` params to `markers_from_table()` |
| `markers.py` | Add new `up_down_markers()` public function |
| `__init__.py` | Export `up_down_markers` |
| `test_markers.py` | Add `TestMarkerIdAndPrice`, `TestPriceBasedPositions`, `TestUpDownMarkers`, `TestMarkerSpecPriceAndId` |
| `test_markers.py` | Update `TestMarkerDataclass.test_defaults` and `TestMarkerFunction.test_defaults` |

---

## 7. Implementation Order

Execute the steps in this order to keep the test suite green at each step:

1. **`options.py`** — add the three new position strings. Existing tests pass unchanged; no new behaviour yet.
2. **`markers.py` — `Marker` dataclass** — add `id`, `price`, `__post_init__`, update `to_dict()`. Run `test_markers.py`; existing tests still pass, update the two `test_defaults` assertions.
3. **`markers.py` — `marker()` factory** — add `id` and `price` params. All existing tests pass.
4. **New test class `TestPriceBasedPositions`** — add and run; all should pass now.
5. **New test class `TestMarkerIdAndPrice`** — add and run; all should pass now.
6. **`markers.py` — `MarkerSpec` + `markers_from_table()`** — add new fields, validation, update `get_columns()` and `to_dict()`.
7. **New test class `TestMarkerSpecPriceAndId`** — add and run.
8. **`markers.py` — `up_down_markers()`** — add the new factory function.
9. **`__init__.py`** — export `up_down_markers`.
10. **New test class `TestUpDownMarkers`** — add and run.
11. **Full test suite** — `python -m pytest test/ -v` to confirm no regressions.
