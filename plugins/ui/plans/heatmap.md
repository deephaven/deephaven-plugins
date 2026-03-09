# DH-21376 ui.TableFormat Heatmaps

Heatmaps are currently provided through inline string expressions in format_columns(). This is inconsistent with other formatting features that are handled through ui.TableFormat objects passed to the format_ parameter. Databars recently introduced a separate ui.TableFormat.mode parameter that allows structured, extensible formatting by specifying a mode object (see TableDatabar) for each column or set of columns.

The new heatmap API lets you color table cells based on their values, with support for:

- Lives in `ui.TableFormat` alongside databars
- Supports auto min/max, diverging scales, multi-stop gradients, and theme colors
- Interpolates colors client-side in oklab color space

## Design decisions

### 1. Heatmap as a color value, not a mode

Unlike databars which change how a cell renders, heatmaps just produce colors. So rather than putting heatmaps in `mode` alongside databars, `TableHeatmap` is a valid value for the `color` and `background_color` fields on `TableFormat`. This makes the placement self-evident from which property the heatmap is assigned to, eliminates any priority conflict between static colors and heatmaps on the same field, and allows composing heatmaps with databars naturally (e.g., heatmap background + databar overlay on the same column).

The client distinguishes static colors from heatmaps by type: if the value is a string, it's a static color; if it's an object with `type: 'heatmap'`, it's a heatmap config.

### 2. CellRenderType

Heatmaps don't need a custom render type like databars. They override the existing cell color methods. Conditional formatting (`if_`) targeting independent cells works alongside heatmaps, one applies to a given cell at a time.

### 3. Auto-contrast text color

The old api auto-picks light/dark text based on the background. The new api should do the same (existing cell color logic should handle this already).

### 4. Named Color Scales

Named color scales are specified as a string passed to the `colors` parameter. They resolve to predefined color arrays on the TypeScript side. Two categories exist:

**Theme-native scales** use DH color variables and update when the user changes the theme:

- `"sequential"` — Accent color ramp: `["accent-200", "accent-500", "accent-700", "accent-900", "accent-1000", "accent-1100", "accent-1200", "accent-1300", "accent-1400"]`
- `"diverging"` — Negative through neutral to positive: `["negative", "gray-50", "positive"]`

**Scientific scales** use 9 fixed hex stops sampled from the canonical 256-value scales (oklab interpolation between stops keeps gradients smooth):

- `"viridis"`, `"plasma"`, `"inferno"`, `"magma"`, `"cividis"`

Resolution happens on the TS side. Python passes the string as-is; TS looks it up from a `NAMED_SCALES` record. Theme-native entries contain DH color token names (resolved through the existing `colorMap`). Scientific entries contain hex strings.

```python
ui.TableHeatmap(colors="viridis")
ui.TableHeatmap(colors="sequential")
ui.TableHeatmap(colors="diverging")
```

When `colors` is a string and no `mid` is set, the scale is used as-is. When `mid` is set, the scale is still used as-is (the symmetric normalization handles the diverging behavior). This means a user could write `colors="viridis", mid=0` — the viridis gradient would be centered on zero.

Validation: when `colors` is a string, the TS side checks it against known scale names and logs a console warning if unrecognized (falling back to the default palette).

### 5. Diverging Scales

Heatmap should accept a `mid` parameter. `mid` should be a data value (not normalized) that always maps to position 0.5 in the color scale. If `mid` is set, the effective range should become symmetric around it:

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
colors = ["blue-400", "yellow-400", "red-400"]

# 3 colors, mid=0 -> diverging with white at zero
colors = ["blue-600", "white", "red-600"], mid = 0
```

As mentioned above plain lists of colors are evenly spaced, which should cover most cases. But if a user wants to specify a color at a specific position (e.g. white at 30% instead of 50%), we could accept tuples of the form `(position, color)` for explicit control.

```python
# Evenly spaced -> inferred as 0.0, 0.5, 1.0
colors = ["red-500", "yellow-300", "green-500"]

# Explicit
colors = [(0, "blue-600"), (0.3, "white"), (1, "red-600")]
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
            Defaults to the column minimum.
            If a column name is provided, the min is read per-row from that column.
            If a number is provided, it is used as a constant.
        max: Maximum value for the heatmap range.
            Defaults to the column maximum.
            If a column name is provided, the max is read per-row from that column.
            If a number is provided, it is used as a constant.
        mid: Midpoint data value for diverging color scales.
            When set, the effective range is forced to be symmetric around this
            value, so the center color in the scale always maps to `mid`.
            Defaults to None (sequential scale, no midpoint).
        colors: Color scale for the gradient. Can be specified in three forms:
            - A string naming a predefined scale:
              "viridis", "sequential", "diverging", etc.
            - A list of color strings for evenly-spaced stops (at least 2):
              ["red-500", "yellow-300", "green-500"]
              (inferred as positions 0.0, 0.5, 1.0)
            - A list of (position, color) tuples for explicit positioning:
              [(0, "blue-600"), (0.3, "white"), (1, "red-600")]
              Positions must be in the [0, 1] range.
            Colors can be theme colors ("red-500", "accent"), CSS colors, or hex values.
            Defaults to a theme-aware sequential gradient when ``mid`` is not set,
            or a theme-aware diverging gradient when ``mid`` is set.
    """

    type: str = field(default="heatmap", init=False)
    min: ColumnName | float | None = None
    max: ColumnName | float | None = None
    mid: float | None = None
    colors: str | list[Color] | list[tuple[float, Color]] | None = None
```

The heatmap target (text vs background) is determined by which `TableFormat` field (`color` or `background_color`) the heatmap is assigned to.

### Python: Updated `TableFormat`

```python
class TableFormat:
    cols: ColumnName | list[ColumnName] | None = None
    if_: str | None = None
    color: Color | TableHeatmap | None = None
    background_color: Color | TableHeatmap | None = None
    alignment: Literal["left", "center", "right"] | None = None
    value: str | None = None
    mode: TableDatabar | None = None
```

### TypeScript: `HeatmapConfig`

```typescript
export type ColorStop = [number, string]; // [position, color]

export type HeatmapConfig = {
  type: 'heatmap';
  min?: number | ColumnName;
  max?: number | ColumnName;
  mid?: number; // data value that maps to position 0.5
  colors?: string | string[] | ColorStop[]; // string = named scale; string[] = color list; at least 2 when array
};
```

```typescript
export type FormattingRule = {
  cols?: ColumnName | ColumnName[];
  if_?: string;
  color?: string | HeatmapConfig;
  background_color?: string | HeatmapConfig;
  alignment?: 'left' | 'center' | 'right';
  value?: string;
  mode?: DatabarConfig;
};
```

## Usage Examples

```python
# Auto min/max, default theme gradient, background coloring
ui.table(
    students, format_=ui.TableFormat(cols="GPA", background_color=ui.TableHeatmap())
)

# Explicit range with two colors
ui.table(
    students,
    format_=ui.TableFormat(
        cols="GPA",
        background_color=ui.TableHeatmap(
            min=1.0, max=4.0, colors=["green-600", "red-600"]
        ),
    ),
)

# Apply the same heatmap to multiple columns
ui.table(
    students,
    format_=ui.TableFormat(
        cols=["TestGrade", "HomeworkGrade"],
        background_color=ui.TableHeatmap(colors=["red-500", "green-500"]),
    ),
)

# Can also specify separately
ui.table(
    students,
    format_=[
        ui.TableFormat(
            cols="GPA",
            background_color=ui.TableHeatmap(colors=["red-500", "green-500"]),
        ),
        ui.TableFormat(
            cols="TestGrade",
            background_color=ui.TableHeatmap(colors=["blue-500", "white", "red-500"]),
        ),
    ],
)

# Diverging scale centered on zero
ui.table(
    t,
    format_=ui.TableFormat(
        cols="PnL",
        background_color=ui.TableHeatmap(
            mid=0, colors=["red-500", "white", "green-500"]
        ),
    ),
)

# Heatmap on text color
ui.table(students, format_=ui.TableFormat(cols="GPA", color=ui.TableHeatmap()))

# Both text and background heatmaps (different scales)
ui.table(
    students,
    format_=ui.TableFormat(
        cols="GPA",
        background_color=ui.TableHeatmap(colors=["blue-200", "blue-1200"]),
        color=ui.TableHeatmap(colors=["white", "black"]),
    ),
)

# Heatmap background + databar overlay on the same column
ui.table(
    students,
    format_=ui.TableFormat(
        cols="TestGrade", background_color=ui.TableHeatmap(), mode=ui.TableDatabar()
    ),
)

# Multi-stop sequential gradient
ui.table(
    t,
    format_=ui.TableFormat(
        cols="Temperature",
        background_color=ui.TableHeatmap(
            colors=["blue-400", "cyan-400", "yellow-400", "red-400"]
        ),
    ),
)

# Dynamic min/max from other columns
ui.table(
    t,
    format_=ui.TableFormat(
        cols="Price",
        background_color=ui.TableHeatmap(min="PriceFloor", max="PriceCeiling"),
    ),
)

# Custom stop positions (white sits at 20% instead of the midpoint)
ui.table(
    t,
    format_=ui.TableFormat(
        cols="Concentration",
        background_color=ui.TableHeatmap(
            colors=[(0, "green-600"), (0.2, "white"), (1, "red-600")]
        ),
    ),
)

# Conditional
ui.table(
    students,
    format_=[
        ui.TableFormat(
            cols="GPA",
            background_color=ui.TableHeatmap(colors=["red-500", "green-500"]),
            if_="Year > 2",
        ),
    ],
)

# Mixed heatmaps and databars on different columns
ui.table(
    students,
    format_=[
        ui.TableFormat(cols="TestGrade", mode=ui.TableDatabar()),
        ui.TableFormat(
            cols="GPA",
            background_color=ui.TableHeatmap(colors=["red-500", "white", "green-500"]),
        ),
    ],
)
```

## Development Plan

1. Add `TableHeatmap` dataclass to `table.py`
   - [ ] Add fields: `type`, `min`, `max`, `mid`, `colors`
   - [ ] `type` is auto-populated `"heatmap"`, not user-settable
   - [ ] Widen `TableFormat.color` and `TableFormat.background_color` to accept `TableHeatmap`

2. Add validation in `table.__init__`
   - [ ] `colors` must have at least 2 entries when provided as a list
   - [ ] `colors` as a string is passed through (validated on TS side against known scale names)
   - [ ] `cols` required when `color` or `background_color` is a `TableHeatmap`

3. Add `HeatmapConfig` TypeScript type
   - [ ] Add type with matching fields (colors accepts string | string[] | ColorStop[])
   - [ ] Widen `FormattingRule.color` and `FormattingRule.background_color` to accept `string | HeatmapConfig`

4. Add `ColorScales.ts` with named scale definitions
   - [ ] Theme-native scales: `NAMED_SCALES` record mapping name -> DH color token arrays - `"sequential"` -> accent ramp tokens - `"diverging"` -> negative/neutral/positive tokens
   - [ ] Scientific scales: record mapping name -> 9-stop hex arrays - `"viridis"`, `"plasma"`, `"inferno"`, `"magma"`, `"cividis"`
   - [ ] Export a `resolveNamedScale(name: string)` lookup function
   - [ ] Log console warning for unrecognized scale names, fall back to default

5. Wire named scale resolution into heatmap color pipeline
   - [ ] When `colors` is a string, resolve via `resolveNamedScale` to a color array
   - [ ] Collect DH color tokens from theme-native scales into the `colorMap`
   - [ ] Scientific scale hex values bypass the colorMap (already resolved)

6. Add extraction function for heatmap format rules
   - [ ] Extract heatmap configs from `color` and `background_color` fields (not `mode`)
   - [ ] Track which field the heatmap came from to determine text vs background targeting

7. Extend auto min/max infrastructure for heatmap columns
   - [ ] Use separate hidden column suffixes to avoid collisions with databars
   - [ ] Add min/max aggregations for heatmap columns

8. Build oklab color interpolation utility

9. Implement value normalization
   - [ ] Standard normalization for sequential scales
   - [ ] Symmetric range expansion for diverging scales with `mid`
   - [ ] Handle edge cases (equal min/max, etc.)

10. Wire heatmap into the table model
    - [ ] In `colorForCell`: if `color` is a `HeatmapConfig`, return interpolated color
    - [ ] In `backgroundColorForCell`: if `background_color` is a `HeatmapConfig`, return interpolated color
    - [ ] Auto-contrast text comes for free via existing logic when background is a heatmap

11. Select default palettes
    - [ ] Sequential default when `mid` is not set (reuse `"sequential"` named scale)
    - [ ] Diverging default when `mid` is set (reuse `"diverging"` named scale)

12. Add E2E test tables
    - [ ] Basic heatmap with auto min/max and default colors (`background_color=`)
    - [ ] Diverging heatmap with `mid=0` on asymmetric data
    - [ ] Explicit multi-stop color scale
    - [ ] Named scale string (e.g., `colors="viridis"`)
    - [ ] Text color heatmap (`color=ui.TableHeatmap()`)
    - [ ] Both `color` and `background_color` as heatmaps simultaneously
    - [ ] Heatmap background + databar overlay on same column
    - [ ] Mixed heatmaps and databars on different columns

13. Add Playwright tests
    - [ ] Snapshots
    - [ ] Theme switching tests (if applicable)

14. Update documentation
    - [ ] Add heatmap section to `table.md` with examples
    - [ ] Note deprecation of legacy `heatmap()` / `heatmapFg()` with warning

### Testing

#### Automated Tests

- [ ] Python unit tests for serialization (various parameter combinations, including string scale names)
- [ ] Python unit tests for validation (too few colors, heatmap without cols etc)
- [ ] TypeScript unit tests for heatmap extraction from `color`/`background_color` fields
- [ ] TypeScript unit tests for named scale resolution (known names, unknown names, theme-native)
- [ ] TypeScript unit tests for color interpolation
- [ ] TypeScript unit tests for normalization (sequential, diverging, edge cases)
- [ ] TypeScript unit tests for default color selection
- [ ] E2E screenshot tests for all heatmap test tables
- [ ] (Should also test theme changes if applicable)

#### Manual Tests

Tests will broadly include the following scenarios:

1. Applying a minimal heatmap and verifying the gradient renders correctly
2. Applying a diverging heatmap with `mid=0` and verifying the center color aligns with zero
3. Verifying multi-stop and custom-positioned color scales
4. Verifying `color=ui.TableHeatmap()` colors text while background stays default
5. Verifying both `color` and `background_color` as heatmaps simultaneously
6. Verifying auto-contrast text stays readable on all heatmap backgrounds
7. Switching themes and verifying heatmap colors update
8. Heatmap background + databar overlay on the same column
9. Mixing heatmaps and databars on different columns
10. Edge cases: all identical values, nulls, single-row tables
11. Applying a named scientific scale (`colors="viridis"`) and verifying it renders correctly
12. Applying a named theme-native scale (`colors="sequential"`) and verifying it updates on theme switch
13. Passing an unknown scale name and verifying console warning + fallback
