# Deephaven Plugin for Pivot Tables

This plugin adds UI support for Pivot tables in Core+ workers in Enterprise.

## Plugin Structure

`src/deephaven/pivot/register.py` registers the plugin with Deephaven. This file will not need to be modified for most plugins at the initial stages, but will need to be if the package is renamed or JavaScript files are moved.

The JavaScript files have the following structure:  
`PivotPlugin.ts` registers the plugin with Deephaven. This contains the client equivalent of the type in `pivot_type.py` and these should be kept in sync.  
`PivotWidget.tsx` defines the plugin panel and message handling. This is where messages are received when sent from the Python side of the plugin. This file is a good starting point for adding more complex plugin functionality.  

Additionally, the `test` directory contains Python tests for the plugin. This demonstrates how the embedded Deephaven server can be used in tests.  
It's recommended to use `tox` to run the tests, and the `tox.ini` file is included in the project.  

## Building the Plugin

Use the [`plugin_builder.py`](../../README.md#using-plugin_builderpy) from the root directory.

## Installation

1. Add `deephaven-plugin-pivot` to Core+ dependencies in `requirements.txt`
   
2. Add `@deephaven/js-plugin-pivot` js package to `pluginList` in `DhcInDhe/gradle.build`

## Using the Plugin

Refer to the [Pivot Tables documentation](https://deephaven.io/enterprise/docs/user-guide/pivots/) for code examples and links to the Python and Groovy API reference.