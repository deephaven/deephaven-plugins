# Deephaven Plugin for Simple Pivot

This plugin adds UI support for Simple Pivot tables in Core+ workers in Enterprise.

## Plugin Structure

`src/deephaven/simple_pivot/register.py` registers the plugin with Deephaven. This file will not need to be modified for most plugins at the initial stages, but will need to be if the package is renamed or JavaScript files are moved.

The JavaScript files have the following structure:  
`SimplePivotPlugin.ts` registers the plugin with Deephaven. This contains the client equivalent of the type in `simple_pivot_type.py` and these should be kept in sync.  
`SimplePivotWidget.tsx` defines the plugin panel and message handling. This is where messages are received when sent from the Python side of the plugin. This file is a good starting point for adding more complex plugin functionality.  

Additionally, the `test` directory contains Python tests for the plugin. This demonstrates how the embedded Deephaven server can be used in tests.  
It's recommended to use `tox` to run the tests, and the `tox.ini` file is included in the project.  

## Building the Plugin

Use the [`plugin_builder.py`](../../README.md#using-plugin_builderpy) from the root directory.

## Installation

1. Add `deephaven-plugin-simple-pivot` to Core+ dependencies in `requirements.txt`
   
2. Add `@deephaven/js-plugin-simple-pivot` js package to `pluginList` in `DhcInDhe/gradle.build`

## Using the Plugin

Groovy API:
```
import io.deephaven.simplepivot.SimplePivotTable
ticking_pivot = SimplePivotTable.FACTORY.create(table, [rowCol], [colCol], valueCol, aggSpec, hasTotals, pivotDescription)
```

Python API:
```
from deephaven.experimental.pivot import create_pivot
ticking_pivot = create_pivot(table, [rowCol], [colCol], valueCol, aggSpec, hasTotals, pivotDescription)
```

Python example with ticking data:
```
from deephaven.plot import express as dx
from deephaven.experimental.pivot import create_pivot
from deephaven.agg import sum_

_stocks = dx.data.stocks(ticking=True).tail(100)

ticking_pivot = create_pivot(_stocks, ['Sym'], ['Exchange'], 'Price', sum_(), False, 'Sum of Price')
```