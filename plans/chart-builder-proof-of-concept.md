# Chart Builder Proof of Concept

## Description

Add an in-panel Chart toggle button to the `grid-toolbar` middleware plugin. Clicking "Chart" replaces the grid view with a line chart built from the first two columns of the table. Clicking "Grid" toggles back.

## Problem / Feature Gap

The `grid-toolbar` middleware plugin currently only provides a Reset Filters button. This proof of concept demonstrates that a middleware plugin can replace the panel's content entirely — not just augment it — by rendering a chart model in place of the grid.

## Scope

**In scope:**
- Rename "Export" button to "Chart" (toggles to "Grid" when chart is shown)
- On click: fetch the table, build a `LINE` chart from the first two columns (col[0] = x-axis, col[1] = y-axis), render it in-panel
- Toggle back to grid view on second click
- Graceful no-op if the table has fewer than 2 columns

**Out of scope:**
- Chart type selection UI
- Column picker UI
- Opening the chart in a new Golden Layout panel
- Persistence of the chart/grid toggle state across reloads

**Risks:**
- `ChartModelFactory.makeModelFromSettings` is async — the button must be disabled while the model is building to prevent double-clicks
- `FigureChartModel` wraps a live Deephaven figure and must be cleaned up on unmount

## Technical Design

### Dependencies

Add to `plugins/grid-toolbar/src/js/package.json` `dependencies`:
```json
"@deephaven/chart": "^0.106.0",
"@deephaven/jsapi-bootstrap": "^0.106.0"
```

Add both to `vite.config.ts` `rollupOptions.external` so they are loaded from the host app bundle, not re-bundled.

### GridToolbarPanelMiddleware.tsx Changes

**New imports:**
```ts
import { useState, useEffect, useCallback } from 'react';
import { Chart, ChartModel, ChartModelFactory } from '@deephaven/chart';
import { useApi } from '@deephaven/jsapi-bootstrap';
```

**New state:**
```ts
const dh = useApi();
const [view, setView] = useState<'grid' | 'chart'>('grid');
const [chartModel, setChartModel] = useState<ChartModel | null>(null);
const [isBuilding, setIsBuilding] = useState(false);
```

**`handleChart` handler (replaces `handleExport`):**
```ts
const handleChart = useCallback(async () => {
  if (view === 'chart') {
    setView('grid');
    return;
  }
  setIsBuilding(true);
  try {
    const table = await fetch();
    if (table.columns.length < 2) return;
    const settings = {
      type: 'LINE',
      series: [table.columns[1].name],
      xAxis: table.columns[0].name,
    };
    const model = await ChartModelFactory.makeModelFromSettings(dh, settings, table);
    setChartModel(model);
    setView('chart');
  } finally {
    setIsBuilding(false);
  }
}, [dh, fetch, view]);
```

**Cleanup:**
```ts
useEffect(() => {
  return () => {
    chartModel?.close();
  };
}, [chartModel]);
```

**Render:**
```tsx
<button type="button" disabled={isBuilding} onClick={handleChart}>
  {view === 'chart' ? 'Grid' : 'Chart'}
</button>

<div className="grid-toolbar-content h-100 w-100">
  {view === 'chart' && chartModel != null
    ? <Chart model={chartModel} className="h-100 w-100" />
    : <Component glEventHub={glEventHub} {...props} />}
</div>
```

### Key References

| Concern | Answer |
|---|---|
| dh API in middleware | `useApi()` from `@deephaven/jsapi-bootstrap` — context provided at dashboard root |
| Chart model creation | `ChartModelFactory.makeModelFromSettings(dh, settings, table)` from `@deephaven/chart` |
| `settings.type` | String key of `dh.plot.SeriesPlotStyle` — use `'LINE'`, not the enum value |
| `fetch` return type | `() => Promise<dh.Table>` for grid widgets |
| Chart component | `Chart` from `@deephaven/chart` (lazy-loaded) |
| Model cleanup | `FigureChartModel` — call `chartModel.close()` on unmount |

### Affected Files

- `plugins/grid-toolbar/src/js/src/GridToolbarPanelMiddleware.tsx`
- `plugins/grid-toolbar/src/js/package.json`
- `plugins/grid-toolbar/src/js/vite.config.ts`

## Verification

1. `npm run build` in `plugins/grid-toolbar/src/js` — no build errors
2. Rebuild plugin, reload browser
3. Open a table with ≥2 columns — "Chart" button appears in toolbar
4. Click "Chart" — grid replaced by a line chart; col[0] = x-axis, col[1] = y-axis
5. Click "Grid" — chart replaced by grid; Reset Filters still works
6. Open a table with <2 columns — clicking "Chart" is a no-op (button re-enables, view unchanged)
7. Close panel — no console errors from leaked chart model or figure subscription

## Research Appendix

- `IrisGridEvent.CREATE_CHART` (string: `'IrisGridevent.CREATE_CHART'`) is the GL event bus mechanism used by `IrisGridPanel` to open a chart in a **new** GL panel via `ChartBuilderPlugin`. This approach was considered but rejected — the proof of concept renders the chart in-panel instead, which is simpler and demonstrates middleware panel content replacement.
- `LayoutUtils.getIdFromContainer(glContainer)` is the functional-component equivalent of `LayoutUtils.getIdFromPanel(this)` for getting the current panel's ID (available in `WidgetPanelProps`).
- `@deephaven/jsapi-bootstrap` `useApi()` is already used by `plugins/pivot`, `plugins/ag-grid`, and `plugins/python-remote-file-source` — the pattern is well established in this repo.
