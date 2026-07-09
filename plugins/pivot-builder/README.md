# Deephaven JS Plugin: Pivot Builder

`WidgetMiddlewarePlugin` for [DH-19890](https://deephaven.atlassian.net/browse/DH-19890).
Adds a unified **Rollup, Aggregate and Pivot** item to the IrisGrid Table
Options sidebar for flat `Table` widgets, on both the widget and panel paths.
Rollup and aggregate work on any worker; the pivot path additionally calls the
Core+ Pivot API to build a pivot from the underlying table. Either way it swaps
the grid's inner model in place, and the configuration is persisted via
`usePersistentState`.

Design notes:
[`plans/DH-21476-pivot-builder-architecture-recommendations.md`](../../plans/DH-21476-pivot-builder-architecture-recommendations.md)
and
[`plans/DH-21476-pivot-builder-sort-filter-hydration.md`](../../plans/DH-21476-pivot-builder-sort-filter-hydration.md).

## How it works

- The middleware is **chained**: it renders the wrapped host component (e.g.
  the base `GridWidgetPlugin` on the widget path, or `IrisGridPanel` on the
  panel path) and injects two transforms into it rather than replacing the
  renderer or mounting its own `IrisGrid`.
- `transformModel` augments the host-built proxy model into a
  `PivotBuilderProxyModel`. This proxy mirrors the pattern from
  `IrisGridProxyModel` (JS `Proxy` that forwards unimplemented props to the
  current inner model) and exposes a `pivotConfig` getter/setter alongside
  the usual `rollupConfig`/totals config.
- `transformTableOptions` composes on top of any upstream transform: it hides
  the built-in **Rollup Rows** and **Aggregations** items (superseded here)
  and appends a single unified **Rollup, Aggregate and Pivot** item
  (`order` 650).
- Opening that item shows `CreatePivotPage`, which reconciles its UI state
  into `applyPivotBuilderConfig` on the proxy. Assigning a pivot config calls
  `coreplus.pivot.PivotService.createPivotTable(...)` and swaps the inner
  model to an `IrisGridPivotModel`; clearing it reverts to the original model.
- The model transform is installed on **every** worker, not just Core+:
  rollup and aggregate (totals) are generic iris-grid features that operate
  on the source table and work on Legacy workers too. Only the pivot path
  requires Core+ — it is gated by a `PivotService` availability probe that
  disables the **Pivot columns** card when the service is absent, while the
  Rollup rows and Aggregate values cards stay usable.

## Defaults

When no row/column/value selection has been made yet, the page picks
sensible defaults from the source columns:

- `rowKeys`: first non-numeric column (or first column if all numeric)
- `columnKeys`: second non-numeric column if available, else `[]`
- `aggregations`: `{ Sum: [<all numeric col names>] }`, or `{ Count: [] }`
  when there are no numeric columns

## Requirements

- Rollup and aggregate work on any worker (including Legacy).
- The **pivot** path requires a DHE Core+ worker (Pivot API lives in
  `@deephaven-enterprise/jsapi-coreplus-types`).
- For the pivot path, the worker must publish a `PivotService`-typed
  variable. It is resolved by **type**, so it can be published under any
  name (the reference `grid-toolbar` plugin names it `psp`).

## Known limitations

- `supportedTypes` is `['Table']` only.
- The Pivot API requires a Core+ worker; when no `PivotService` is available
  the item still opens, but the **Pivot columns** card is disabled (rollup
  and aggregate still work).

## Build

```
npm install
npm run build
```

Bundle is emitted at `dist/index.js`.
