# Implementation Plan: PriceLineOptions Missing Coverage

**Coverage report section:** §20 PriceLineOptions, §21 IPriceLine Interface
**Current score:** 6/10
**Target score:** 10/10
**Affected file (primary):** `src/deephaven/plot/tradingview_lightweight/markers.py`
**Test file:** `test/deephaven/plot/tradingview_lightweight/test_markers.py`

---

## 1. Current State

### 1.1 What Exists

`PriceLine` is a dataclass in `markers.py`. It is instantiated via the `price_line()` factory function. Both are already exported from the package.

**Current `PriceLine` dataclass (lines 43–81 of `markers.py`):**

```text
@dataclass
class PriceLine:
    """A horizontal price line on a series.

    Provide either a static ``price`` or a ``column`` name.  When
    ``column`` is set the price line tracks the last-row value of that
    column in the series' data table (updated live as the table ticks).
    """

    price: Optional[float] = None
    column: Optional[str] = None
    color: Optional[str] = None
    line_width: Optional[int] = None
    line_style: Optional[str] = None
    axis_label_visible: Optional[bool] = None
    title: Optional[str] = None

    def __post_init__(self) -> None:
        if self.price is None and self.column is None:
            raise ValueError("Either 'price' or 'column' must be provided")
        if self.price is not None and self.column is not None:
            raise ValueError("Cannot specify both 'price' and 'column'")

    def to_dict(self) -> dict:
        result: dict = {}
        if self.price is not None:
            result["price"] = self.price
        if self.column is not None:
            result["column"] = self.column
        if self.color is not None:
            result["color"] = self.color
        if self.line_width is not None:
            result["lineWidth"] = self.line_width
        if self.line_style is not None:
            result["lineStyle"] = LINE_STYLE_MAP.get(self.line_style, 0)
        if self.axis_label_visible is not None:
            result["axisLabelVisible"] = self.axis_label_visible
        if self.title is not None:
            result["title"] = self.title
        return result
```

**Current `price_line()` factory (lines 175–197 of `markers.py`):**

```text
def price_line(
    price: Optional[float] = None,
    color: Optional[str] = None,
    line_width: Optional[int] = None,
    line_style: Optional[LineStyle] = None,
    axis_label_visible: Optional[bool] = None,
    title: Optional[str] = None,
    column: Optional[str] = None,
) -> PriceLine:
    """Create a horizontal price line on a series.

    Provide either ``price`` (static value) or ``column`` (dynamic,
    tracks the last-row value of the named column in the series' table).
    """
    return PriceLine(
        price=price,
        column=column,
        color=color,
        line_width=line_width,
        line_style=line_style,
        axis_label_visible=axis_label_visible,
        title=title,
    )
```

### 1.2 Coverage Gap Summary

| JS Property | Python Field | Status |
|---|---|:---:|
| `id` | — | Missing |
| `price` | `price` | Implemented |
| `color` | `color` | Implemented |
| `lineWidth` | `line_width` | Implemented |
| `lineStyle` | `line_style` | Implemented |
| `lineVisible` | — | Missing |
| `axisLabelVisible` | `axis_label_visible` | Implemented |
| `title` | `title` | Implemented |
| `axisLabelColor` | — | Missing |
| `axisLabelTextColor` | — | Missing |

**Also noted in coverage report §5 (CrosshairOptions):** `labelBackgroundColor` is already implemented for crosshair lines under different names (`crosshair_vert_line_label_background_color` / `crosshair_horz_line_label_background_color`). The coverage report does not flag a `labelBackgroundColor` on `PriceLineOptions` specifically — the `axisLabelColor` JS field serves that role for price lines and is already listed in the gap table above.

### 1.3 Deephaven Extension: `column` Field

The `column` field is not part of the upstream `PriceLineOptions` interface. It is a Deephaven-specific extension enabling *dynamic* price lines: when `column` is set, the JS frontend reads the last row of the named column from the series' data table and updates the price line's `price` position whenever the table ticks. This is mutually exclusive with the static `price` field. The `__post_init__` validator enforces the mutual exclusion at construction time.

The `column` key is serialized directly into the JSON payload; the JS frontend handles it. No changes are needed for this extension — it must be preserved and must continue to work alongside any new fields added in this plan.

---

## 2. Missing Fields — Detailed Specification

### 2.1 `id` (JS: `id?`, type `string`, optional)

**Purpose:** An optional string identifier for the price line. Useful when the caller wants to distinguish price lines by ID (e.g., for logging, filtering, or future update logic). In the Python layer this is static configuration — the ID is just passed through to JS.

**Python name:** `id` (direct match; no mapping needed; it is a plain string, not an enum)

**Serialization key:** `"id"` (emitted only when not `None`)

**Validation:** None required. Any `str` value is valid. Empty string `""` is a valid value (TV-LW accepts it).

**Default:** `None` (not emitted, TV-LW treats absence as no ID)

**Type annotation:** `Optional[str]`

**Note on naming collision with Python built-in:** The field name `id` shadows the Python built-in `id()` function within the dataclass body, but this is harmless — dataclass fields are accessed via `self.id`, not as a bare name. The factory parameter named `id` also shadows the built-in within the function body but only the parameter itself is referenced, so this is safe. (If this is considered too confusing, `line_id` is an acceptable alternative name — map it to `"id"` in `to_dict()`. The original JS name `id` is preferred since it is unambiguous in context.)

### 2.2 `lineVisible` (JS: `lineVisible`, type `boolean`, default `true`)

**Purpose:** Controls whether the horizontal line itself is drawn. Setting to `False` hides the line while still showing the axis label (if `axis_label_visible` is `True`). This allows a labeled price level without a visible horizontal rule.

**Python name:** `line_visible` (snake_case convention, consistent with `line_width`, `line_style`, `axis_label_visible`)

**Serialization key:** `"lineVisible"`

**Validation:** None required. Any `bool` value is valid.

**Default:** `None` (not emitted; TV-LW defaults to `True`)

**Type annotation:** `Optional[bool]`

### 2.3 `axisLabelColor` (JS: `axisLabelColor`, type `string`, default `''`)

**Purpose:** Sets the background color of the price-scale axis label for this price line. When empty string or absent, TV-LW inherits the `color` of the line itself. Setting an explicit value overrides the label background independently of the line color.

**Python name:** `axis_label_color` (snake_case)

**Serialization key:** `"axisLabelColor"`

**Validation:** None required. Any `str` value (CSS color string) is valid.

**Default:** `None` (not emitted; TV-LW defaults to `''`, which means inherit from `color`)

**Type annotation:** `Optional[str]`

### 2.4 `axisLabelTextColor` (JS: `axisLabelTextColor`, type `string`, default `''`)

**Purpose:** Sets the text color of the price-scale axis label. When empty string or absent, TV-LW uses its internal theme default for label text. Setting an explicit value overrides it.

**Python name:** `axis_label_text_color` (snake_case)

**Serialization key:** `"axisLabelTextColor"`

**Validation:** None required. Any `str` value (CSS color string) is valid.

**Default:** `None` (not emitted; TV-LW defaults to `''`)

**Type annotation:** `Optional[str]`

---

## 3. Code Changes Required

### 3.1 `PriceLine` Dataclass — Updated Version

Replace the entire `PriceLine` dataclass in `markers.py` with the following. Only new fields are added; no existing fields are removed or renamed.

```text
@dataclass
class PriceLine:
    """A horizontal price line on a series.

    Provide either a static ``price`` or a ``column`` name.  When
    ``column`` is set the price line tracks the last-row value of that
    column in the series' data table (updated live as the table ticks).

    Parameters
    ----------
    price:
        Static price level.  Mutually exclusive with ``column``.
    column:
        Deephaven extension — column name in the series' data table whose
        last-row value sets the price level dynamically.  Mutually
        exclusive with ``price``.
    color:
        Line color (CSS color string).  Also used as the axis label
        background color unless ``axis_label_color`` is set explicitly.
    line_width:
        Line thickness in pixels (1–4).
    line_style:
        One of ``"solid"``, ``"dotted"``, ``"dashed"``,
        ``"large_dashed"``, ``"sparse_dotted"``.
    line_visible:
        Whether the horizontal line rule is drawn.  The axis label can
        still be shown even when ``line_visible=False``.
    axis_label_visible:
        Whether the axis label is shown on the price scale.
    title:
        Short text label drawn on the chart pane next to the line.
    axis_label_color:
        Background color of the price-scale axis label.  Defaults to
        the line ``color`` when not set.
    axis_label_text_color:
        Text color of the price-scale axis label.
    id:
        Optional string identifier for the price line.
    """

    price: Optional[float] = None
    column: Optional[str] = None
    color: Optional[str] = None
    line_width: Optional[int] = None
    line_style: Optional[str] = None
    line_visible: Optional[bool] = None
    axis_label_visible: Optional[bool] = None
    title: Optional[str] = None
    axis_label_color: Optional[str] = None
    axis_label_text_color: Optional[str] = None
    id: Optional[str] = None

    def __post_init__(self) -> None:
        if self.price is None and self.column is None:
            raise ValueError("Either 'price' or 'column' must be provided")
        if self.price is not None and self.column is not None:
            raise ValueError("Cannot specify both 'price' and 'column'")

    def to_dict(self) -> dict:
        result: dict = {}
        if self.id is not None:
            result["id"] = self.id
        if self.price is not None:
            result["price"] = self.price
        if self.column is not None:
            result["column"] = self.column
        if self.color is not None:
            result["color"] = self.color
        if self.line_width is not None:
            result["lineWidth"] = self.line_width
        if self.line_style is not None:
            result["lineStyle"] = LINE_STYLE_MAP.get(self.line_style, 0)
        if self.line_visible is not None:
            result["lineVisible"] = self.line_visible
        if self.axis_label_visible is not None:
            result["axisLabelVisible"] = self.axis_label_visible
        if self.title is not None:
            result["title"] = self.title
        if self.axis_label_color is not None:
            result["axisLabelColor"] = self.axis_label_color
        if self.axis_label_text_color is not None:
            result["axisLabelTextColor"] = self.axis_label_text_color
        return result
```

**Key notes for the implementer:**
- Field order in the dataclass does not affect serialization. The order chosen above puts the new fields after the existing ones, minimizing diff noise and avoiding breaking any positional construction calls (though all fields are keyword-only in practice due to all having defaults).
- `to_dict()` emits `"id"` first in the result dict; this matches the JS interface ordering and is a minor style choice — any order is functionally correct.
- The `__post_init__` validator is unchanged. The `id`, `line_visible`, `axis_label_color`, and `axis_label_text_color` fields are independent of the `price`/`column` exclusivity constraint.

### 3.2 `price_line()` Factory — Updated Version

Replace the `price_line()` function in `markers.py` with the following:

```text
def price_line(
    price: Optional[float] = None,
    color: Optional[str] = None,
    line_width: Optional[int] = None,
    line_style: Optional[LineStyle] = None,
    line_visible: Optional[bool] = None,
    axis_label_visible: Optional[bool] = None,
    title: Optional[str] = None,
    axis_label_color: Optional[str] = None,
    axis_label_text_color: Optional[str] = None,
    id: Optional[str] = None,
    column: Optional[str] = None,
) -> PriceLine:
    """Create a horizontal price line on a series.

    Provide either ``price`` (static value) or ``column`` (dynamic,
    tracks the last-row value of the named column in the series' table).

    Parameters
    ----------
    price:
        Static price level.  Mutually exclusive with ``column``.
    color:
        Line color (CSS color string).
    line_width:
        Line thickness in pixels (1–4).
    line_style:
        One of ``"solid"``, ``"dotted"``, ``"dashed"``,
        ``"large_dashed"``, ``"sparse_dotted"``.
    line_visible:
        Whether the horizontal line rule is drawn (default ``True`` in
        TV-LW).  Set to ``False`` to show only the axis label.
    axis_label_visible:
        Whether the axis label is shown on the price scale.
    title:
        Short text drawn on the chart pane next to the line.
    axis_label_color:
        Background color of the price-scale axis label.
    axis_label_text_color:
        Text color of the price-scale axis label.
    id:
        Optional string identifier for the price line.
    column:
        Deephaven extension — column name whose last-row value sets the
        price level dynamically.  Mutually exclusive with ``price``.
    """
    return PriceLine(
        price=price,
        column=column,
        color=color,
        line_width=line_width,
        line_style=line_style,
        line_visible=line_visible,
        axis_label_visible=axis_label_visible,
        title=title,
        axis_label_color=axis_label_color,
        axis_label_text_color=axis_label_text_color,
        id=id,
    )
```

**Key notes for the implementer:**
- Existing parameter ordering for `price`, `color`, `line_width`, `line_style`, `axis_label_visible`, `title`, and `column` is preserved at the same relative positions (new params inserted after `line_style`, before `column`). This matters for any callers passing positional arguments — though the public API conventions of this codebase use keyword arguments throughout.
- The `column` parameter stays at the end of the signature (as it was before) to avoid shifting any existing keyword-only callers.
- No default value changes for existing parameters.

### 3.3 No Changes Required Elsewhere

- `series.py` — `SeriesSpec.to_dict()` calls `pl.to_dict()` for each price line; the new fields flow through automatically.
- `options.py` — No new enum or map is needed. `id`, `line_visible`, `axis_label_color`, and `axis_label_text_color` are all plain types (str, bool, str, str) requiring no translation.
- `__init__.py` / public exports — `PriceLine` and `price_line` are already exported. No changes needed.
- JS frontend — The new fields (`id`, `lineVisible`, `axisLabelColor`, `axisLabelTextColor`) are native `PriceLineOptions` properties already understood by TV-LW v5.1. The Python layer simply serializes them; no JS changes are needed.

---

## 4. Test Coverage

All tests belong in `test/deephaven/plot/tradingview_lightweight/test_markers.py`.

### 4.1 Extend `TestPriceLineDataclass`

Add the following test methods to the existing `TestPriceLineDataclass` class:

**Test: new fields default to `None`**

```text
def test_new_fields_default_to_none(self):
    """New fields must default to None (not emitted in to_dict)."""
    pl = PriceLine(price=100.0)
    self.assertIsNone(pl.id)
    self.assertIsNone(pl.line_visible)
    self.assertIsNone(pl.axis_label_color)
    self.assertIsNone(pl.axis_label_text_color)
```

**Test: new fields not in `to_dict()` when `None`**

```text
def test_new_fields_absent_from_dict_when_none(self):
    """to_dict() must not emit new keys when their values are None."""
    pl = PriceLine(price=100.0)
    d = pl.to_dict()
    self.assertNotIn("id", d)
    self.assertNotIn("lineVisible", d)
    self.assertNotIn("axisLabelColor", d)
    self.assertNotIn("axisLabelTextColor", d)
```

**Test: `id` field**

```text
def test_id_field(self):
    pl = PriceLine(price=100.0, id="support-1")
    self.assertEqual(pl.id, "support-1")
    d = pl.to_dict()
    self.assertEqual(d["id"], "support-1")


def test_id_empty_string(self):
    """Empty string id should be emitted (it is a valid non-None value)."""
    pl = PriceLine(price=100.0, id="")
    d = pl.to_dict()
    self.assertIn("id", d)
    self.assertEqual(d["id"], "")
```

**Test: `line_visible` field**

```text
def test_line_visible_true(self):
    pl = PriceLine(price=100.0, line_visible=True)
    d = pl.to_dict()
    self.assertTrue(d["lineVisible"])


def test_line_visible_false(self):
    pl = PriceLine(price=100.0, line_visible=False)
    d = pl.to_dict()
    self.assertFalse(d["lineVisible"])


def test_line_visible_hidden_with_label_shown(self):
    """Typical use: hide line rule but keep axis label."""
    pl = PriceLine(price=200.0, line_visible=False, axis_label_visible=True)
    d = pl.to_dict()
    self.assertFalse(d["lineVisible"])
    self.assertTrue(d["axisLabelVisible"])
```

**Test: `axis_label_color` field**

```text
def test_axis_label_color(self):
    pl = PriceLine(price=100.0, axis_label_color="#FF0000")
    d = pl.to_dict()
    self.assertEqual(d["axisLabelColor"], "#FF0000")


def test_axis_label_color_independent_of_line_color(self):
    """axis_label_color and color are independent fields."""
    pl = PriceLine(price=100.0, color="blue", axis_label_color="red")
    d = pl.to_dict()
    self.assertEqual(d["color"], "blue")
    self.assertEqual(d["axisLabelColor"], "red")
```

**Test: `axis_label_text_color` field**

```text
def test_axis_label_text_color(self):
    pl = PriceLine(price=100.0, axis_label_text_color="#FFFFFF")
    d = pl.to_dict()
    self.assertEqual(d["axisLabelTextColor"], "#FFFFFF")


def test_axis_label_colors_together(self):
    """Both label color fields can be set independently."""
    pl = PriceLine(
        price=100.0,
        axis_label_color="#333333",
        axis_label_text_color="#EEEEEE",
    )
    d = pl.to_dict()
    self.assertEqual(d["axisLabelColor"], "#333333")
    self.assertEqual(d["axisLabelTextColor"], "#EEEEEE")
```

**Test: full `to_dict()` with all fields set**

```text
def test_to_dict_all_new_and_existing_fields(self):
    """All 10 JS PriceLineOptions properties should serialize correctly."""
    pl = PriceLine(
        price=150.0,
        id="target",
        color="#0000FF",
        line_width=2,
        line_style="dashed",
        line_visible=True,
        axis_label_visible=True,
        title="Target",
        axis_label_color="#0000FF",
        axis_label_text_color="#FFFFFF",
    )
    d = pl.to_dict()
    self.assertEqual(d["id"], "target")
    self.assertEqual(d["price"], 150.0)
    self.assertEqual(d["color"], "#0000FF")
    self.assertEqual(d["lineWidth"], 2)
    self.assertEqual(d["lineStyle"], 2)  # dashed -> 2
    self.assertTrue(d["lineVisible"])
    self.assertTrue(d["axisLabelVisible"])
    self.assertEqual(d["title"], "Target")
    self.assertEqual(d["axisLabelColor"], "#0000FF")
    self.assertEqual(d["axisLabelTextColor"], "#FFFFFF")
```

### 4.2 Extend `TestPriceLineFunction`

Add the following test methods to the existing `TestPriceLineFunction` class:

**Test: new params default to `None`**

```text
def test_new_params_default_to_none(self):
    pl = price_line(price=100.0)
    self.assertIsNone(pl.id)
    self.assertIsNone(pl.line_visible)
    self.assertIsNone(pl.axis_label_color)
    self.assertIsNone(pl.axis_label_text_color)
```

**Test: all new params pass through correctly**

```text
def test_new_params_pass_through(self):
    pl = price_line(
        price=100.0,
        id="resistance",
        line_visible=False,
        axis_label_color="#FF0000",
        axis_label_text_color="#FFFFFF",
    )
    self.assertEqual(pl.id, "resistance")
    self.assertFalse(pl.line_visible)
    self.assertEqual(pl.axis_label_color, "#FF0000")
    self.assertEqual(pl.axis_label_text_color, "#FFFFFF")


def test_new_params_serialized(self):
    pl = price_line(
        price=100.0,
        id="resistance",
        line_visible=False,
        axis_label_color="#FF0000",
        axis_label_text_color="#FFFFFF",
    )
    d = pl.to_dict()
    self.assertEqual(d["id"], "resistance")
    self.assertFalse(d["lineVisible"])
    self.assertEqual(d["axisLabelColor"], "#FF0000")
    self.assertEqual(d["axisLabelTextColor"], "#FFFFFF")
```

**Test: `column` + new fields**

```text
def test_column_with_new_fields(self):
    """Dynamic price line (column=) should work with all new fields."""
    pl = price_line(
        column="AvgClose",
        id="avg-close",
        line_visible=True,
        axis_label_color="green",
        axis_label_text_color="white",
    )
    d = pl.to_dict()
    self.assertEqual(d["column"], "AvgClose")
    self.assertEqual(d["id"], "avg-close")
    self.assertTrue(d["lineVisible"])
    self.assertEqual(d["axisLabelColor"], "green")
    self.assertEqual(d["axisLabelTextColor"], "white")
    self.assertNotIn("price", d)
```

### 4.3 Extend `TestDynamicPriceLine`

Add the following test method to the existing `TestDynamicPriceLine` class:

**Test: dynamic line with new fields round-trips through series serialization**

```text
def test_dynamic_price_line_all_fields_in_series(self):
    from deephaven.plot.tradingview_lightweight.series import line_series

    table = MagicMock(name="table")
    pl = price_line(
        column="Signal",
        id="signal-line",
        color="purple",
        line_visible=False,
        axis_label_color="purple",
        axis_label_text_color="#FFF",
        title="Signal",
    )
    spec = line_series(table, price_lines=[pl])
    result = spec.to_dict("s0", 0)
    pl_dict = result["priceLines"][0]

    self.assertEqual(pl_dict["column"], "Signal")
    self.assertEqual(pl_dict["id"], "signal-line")
    self.assertEqual(pl_dict["color"], "purple")
    self.assertFalse(pl_dict["lineVisible"])
    self.assertEqual(pl_dict["axisLabelColor"], "purple")
    self.assertEqual(pl_dict["axisLabelTextColor"], "#FFF")
    self.assertEqual(pl_dict["title"], "Signal")
    self.assertNotIn("price", pl_dict)
```

### 4.4 Existing Tests — No Changes Required

The following existing tests must continue to pass without modification:

- `TestPriceLineDataclass.test_defaults` — verifies existing fields; new fields with `None` defaults do not appear in `to_dict()` so the assertion `self.assertEqual(d, {"price": 50.0})` in `test_to_dict_minimal` still holds.
- `TestPriceLineDataclass.test_to_dict_partial` — asserts `"lineWidth"` etc. are absent; new fields are also absent by default, so this passes.
- All `TestDynamicPriceLine` tests.
- All `TestMarkerIntegration` tests.

---

## 5. Coverage Report Update

After implementation, update `notes/api-coverage-report.md` section §20 to reflect the new status:

```markdown
## 20. PriceLineOptions

| # | Property | Status | Python Param | Notes |
|---|---|:---:|---|---|
| 1 | `id` | ✅ | `id` | |
| 2 | `price` | ✅ | `price` | Also supports dynamic `column` (Deephaven extension) |
| 3 | `color` | ✅ | `color` | |
| 4 | `lineWidth` | ✅ | `line_width` | |
| 5 | `lineStyle` | ✅ | `line_style` | |
| 6 | `lineVisible` | ✅ | `line_visible` | |
| 7 | `axisLabelVisible` | ✅ | `axis_label_visible` | |
| 8 | `title` | ✅ | `title` | |
| 9 | `axisLabelColor` | ✅ | `axis_label_color` | |
| 10 | `axisLabelTextColor` | ✅ | `axis_label_text_color` | |

**Score: 10/10**
```

---

## 6. Implementation Order

Perform steps in this order to keep the test suite green throughout:

1. **Edit `PriceLine` dataclass** — add the four new fields (`line_visible`, `axis_label_color`, `axis_label_text_color`, `id`) with `Optional[...]` types and `None` defaults. Update `to_dict()` to emit each key when the field is not `None`.

2. **Edit `price_line()` factory** — add the four matching parameters with `None` defaults and pass them through to the `PriceLine` constructor.

3. **Run existing tests** — all existing tests must pass. If any fail, the dataclass field insertion broke something (check field ordering or default logic).

4. **Add new tests** to `test_markers.py` — add all test methods listed in section 4 to their respective test classes.

5. **Run full test suite** to confirm everything passes:
   ```bash
   PY=/home/sandbox/.local/share/uv/python/cpython-3.13.12-linux-x86_64-gnu/bin/python3.13
   $PY -m pytest test/ -v
   ```

6. **Update `api-coverage-report.md`** — change §20 PriceLineOptions score from 6/10 to 10/10 and update the table as shown in section 5 above.

---

## 7. Explicit Non-Goals

- **IPriceLine methods (`applyOptions()`, `options()`)** — marked N/A in the coverage report. The Python layer is a static configuration builder with no live handle on the running chart. These runtime JS methods are not implementable from Python.
- **JS frontend changes** — none required. All four new fields are standard `PriceLineOptions` properties already supported by TV-LW v5.1.
- **New enum or mapping tables** — none needed. `id`, `line_visible`, `axis_label_color`, and `axis_label_text_color` are plain str/bool/str/str types with no enum translation.
- **`series.py` changes** — the `SeriesSpec.to_dict()` method already calls `pl.to_dict()` generically; new fields flow through automatically.
- **Changelog or documentation files** — out of scope for this plan.
