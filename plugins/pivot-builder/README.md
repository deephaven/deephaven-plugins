# Deephaven JS Plugin: Pivot Builder (spike)

Spike `WidgetMiddlewarePlugin` for [DH-21476](https://deephaven.atlassian.net/browse/DH-21476).
Adds a **Create Pivot** item to the IrisGrid Table Options sidebar for flat
`Table` widgets. Clicking the button calls the Core+ Pivot API to build a
pivot from the underlying table with sensible defaults and swaps the grid
view in place.

Reference plan: [`plans/DH-21476-pivot-builder-plugin.md`](../../plans/DH-21476-pivot-builder-plugin.md).

## How it works

- The middleware **replaces** the default widget renderer for `Table`
  widgets. It fetches the source `Table`, builds a
  `PivotBuilderIrisGridModel` that wraps an inner `IrisGridTableModel`,
  and renders `<IrisGrid model={pivotBuilderModel}/>` directly inside an
  `IrisGridTableOptionsContext.Provider`.
- `PivotBuilderIrisGridModel` mirrors the proxy pattern from
  `IrisGridProxyModel` (JS `Proxy` constructor that forwards unimplemented
  props to the current inner model).
- It exposes a `pivotConfig` getter/setter that mirrors `rollupConfig`:
  assigning a non-null config triggers
  `coreplus.pivot.PivotService.createPivotTable(...)` and swaps the inner
  model to an `IrisGridPivotModel`. Assigning `null` reverts to the
  original `IrisGridTableModel`.

## Defaults

`PivotBuilderIrisGridModel.makeDefaultPivotConfig(columns)`:

- `rowKeys`: first non-numeric column (or first column if all numeric)
- `columnKeys`: second non-numeric column if available, else `[]`
- `aggregations`: `{ Sum: [<all numeric col names>] }`, or `{ Count: [] }`
  when there are no numeric columns

## Requirements

- DHE Core+ worker (Pivot API lives in `@deephaven-enterprise/jsapi-coreplus-types`).
- The query must export a `PivotService` variable named `psp` (same
  convention used by the reference `grid-toolbar` plugin).

## Known limitations (spike)

- `supportedTypes` is `['Table']` only.
- The `panelComponent` path is a stub — it only injects the menu item but
  does not wrap the model with `PivotBuilderIrisGridModel`, so the
  "Create Pivot" button is non-functional inside `IrisGridPanel`. Use the
  non-panel widget path (e.g. `GridWidgetPlugin`) to exercise the spike.
- No persistence, no UI for picking row/column/value columns — the defaults
  helper picks them automatically.

## Build

```
npm install
npm run build
```

Bundle is emitted at `dist/index.js`.
