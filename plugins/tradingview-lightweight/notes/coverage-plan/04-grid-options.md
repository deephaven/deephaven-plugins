# Coverage Status: GridOptions

**Coverage report section:** §4 GridOptions
**Status:** COMPLETE — 6/6 properties implemented (100%)
**Action required:** NO CHANGES NEEDED

---

## Current State

All `GridOptions` and `GridLineOptions` properties are fully implemented in
`src/deephaven/plot/tradingview_lightweight/chart.py` (lines 326–347).

The `chart()` function builds `vertLines` and `horzLines` sub-dicts and emits
them under `chart_options["grid"]`.

---

## Property Map

### `GridOptions.vertLines` → `GridLineOptions`

| JS Property | Python Parameter | Type |
|---|---|---|
| `vertLines.color` | `vert_lines_color` | `Optional[str]` |
| `vertLines.style` | `vert_lines_style` | `Optional[LineStyle]` |
| `vertLines.visible` | `vert_lines_visible` | `Optional[bool]` |

### `GridOptions.horzLines` → `GridLineOptions`

| JS Property | Python Parameter | Type |
|---|---|---|
| `horzLines.color` | `horz_lines_color` | `Optional[str]` |
| `horzLines.style` | `horz_lines_style` | `Optional[LineStyle]` |
| `horzLines.visible` | `horz_lines_visible` | `Optional[bool]` |

`LineStyle` values are translated through `LINE_STYLE_MAP` before serialization
to match the integer constants expected by the JS library.

---

## Potential Improvements (Optional / Low Priority)

- **Color validation:** `vert_lines_color` and `horz_lines_color` accept any
  `str` and are passed through to JS without validation. A lightweight CSS color
  check (or a note in the docstring) could improve error messages for invalid
  values, but is consistent with how other color params (`background_color`,
  `text_color`, etc.) are handled elsewhere in `chart.py`. Not worth changing
  in isolation.

- **`LineStyle` type annotation enforcement:** The `LineStyle` type is enforced
  only at static-analysis time (mypy/pyright). Invalid runtime values would
  silently produce `None` via `LINE_STYLE_MAP.get(...)` and be dropped by
  `_filter_none`. A `ValueError` guard could be added, but again this matches
  the pattern used by `vert_lines_style` and every other `LineStyle` param in
  the file. If addressed, it should be done globally across all style params,
  not just the grid ones.

---

## Files

- **Implementation:** `src/deephaven/plot/tradingview_lightweight/chart.py` (lines 175–181, 326–347)
- **Type definitions:** `src/deephaven/plot/tradingview_lightweight/options.py` (`LineStyle`, `LINE_STYLE_MAP`)
