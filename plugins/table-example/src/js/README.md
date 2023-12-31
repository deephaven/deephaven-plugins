# Deephaven JavaScript Table Example Plugin

A simple plugin demonstrating TablePlugin functionality.

## Development

```
npm install
npm run build
```

Your output will be in `dist/index.js`

## Usage

Set the `PluginName` attribute on the Table with the name of the plugin.

```
from deephaven import empty_table

t = (
    empty_table(5)
    .update("X=i")
    .with_attributes({"PluginName": "@deephaven/js-plugin-table-example"})
)
```

The table will then open up, with the "Example Plugin" shown across the top, and options in the context menu.
