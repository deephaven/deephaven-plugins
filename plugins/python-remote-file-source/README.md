# Deephaven Python Remote File Source Plugin

A Deephaven bi-directional plugin to allow sourcing Python imports from a remote file source. It consists of a Python plugin installed and then instantiated in a Deephaven core / core+ worker. When a client connects to the plugin, a custom Python `sys.meta_path` finder and loader are registered that will send messages to the client to request content for loading modules.

## Plugin Structure

The `src` directory contains the Python and JavaScript code for the plugin.  
Within the `src` directory, the `deephaven/python_remote_file_source` directory contains the Python code, and the `js` directory contains the JavaScript code.  

The Python files have the following structure:  
`plugin_object.py` defines a simple Python class that can send messages to the client. This object can be modified to have other plugin functionality or replaced with a different object entirely, depending on the plugin's needs.  
`plugin_type.py` defines the Python type for the plugin (which is used for registration) and a simple message stream. These can be modified to handle different objects or messages. An initial message is sent from the Python side to the client, then additional messages can be sent back and forth.  
`register.py` registers the plugin with Deephaven. This file will not need to be modified for most plugins at the initial stages, but will need to be if the package is renamed or JavaScript files are moved.

The JavaScript files have the following structure:  
`PythonRemoteFileSourcePlugin.ts` registers the plugin with Deephaven. This contains the client equivalent of the type in `plugin_type.py` and these should be kept in sync.  
`PythonRemoteFileSourcePluginView.tsx` defines the plugin panel and message handling. This is where messages are received when sent from the Python side of the plugin. This file is a good starting point for adding more complex plugin functionality.  

Additionally, the `test` directory contains Python tests for the plugin.
It's recommended to use `tox` to run the tests, and the `tox.ini` file is included in the project.  

## Building the Plugin

Use the [`plugin_builder.py`](../../README.md#using-plugin_builderpy) from the root directory to build the plugin.

## Installing the Plugin

The plugin can be installed into a Deephaven instance with `pip install <wheel file>`.
The wheel file is stored in the `dist` directory after building the plugin.
Exactly how this is done will depend on how you are running Deephaven.
If using the venv created above, the plugin and server can be created with the following commands:
```sh
pip install deephaven-server
pip install dist/deephaven_python_remote_file_source-0.0.1.dev0-py3-none-any.whl
deephaven server
```
See the [plug-in documentation](https://deephaven.io/core/docs/how-to-guides/install-use-plugins/) for more information.

## Using the Plugin

Once the Deephaven server is running, the plugin should be available to use.

```python
from deephaven.python_remote_file_source_plugin import (
    PluginObject as DeephavenRemoteFileSourcePlugin,
)

obj = DeephavenRemoteFileSourcePlugin()
```

A panel should appear.
