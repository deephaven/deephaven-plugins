# Deephaven JS Plugin: Table Options Example

Demo `WidgetMiddlewarePlugin` for [DH-21476](https://deephaven.atlassian.net/browse/DH-21476).
It wraps every table-like widget in an `IrisGridTableOptionsContext.Provider`
that:

1. Hides the built-in **Select Distinct Values** sidebar item.
2. Adds a plugin-contributed item titled "Column Inspector" whose
   page lists the model's column count.

Both contributions compose with any parent `IrisGridTableOptionsContext` —
this plugin reads the parent value and merges its own
`transformTableOptions` on top, so multiple middleware plugins can
stack without clobbering one another.

## Build

```
npm install
npm run build
```

Bundle is emitted at `dist/index.js`.

## How it plugs in

`plugins/manifest.json` registers `table-options-example` so the
deephaven-plugins dev proxy serves the bundle. At runtime
`@deephaven/iris-grid` resolves `IrisGridTableOptionsContext` from React
context inside `IrisGridPanel` and `GridWidgetPlugin`, and forwards
the merged `transformTableOptions` to `IrisGrid#transformTableOptions`.

## Future work

`transformTableOptions` is intentionally pure — it receives only the
default item list, not the `IrisGridModel` or grid state. State-aware
menus (e.g. "only show *Reset filters* when filters exist") belong in
the middleware: subscribe to model events in the `Provider`, recompute
the extension, and let the transform stay a plain projection of
`defaults`. See `useComposedTableOptionsExtension` for the composition
shape.

The constraint is partly about keeping the surface small, but mostly
about memoization: `IrisGrid` caches the menu on the identity of the
transform and `defaults`. The model is a mutable handle whose
identity doesn't change when its fields do, so reading it inside the
transform would silently produce stale menus. Driving recomputes from
the middleware (which knows which events matter) keeps the cache key
honest.

If real plugins start needing model awareness inside the transform
itself, the planned evolution is to add a second argument carrying a
curated **snapshot of values** — something like
`(defaults, { isRollup, hasFilters, columnCount }) => items` — so memo
invalidation tracks actual dependencies. The `IrisGridModel` itself,
or the full `IrisGrid` instance, will not be exposed.
