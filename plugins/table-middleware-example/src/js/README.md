# Deephaven JS Plugin: Table Middleware Example

A minimal `WidgetMiddlewarePlugin` that shows how a middleware plugin is
inserted into a widget's render chain and what it can do to the next
component: **wrap** it and **inject** props. It has no coupling to IrisGrid
or any other specific widget — the functionality is intentionally slim so the
middleware mechanics stand on their own.

## What it does

For every widget whose type is in `supportedTypes`
(`Table`, `TreeTable`, `HierarchicalTable`, `PartitionedTable`), the middleware:

1. **Injects** a custom prop (`exampleInjectedProp`) onto the wrapped
   component. A widget that knows to read it can; one that doesn't ignores it.
2. **Wraps** the wrapped component in an `ExampleMiddlewareContext.Provider`
   (so descendants can read what the middleware contributed) plus a small
   "Wrapped by example middleware" banner so the wrapping is visible.
3. Logs the incoming widget metadata, proving the middleware sits in the chain.

## How it's built

The behavior lives in one shared body hook, `exampleMiddlewareBody`, which
returns `{ inject, wrap }`. Two factory calls turn that single hook into the
two components a `WidgetMiddlewarePlugin` needs:

| Path | File | Factory |
| --- | --- | --- |
| Non-panel widget (e.g. dashboard widgets) | `ExampleWidgetMiddleware.tsx` | `createWidgetMiddleware` |
| Panel (e.g. `IrisGridPanel` host) | `ExamplePanelMiddleware.tsx` | `createPanelMiddleware` |

`createPanelMiddleware` owns the `forwardRef` ceremony and forwards
golden-layout's panel ref down to the wrapped panel, so panel state (sorts,
filters, column moves, etc.) is still persisted into `componentState`. The body
hook never touches the ref.

All the middleware helpers (`createWidgetMiddleware`, `createPanelMiddleware`,
`MiddlewareBody`, `WidgetMiddlewarePlugin`, `PluginType.MIDDLEWARE_PLUGIN`) are
imported directly from `@deephaven/plugin`.

## Build

```
npm install
npm run build
```

Bundle is emitted at `dist/index.js`. `plugins/manifest.json` registers
`table-middleware-example` so the deephaven-plugins dev proxy serves
the bundle.
