# Deephaven JS Plugin: Table Options Example

Demo `WidgetMiddlewarePlugin` for [DH-21476](https://deephaven.atlassian.net/browse/DH-21476).
It wraps every table-like widget in an `IrisGridSidebarContext.Provider`
that:

1. Hides the built-in **Select Distinct Values** sidebar item.
2. Adds a plugin-contributed item titled "Column Inspector" whose
   page lists the model's column count.

Both contributions compose with any parent `IrisGridSidebarContext` —
this plugin reads the parent value and merges its own `transformItems`
on top, so multiple middleware plugins can stack without clobbering
one another.

## Build

```
npm install
npm run build
```

Bundle is emitted at `dist/bundle/index.js`.

## How it plugs in

`plugins/manifest.json` registers `table-options-example` so the
deephaven-plugins dev proxy serves the bundle. At runtime
`@deephaven/iris-grid` resolves `IrisGridSidebarContext` from React
context inside `IrisGridPanel` and `GridWidgetPlugin`, and forwards
the merged `transformItems` to `IrisGrid#sidebarItems`.
