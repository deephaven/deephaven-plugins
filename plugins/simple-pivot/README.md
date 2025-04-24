# Deephaven Plugin for Simple Pivot

- TODO

## Plugin Structure

The `src` directory contains the Python and JavaScript code for the plugin.  
Within the `src` directory, the simple_pivot directory contains the Python code, and the `js` directory contains the JavaScript code.  

The Python files have the following structure:  
`simple_pivot_object.py` defines a simple Python class that can send messages to the client. This object can be modified to have other plugin functionality or replaced with a different object entirely, depending on the plugin's needs.  
`simple_pivot_type.py` defines the Python type for the plugin (which is used for registration) and a simple message stream. These can be modified to handle different objects or messages. An initial message is sent from the Python side to the client, then additional messages can be sent back and forth.  
`register.py` registers the plugin with Deephaven. This file will not need to be modified for most plugins at the initial stages, but will need to be if the package is renamed or JavaScript files are moved.

The JavaScript files have the following structure:  
`SimplePivotPlugin.ts` registers the plugin with Deephaven. This contains the client equivalent of the type in `simple_pivot_type.py` and these should be kept in sync.  
`SimplePivotWidget.tsx` defines the plugin panel and message handling. This is where messages are received when sent from the Python side of the plugin. This file is a good starting point for adding more complex plugin functionality.  

Additionally, the `test` directory contains Python tests for the plugin. This demonstrates how the embedded Deephaven server can be used in tests.  
It's recommended to use `tox` to run the tests, and the `tox.ini` file is included in the project.  

## Building the Plugin

Use the [`plugin_builder.py`](../../README.md#using-plugin_builderpy) from the root directory to build the plugin.

## Using the Plugin

- TODO