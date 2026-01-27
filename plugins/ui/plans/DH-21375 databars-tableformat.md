# DH-21375 Databars need to be integrated with `ui.TableFormat`

## Overview

Currently, databars on tables are configured through the `databars` parameter of `ui.table()`, which is separate from the general table formatting API. This creates inconsistency in the API design, as all other formatting features (colors, alignment, value formatting, etc.) are handled through `ui.TableFormat` objects passed to the `format_` parameter.

This feature will integrate databars into the `ui.TableFormat` construct to provide a consistent, unified formatting API.

## Goals

1. **API Consistency**: Align databars with other formatting features by making them part of `ui.TableFormat`
2. **Simplified Mental Model**: Users learn one formatting system instead of two separate APIs
3. **Feature Parity**: Maintain all existing databar functionality while improving the API
4. **Backward Compatibility**: Deprecate the old `databars` parameter gracefully without breaking existing code
5. **Enhanced Flexibility**: Enable databars to work with conditional formatting rules (`if_` parameter)

## Technical Design

### Current Implementation

**Python API (table.py):**

- `databars` parameter accepts `list[dict]` with databar configs
- Separate `TableDatabar` dataclass exists but isn't fully integrated
- No connection to `TableFormat` system

**JavaScript Processing (UITableModel.ts):**

- `databars` array processed separately from `format` rules
- Joins table with min/max totals for dynamic scaling
- Creates databar configs mapped by column name

### Proposed Changes

#### 1. Python API Changes

**Update `TableFormat` to accept `TableDatabar` in `mode`:**

```python
@dataclass
class TableFormat:
    cols: ColumnName | list[ColumnName] | None = None
    if_: str | None = None
    color: Color | None = None
    background_color: Color | None = None
    alignment: Literal["left", "center", "right"] | None = None
    value: str | None = None
    mode: TableDatabar | None = None  # Accepts TableDatabar instance


@dataclass
class TableDatabar:
    # Databar-specific properties
    color: Color | None = None
    value_column: ColumnName | None = None
    min: ColumnName | float | None = None
    max: ColumnName | float | None = None
    axis: Literal["proportional", "middle", "directional"] | None = None
    direction: Literal["LTR", "RTL"] | None = None
    value_placement: Literal["beside", "overlap", "hide"] | None = None
    opacity: float | None = None
    markers: list[dict] | None = None  # For marker lines
```

**Example usage:**

```python
t = ui.table(
    dx.data.stocks(),
    format_=[
        # Simple databar
        ui.TableFormat(cols="Price", mode=ui.TableDatabar(color="positive")),
        # Databar with conditional formatting
        ui.TableFormat(
            cols="Size",
            if_="Size > 100",
            mode=ui.TableDatabar(
                color=["negative", "positive"],
                min=0,
                max=1000,
            ),
        ),
        # Apply databars to multiple columns
        ui.TableFormat(
            cols=["Volume", "Dollars"],
            mode=ui.TableDatabar(
                color="blue-600",
                value_placement="overlap",
                opacity=0.7,
            ),
        ),
        # Other formatting still works
        ui.TableFormat(cols="Sym", background_color="accent-100"),
    ],
)
```

**Deprecate `databars` parameter:**

- Keep `databars` parameter functional for backward compatibility
- Add deprecation warning when used
- Document migration path in release notes

#### 2. JavaScript Changes

**UITableUtils.ts:**

- Update `FormattingRule` interface to include databar properties
- Add type guards to identify databar formatting rules

**UITableModel.ts:**

- Merge databar processing with format rule processing
- Extract databar configs from format rules where `mode` is a `TableDatabar` object
- Maintain existing databar rendering logic
- Support legacy `databars` parameter during deprecation period

**UITable.tsx:**

- Process both `databars` prop (deprecated) and format rules with databars
- Show console warning when `databars` prop is used
- Pass combined databar configs to UITableModel

#### 3. Documentation Changes

**Update table.md:**

- Move databar documentation from separate section into formatting section
- Show examples using `ui.TableFormat` with `mode=ui.TableDatabar(...)`
- Add migration guide from old to new API
- Keep warning about API changes but update to point to new approach

**Update API reference:**

- Document new `mode` parameter and databar properties
- Mark `databars` parameter as deprecated
- Provide clear examples of both approaches during transition

## Implementation Plan

### Phase 1: Foundation

1. Update `TableFormat` dataclass with databar properties
2. Add type definitions and validation
3. Write unit tests for new TableFormat API

### Phase 2: JavaScript Integration

4. Update TypeScript interfaces in UITableUtils.ts
5. Modify UITableModel.ts to process databars from format rules
6. Add support for both old and new APIs simultaneously
7. Add console warning for deprecated `databars` parameter

### Phase 3: Testing

8. Create E2E tests for new databar format API
9. Verify backward compatibility with existing databars tests
10. Test conditional databars (`if_` parameter)
11. Test databar priority with multiple format rules

### Phase 4: Documentation

12. Update component documentation
13. Create migration guide
14. Update code examples throughout docs
15. Update CHANGELOG with deprecation notice

### Phase 5: Cleanup (Future Release)

16. Remove deprecated `databars` parameter (after 2-3 releases)
17. Remove legacy code paths
18. Simplify internal implementation

## Testing Strategy

### Unit Tests (Python)

- `TableFormat` with `mode=ui.TableDatabar(...)` validates correctly
- Databar properties are serialized properly
- Invalid configurations raise appropriate errors
- Mixing databars with other format properties works

### E2E Tests (Playwright)

- Databars render correctly using new `TableFormat` API
- Conditional databars work with `if_` parameter
- All databar features functional (colors, gradients, markers, opacity, etc.)
- Format rule priority applies to databars
- Backward compatibility: old `databars` parameter still works
- Console warning appears when using deprecated API

### Manual Testing

- Visual verification of databar rendering
- Interactive testing of dynamic databars with ticking tables
- Performance testing with large tables and many format rules

## Documentation

### Updates Needed

1. **plugins/ui/docs/components/table.md**

   - Move databar section under "Formatting"
   - Update all examples to use `ui.TableFormat`
   - Add migration guide from old API
   - Keep brief note about deprecated `databars` param

2. **API Reference**

   - Document new `mode` parameter
   - Document databar-specific properties on `TableFormat`
   - Mark `databars` parameter as deprecated

3. **CHANGELOG.md**

   - Note deprecation of `databars` parameter
   - Explain migration path
   - List new capabilities (conditional databars)

4. **Migration Guide**

   ```python
   # Old API (deprecated)
   ui.table(t, databars=[{"column": "Price", "color": "positive"}])

   # New API
   ui.table(
       t, format_=[ui.TableFormat(cols="Price", mode=ui.TableDatabar(color="positive"))]
   )
   ```

## Open Questions

1. **Should we keep `TableDatabar` dataclass?**

   - Option A: Remove it entirely, flatten all properties into `TableFormat`
   - Option B: Keep it as `mode=ui.TableDatabar(...)` for grouping databar options
   - **Recommendation**: Option B (pass TableDatabar into mode)
   - **Rationale**: Using Option B avoids polluting the top-level `TableFormat` with databar-specific properties. This prevents having many keywords that may not be applicable at all to the format being applied. It provides better separation of concerns and cleaner API design.

2. **How long should we support the deprecated `databars` parameter?**

   - **Recommendation**: 3-4 releases (~3-6 months) with deprecation warnings

3. **Should databar-specific properties be valid when `mode` is not a `TableDatabar`?**

   - **Recommendation**: N/A - with Option B, databar properties are only available within `TableDatabar`, not on `TableFormat`

4. **Can multiple format rules create databars on the same column?**

   - **Recommendation**: Last rule wins (consistent with other format priority)

5. **Should we support databars without specifying columns (row-level databars)?**

   - **Recommendation**: No, databars are inherently column-specific

6. **How do databars interact with other `mode` values in the future?**
   - **Recommendation**: `mode` is mutually exclusive; last rule wins

## Success Criteria

- [ ] All existing databar functionality works through `ui.TableFormat`
- [ ] Backward compatibility maintained with deprecation warnings
- [ ] E2E tests pass for both old and new APIs
- [ ] Documentation fully updated with examples
- [ ] Performance equivalent or better than current implementation
- [ ] User feedback is positive during beta period
