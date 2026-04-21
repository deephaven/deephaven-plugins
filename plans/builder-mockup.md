# Plan: Pivot Button in Grid-Toolbar Middleware

## TL;DR
Add functional pivot toggle to the grid-toolbar middleware plugin's existing placeholder "Pivot" button. When clicked, it auto-detects sensible column defaults from the table, creates a PivotTable via `PivotService.createPivotTable()`, builds an `IrisGridPivotModel`, and renders `<IrisGrid>` in-place — replacing the grid view, same pattern as the existing Chart toggle.

## Decisions
- **Approach**: Middleware plugin in `deephaven-plugins/plugins/grid-toolbar/` (no web-client-ui changes)
- **UI**: Simple toggle button with auto-detected defaults (like Chart toggle)
- **Result**: Replace grid in-place (like Chart toggle)
- **Enterprise only**: Uses `dh.coreplus.pivot.PivotService` — requires CorePlus API

## Steps

### Phase 1: Pivot Creation Logic

1. **Add dependencies** to `plugins/grid-toolbar/src/js/package.json`:
   - `@deephaven-enterprise/jsapi-coreplus-types` (devDependency, types only)
   - `@deephaven/iris-grid` (for `IrisGrid` component and `IrisGridModel`)
   - May need pivot plugin hooks if using custom renderers

2. **Add externals** to `plugins/grid-toolbar/src/js/vite.config.ts` rollupOptions:
   - `@deephaven/iris-grid`
   - Any additional `@deephaven/*` packages added

3. **Create `usePivotToggle.ts` hook** in `plugins/grid-toolbar/src/js/src/`:
   - Accept `fetch: () => Promise<unknown>` (the grid's fetch function) and `dh` API
   - On toggle ON:
     - Call `fetch()` to get the `dh.Table`
     - Call `dh.coreplus.pivot.PivotService.getInstance(table)` to get PivotService
     - Auto-detect defaults from `table.columns`:
       - Non-numeric columns → first half as `rowKeys`, second half as `columnKeys`
       - Numeric columns → `aggregations: { Sum: numericColumnNames }`
     - Call `pivotService.createPivotTable({ source: table, rowKeys, columnKeys, aggregations })`
     - Create `IrisGridPivotModel(dh, pivotTable)` from the result
   - On toggle OFF: close pivot model, return to grid
   - Return `{ view, pivotModel, isBuilding, handleToggle }`

4. **Import `IrisGridPivotModel`** from `@deephaven/js-plugin-pivot` OR duplicate a simplified version. The model is ~1800 lines with enterprise-specific logic. Options:
   - **Option A (preferred)**: Import from pivot plugin as a dependency. Add `@deephaven/js-plugin-pivot` to package.json dependencies and vite externals
   - **Option B**: Create a minimal pivot model wrapper that only supports basic rendering (no custom mouse handlers, renderer, theme)

### Phase 2: Wire Up the UI

5. **Update `GridToolbarPanelMiddleware.tsx`**:
   - Import `usePivotToggle` hook
   - Add `'pivot'` to the view state type: `'grid' | 'chart' | 'pivot'`
   - Wire existing placeholder `<button>Pivot</button>` to the toggle handler
   - Disable button while building (`isBuilding` state)
   - Toggle button label: show "Grid" when in pivot view
   - Guard availability: only enable if `isCorePlusDh(dh)` is true (enterprise check)

6. **Add pivot rendering branch** in the content area:
   - When `view === 'pivot' && pivotModel != null`:
     - Render `<IrisGrid model={pivotModel} />` with pivot-specific props
     - Optionally use `usePivotMouseHandlers()`, `usePivotRenderer()`, `usePivotTheme()` from pivot plugin for full-featured rendering
   - When `view === 'grid'`: render `<Component ...>` (existing behavior)

7. **Handle cleanup**: close `pivotModel` on unmount or when switching away (same pattern as `chartModel?.close()`)

### Phase 3: Inline Middleware (Optional)

8. **Update `GridToolbarMiddleware.tsx`** (non-panel inline rendering): Add a simpler pivot toggle if needed for `WidgetView` path. Lower priority — panel middleware is the primary path.

## Relevant Files

- `plugins/grid-toolbar/src/js/src/GridToolbarPanelMiddleware.tsx` — main file to modify; wire up Pivot button, add pivot view branch
- `plugins/grid-toolbar/src/js/src/GridToolbarMiddleware.tsx` — optional: add pivot to inline middleware
- `plugins/grid-toolbar/src/js/package.json` — add dependencies
- `plugins/grid-toolbar/src/js/vite.config.ts` — add externals
- `plugins/pivot/src/js/src/IrisGridPivotModel.ts` — reuse: the model class for pivot rendering
- `plugins/pivot/src/js/src/hooks/usePivotMouseHandlers.ts` — reuse: pivot-specific mouse handlers
- `plugins/pivot/src/js/src/hooks/usePivotRenderer.ts` — reuse: pivot cell renderer
- `plugins/pivot/src/js/src/hooks/usePivotTheme.ts` — reuse: pivot grid theme
- `plugins/pivot/src/js/src/hooks/usePivotMetricCalculatorFactory.ts` — reuse: metric calculator
- `plugins/pivot/src/js/src/PivotUtils.ts` — reuse: `isCorePlusDh()` type guard
- `gplus/web/client-api/.../pivotservice.html` — reference: PivotService API usage example

## Verification

1. Build the grid-toolbar plugin: `cd plugins/grid-toolbar && python ../../tools/plugin_builder.py --reinstall grid-toolbar`
2. Load a Table in the UI, verify grid-toolbar renders with Chart, Pivot, Reset Filters buttons
3. Click Pivot on a table with mixed numeric/non-numeric columns — should toggle to pivot view with auto-detected layout
4. Click Pivot again (or "Grid" button) — should return to normal grid view
5. Verify Pivot button is disabled/hidden when CorePlus API is not available (community edition)
6. Verify pivot model cleanup on unmount (no leaked subscriptions)
7. Run JS tests: `npm run test:unit -- --testPathPattern="plugins/grid-toolbar"`

## Key API Reference

```
PivotService.getInstance(table: dh.Table): Promise<PivotService>
pivotService.createPivotTable(options: PivotCreationOptions): Promise<PivotTable>

PivotCreationOptions = {
  source: dh.Table,
  rowKeys: string[],
  columnKeys: string[],
  aggregations: { [operation]: string[] }  // e.g. { Sum: ['Price', 'Qty'] }
}

Operations: Count, Min, Max, Sum, Var, Avg, Std, First, Last
```

## Risks / Open Questions

1. **PivotService.getInstance(table)**: The pivotservice.html example passes a "psp" (PivotServiceProvider) widget, not a plain Table. The TypeScript types accept `dh.Table`, but runtime behavior may differ. Need to verify `getInstance(table)` works with a raw table from `fetch()`.

2. **IrisGridPivotModel dependency**: This model is ~1800 lines with complex enterprise logic. Importing it as a dependency couples grid-toolbar to the pivot plugin. Alternative: render a simpler table view of the PivotTable snapshot data without IrisGrid.

3. **Column auto-detection heuristics**: Simple split of non-numeric→rows/columns, numeric→values may not produce useful pivots for all table shapes. May want to add minimal configuration UI in a follow-up.
