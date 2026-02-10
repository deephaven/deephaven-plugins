# DH-21376 ui.TableFormat Heatmaps

Heatmaps are currently provided through inline string expressions in format_columns(). This is inconsistent with other formatting features that are handled through ui.TableFormat objects passed to the format_ parameter. Databars recently introduced a separate ui.TableFormat.mode parameter that allows structured, extensible formatting by specifying a mode object (see TableDatabar) for each column or set of columns.

The new heatmap API lets you color table cells based on their values, with support for:

- Lives in `ui.TableFormat` alongside databars
- Supports auto min/max, diverging scales, multi-stop gradients, and theme colors
- Interpolates colors client-side in oklab color space

## Design decisions

### 1. Distinguishing between different modes
With `mode` accepting both `TableDatabar` and `TableHeatmap`, the client needs a way to distinguish between them on the wire. We could duck-type based on which fields are present (not ideal especially with all the overlapping fields). Instead, we use an auto-populated `type` discriminator field and the client dispatches on `mode.type`(this is already configured for databars).

### 2. New CellRenderType vs Color Override
I don't think heatmaps should have a custom render type like databars in the sense that for now it just colors cells. Instead of adding a new render type, heatmaps override the existing cell color methods.

We'll also need to define a priority hierarchy for how colors are applied. If a user sets an explicit `color` or `background_color` on a `TableFormat` rule, that should take priority over a heatmap on the same cell. But conditional formatting (`if_`) targeting independent cells should work alongside heatmaps i.e. one applies to a given cell at a time.

### 3. Auto-contrast text color
The old api auto-picks light/dark text based on the background. The new api should do the same (existing cell color logic should handle this already).

### 4. Named Color Scales (Viridis, Plasma, etc.)

Deffer for now. Named color scales are just predefined lists of hex colors that would be passed to the `colors` parameter. The api shape doesn't need to change to support them, we'd just expose constants.

How should name color scales be specified? using strings (e.g., 'viridis') or provide a module of built-in scales organized by type, such as dh.ui.colors.sequential and dh.ui.colors.diverging

### 5. Diverging Scales

Heatmap should accept a `mid` parameter, similar to Plotly's `color_continuous_midpoint`. `mid` should be a data value (not normalized) that always maps to position 0.5 in the color scale. If `mid` is set, the effective range should become symmetric around it:

```
effective_min = mid - max(mid - data_min, data_max - mid)
effective_max = mid + max(mid - data_min, data_max - mid)
```


`mid` defaults to `None` (sequential scale)

Examples:
```python
# PnL centered on zero
ui.TableHeatmap(mid=0, colors=["blue-600", "white", "red-600"])

# Temperature centered on avg_temp
ui.TableHeatmap(mid=avg_temp, colors=["blue-400", "white", "red-400"])
```

### 6.Defaults/Validation

`mid` only affects normalization, not how colors are interpreted. The color scale works identically regardless of whether `mid` is set. The only place the distinction matters is for the default palette heatmap should use. (default for sequential and another for diverging)

When `colors` is provided, it must have at least 2 entries. A single color can't be interpreted as a gradient and should log an error to the console. With 2 colors you get a simple gradient. With 3+ colors the stops are evenly spaced.

```python
# Same interpolation in both cases. Only the normalization differs.
# 3 colors, no mid -> sequential with an intermediate color
colors=["blue-400", "yellow-400", "red-400"]

# 3 colors, mid=0 -> diverging with white at zero
colors=["blue-600", "white", "red-600"], mid=0
```

As mentioned above plain lists of colors are evenly spaced, which should cover most cases. But if a user wants to specify a color at a specific position (e.g. white at 30% instead of 50%), we could accept tuples of the form `(position, color)` for explicit control.

```python
# Evenly spaced -> inferred as 0.0, 0.5, 1.0
colors=["red-500", "yellow-300", "green-500"]

# Explicit
colors=[(0, "blue-600"), (0.3, "white"), (1, "red-600")]
```

## Final API

### Python: `TableHeatmap`

```python
from dataclasses import dataclass, field
from typing import Literal

@dataclass
class TableHeatmap:
    """
    A heatmap configuration for a table.

    args:
        min: Minimum value for the heatmap range.
            Defaults to the column minimum (auto-computed via TotalsTable).
            If a column name is provided, the min is read per-row from that column.
            If a number is provided, it is used as a constant.
        max: Maximum value for the heatmap range.
            Defaults to the column maximum (auto-computed via TotalsTable).
            If a column name is provided, the max is read per-row from that column.
            If a number is provided, it is used as a constant.
        mid: Midpoint data value for diverging color scales.
            When set, the effective range is forced to be symmetric around this
            value, so the center color in the scale always maps to `mid`.
            Defaults to None (sequential scale, no midpoint).
        colors: Color scale stops for the gradient. Must have at least 2 colors.
            Can be specified in two forms:
            - A list of color strings for evenly-spaced stops:
              ["red-500", "yellow-300", "green-500"]
              (inferred as positions 0.0, 0.5, 1.0)
            - A list of (position, color) tuples for explicit positioning:
              [(0, "blue-600"), (0.3, "white"), (1, "red-600")]
              Positions must be in the [0, 1] range.
            Colors can be theme colors ("red-500", "accent"), CSS colors, or hex values.
            Defaults to a theme-aware sequential gradient when ``mid`` is not set,
            or a theme-aware diverging gradient when ``mid`` is set.
        apply_to: Whether to color the cell background or text.
            Defaults to "background".
    """

    type: str = field(default="heatmap", init=False)
    min: ColumnName | float | None = None
    max: ColumnName | float | None = None
    mid: float | None = None
    colors: list[Color] | list[tuple[float, Color]] | None = None
    apply_to: Literal["background", "text"] | None = None
```

Note: Unlike `TableDatabar`, there is no (legacy) `column` field. The target column should always comes from `TableFormat.cols`. This is consistent with how `TableDatabar` works when used as `mode` (where `column` must not be specified).

### Python: Updated `TableFormat`

```python
class TableFormat:
    cols: ColumnName | list[ColumnName] | None = None
    if_: str | None = None
    color: Color | None = None
    background_color: Color | None = None
    alignment: Literal["left", "center", "right"] | None = None
    value: str | None = None
    mode: TableDatabar | TableHeatmap | None = None
```

### TypeScript: `HeatmapConfig`

```typescript
export type ColorStop = [number, string]; // [position, color]

export type HeatmapConfig = {
  type: 'heatmap';
  min?: number | ColumnName;
  max?: number | ColumnName;
  mid?: number; // data value that maps to position 0.5
  colors?: string[] | ColorStop[]; // at least 2; default colors varies by whether mid is specified (sequential vs. diverging)
  apply_to?: 'background' | 'text';
};
```

Note: No `column` field. The column is set by `extractHeatmapsFromFormatRules()` from `FormattingRule.cols`, similar to how `extractDatabarsFromFormatRules()` works.

`DatabarConfig` is unchanged (already has `type: 'databar'`).

```typescript
export type FormattingRule = {
  cols?: ColumnName | ColumnName[];
  if_?: string;
  color?: string;
  background_color?: string;
  alignment?: 'left' | 'center' | 'right';
  value?: string;
  mode?: DatabarConfig | HeatmapConfig;
};
```

## Usage Examples
```python
# Auto min/max, default theme gradient, background coloring
ui.table(students, format_=ui.TableFormat(
    cols="GPA",
    mode=ui.TableHeatmap()
))

# Explicit range with two colors
ui.table(students, format_=ui.TableFormat(
    cols="GPA",
    mode=ui.TableHeatmap(
        min=1.0,
        max=4.0,
        colors=["green-600", "red-600"]
    )
))

# Apply the same heatmap to multiple columns
ui.table(students, format_=ui.TableFormat(
    cols=["TestGrade", "HomeworkGrade"],
    mode=ui.TableHeatmap(colors=["red-500", "green-500"])
))

# Can also specify seperately
ui.table(students, format_=[
    ui.TableFormat(
        cols="GPA",
        mode=ui.TableHeatmap(colors=["red-500", "green-500"])
    ),
    ui.TableFormat(
        cols="TestGrade",
        mode=ui.TableHeatmap(colors=["blue-500", "white", "red-500"])
    ),
])

# Diverging scale centered on zero (range is symmetric around mid and should be inferred by the magnitude of min/max)
ui.table(t, format_=ui.TableFormat(
    cols="PnL",
    mode=ui.TableHeatmap(
        mid=0,
        colors=["red-500", "white", "green-500"]
    )
))

# TableHeatmapFg (I decided on using "text" in place of 'foreground', as it might be misinterpreted as the cell content's general color, which we may want to dissociate from databars, etc)
ui.table(students, format_=ui.TableFormat(
    cols="GPA",
    mode=ui.TableHeatmap(apply_to="text")
))

# Multi-stop sequential gradient
ui.table(t, format_=ui.TableFormat(
    cols="Temperature",
    mode=ui.TableHeatmap(
        colors=["blue-400", "cyan-400", "yellow-400", "red-400"]
    )
))

# Dynamic min/max from other columns
ui.table(t, format_=ui.TableFormat(
    cols="Price",
    mode=ui.TableHeatmap(
        min="PriceFloor",
        max="PriceCeiling"
    )
))

# Custom stop positions (in this example white would sit at 20% instead of the midpoint)
ui.table(t, format_=ui.TableFormat(
    cols="Concentration",
    mode=ui.TableHeatmap(
        colors=[(0, "green-600"), (0.2, "white"), (1, "red-600")]
    )
))

# Conditional
ui.table(students, format_=[
    ui.TableFormat(
        cols="GPA",
        mode=ui.TableHeatmap(colors=["red-500", "green-500"]),
        if_="Year > 2"
    ),
])

# Mixed heatmaps and databars (what if they target the same column? should we display both?)
ui.table(students, format_=[
    ui.TableFormat(
        cols="TestGrade",
        mode=ui.TableDatabar()
    ),
    ui.TableFormat(
        cols="GPA",
        mode=ui.TableHeatmap(colors=["red-500", "white", "green-500"])
    ),
])
```

## Development Plan

1. Add `TableHeatmap` dataclass to `table.py`
   [ ] Add fields: `type`, `min`, `max`, `mid`, `colors`, `apply_to`
   [ ] `type` is auto-populated `"heatmap"`, not user-settable
   [ ] Widen `TableFormat.mode` to accept `TableHeatmap`

2. Add validation in `table.__init__`
   [ ] `colors` must have at least 2 entries when provided
   [ ] `cols` required when `mode` is set (extend existing databar validation)

3. Add `HeatmapConfig` TypeScript type
   [ ] Add type with matching fields
   [ ] Widen `FormattingRule.mode` to accept it

4. Add extraction function for heatmap format rules
   [ ] Mirror the existing databar extraction pattern

5. Extend auto min/max infrastructure for heatmap columns
   [ ] Use separate hidden column suffixes to avoid collisions with databars
   [ ] Add min/max aggregations for heatmap columns

6. Build oklab color interpolation utility

7. Implement value normalization
   [ ] Standard normalization for sequential scales
   [ ] Symmetric range expansion for diverging scales with `mid`
   [ ] Handle edge cases (equal min/max, etc.)

8. Wire heatmap into the table model
   [ ] Return interpolated color from the cell color methods based on `apply_to`
   [ ] Auto-contrast text comes for free via existing logic

9. Select default palettes
   [ ] Sequential default when `mid` is not set
   [ ] Diverging default when `mid` is set
   [ ] Specific colors TBD

10. Add E2E test tables
    [ ] Basic heatmap with auto min/max and default colors
    [ ] Diverging heatmap with `mid=0` on asymmetric data
    [ ] Explicit multi-stop color scale
    [ ] `apply_to="text"` mode
    [ ] Mixed heatmaps and databars on different columns

11. Add Playwright tests
    [ ] Snapshots
    [ ] Theme switching tests (if applicable)

12. Update documentation
    [ ] Add heatmap section to `table.md` with examples
    [ ] Note deprecation of legacy `heatmap()` / `heatmapFg()` with warning

### Testing

#### Automated Tests

[ ] Python unit tests for serialization (various parameter combinations)
[ ] Python unit tests for validation (too few colors, mode without cols etc)
[ ] TypeScript unit tests for heatmap extraction from format rules
[ ] TypeScript unit tests for color interpolation
[ ] TypeScript unit tests for normalization (sequential, diverging, edge cases)
[ ] TypeScript unit tests for default color selection
[ ] E2E screenshot tests for all heatmap test tables
(Should also test theme changes if applicable)

#### Manual Tests

Tests will broadly include the following scenarios:

1. Applying a minimal heatmap and verifying the gradient renders correctly
2. Applying a diverging heatmap with `mid=0` and verifying the center color aligns with zero
3. Verifying multi-stop and custom-positioned color scales
4. Verifying `apply_to="text"` colors text while background stays default
5. Verifying auto-contrast text stays readable on all heatmap backgrounds
6. Switching themes and verifying heatmap colors update
7. Mixing heatmaps and databars on the same table
8. Edge cases: all identical values, nulls, single-row tables