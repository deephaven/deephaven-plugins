# Deephaven Plugin: Grid Toolbar

A middleware plugin that adds a toolbar to table widgets. The toolbar provides:

- **Chart** — replaces the grid view with a line chart built from the first two columns of the table (col[0] = x-axis, col[1] = y-axis). Click **Grid** to toggle back.
- **Reset Filters** — clears all active filters on the table.

This plugin is a proof of concept for the middleware plugin infrastructure ([web-client-ui#2660](https://github.com/deephaven/web-client-ui/pull/2660)), demonstrating that a middleware plugin can replace panel content entirely rather than just augmenting it.

## Plugin Structure

`src/js/src/GridToolbarPlugin.ts` — registers the plugin as a middleware widget plugin supporting `Table`, `TreeTable`, `HierarchicalTable`, and `PartitionedTable` types.

`src/js/src/GridToolbarPanelMiddleware.tsx` — panel-level middleware that wraps `IrisGridPanel` with the toolbar UI and chart toggle logic.

`src/js/src/GridToolbarMiddleware.tsx` — widget-level middleware (used when no panel-level chaining is available).

## Building the Plugin

Use the [`plugin_builder.py`](../../README.md#using-plugin_builderpy) from the root directory, or build the JS directly:

```sh
cd src/js
npm run build
```

## Installation

This is a pure JavaScript plugin — no Python package is required.

1. Add an entry to `plugins/manifest.json`:
   ```json
   { "name": "grid-toolbar", "version": "0.0.0", "main": "src/js/dist/bundle/index.js" }
   ```

2. Serve the plugin directory and point the app at it via `VITE_JS_PLUGINS_DEV_PORT`.
