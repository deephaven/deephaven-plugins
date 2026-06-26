# Deephaven JS Plugin: Pivot Builder

`WidgetMiddlewarePlugin` for [DH-19890](https://deephaven.atlassian.net/browse/DH-19890).
Adds a unified **Rollup, Aggregate and Pivot** item to the IrisGrid Table
Options sidebar for flat `Table` widgets, on both the widget and panel paths.
Configuring it calls the Core+ Pivot API to build a pivot from the underlying
table and swaps the grid's inner model in place; the configuration is
persisted via `usePersistentState`.

Reference plan: [`plans/DH-21476-pivot-builder-plugin.md`](../../plans/DH-21476-pivot-builder-plugin.md).

## How it works

- The middleware is **chained**: it renders the wrapped host component (e.g.
  the base `GridWidgetPlugin` on the widget path, or `IrisGridPanel` on the
  panel path) and injects two transforms into it rather than replacing the
  renderer or mounting its own `IrisGrid`.
- `transformModel` augments the host-built proxy model into a
  `PivotBuilderIrisGridModel`. This proxy mirrors the pattern from
  `IrisGridProxyModel` (JS `Proxy` that forwards unimplemented props to the
  current inner model) and exposes a `pivotConfig` getter/setter alongside
  the usual `rollupConfig`/totals config.
- `transformTableOptions` composes on top of any upstream transform: it hides
  the built-in **Rollup Rows** and **Aggregations** items (superseded here)
  and appends a single unified **Rollup, Aggregate and Pivot** item
  (`order` 650). The item relabels to **Edit …** once a pivot exists.
- Opening that item shows `CreatePivotPage`, which reconciles its UI state
  into `applyPivotBuilderConfig` on the proxy. Assigning a pivot config calls
  `coreplus.pivot.PivotService.createPivotTable(...)` and swaps the inner
  model to an `IrisGridPivotModel`; clearing it reverts to the original model.
- When CorePlus is unavailable (open-source DH) the model transform is
  omitted, so the host renders a plain table and the page surfaces an error
  if opened.

## Defaults

When no row/column/value selection has been made yet, the page picks
sensible defaults from the source columns:

- `rowKeys`: first non-numeric column (or first column if all numeric)
- `columnKeys`: second non-numeric column if available, else `[]`
- `aggregations`: `{ Sum: [<all numeric col names>] }`, or `{ Count: [] }`
  when there are no numeric columns

## Requirements

- DHE Core+ worker (Pivot API lives in `@deephaven-enterprise/jsapi-coreplus-types`).
- The query must export a `PivotService` variable named `psp` (same
  convention used by the reference `grid-toolbar` plugin).

## Known limitations

- `supportedTypes` is `['Table']` only.
- The Pivot API requires a CorePlus worker; on open-source DH the item is
  shown but the page reports the service as unavailable.

## Build

```
npm install
npm run build
```

Bundle is emitted at `dist/index.js`.
