# Deephaven Python Remote File Source Plugin

A Deephaven bi-directional plugin to allow sourcing Python imports from a remote file source. It consists of a Python plugin installed and then instantiated in a Deephaven Core / Core+ worker. When a client connects to the plugin, a custom Python `sys.meta_path` finder and loader are registered that will send messages to the client to request content for loading modules.

## Plugin Structure

The `src` directory contains the Python and JavaScript code for the plugin.  
Within the `src` directory, the `deephaven/python_remote_file_source` directory contains the Python code, and the `js` directory contains the JavaScript code.  

The Python files have the following structure:  
`plugin_object.py` defines a simple Python class that can send messages to the client.
`plugin_type.py` defines the Python type for the plugin (which is used for registration) and a simple message stream. An initial message is sent from the Python side to the client, then additional messages can be sent back and forth.  
`register.py` registers the plugin with Deephaven. This file will not need to be modified for most plugins at the initial stages, but will need to be if the package is renamed or JavaScript files are moved.

The JavaScript files have the following structure:  
`PythonRemoteFileSourcePlugin.ts` registers the plugin with Deephaven. This contains the client equivalent of the type in `plugin_type.py` and these should be kept in sync.  
`PythonRemoteFileSourcePluginView.tsx` defines the plugin panel and message handling. This is where messages are received when sent from the Python side of the plugin. 

Additionally, the `test` directory contains Python tests for the plugin.
It's recommended to use `tox` to run the tests, and the `tox.ini` file is included in the project.  

## Building the Plugin

1. Install dependencies
```sh
# Install js dependencies
nvm install
npm install

# Setup python venv and install dependencies
python -m venv .venv
source .venv/bin/activate
pip install --upgrade -r requirements.txt
pip install click watchdog deephaven-server
```

2. Build the python-remote-file-source plugin
```sh
python tools/plugin_builder.py python-remote-file-source
```

See [`plugin_builder.py`](../../README.md#using-plugin_builderpy) docs for additional options.

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

A panel should appear for the plugin object showing the current configuration of the plugin. Any top-level module names that have been configured for the plugin to source remotely should show in a searchable list view.

## Testing the Plugin


1. Build the plugin (see [Building the Plugin](#building-the-plugin)).
2. Start the server:

   ```sh
   python tools/plugin_builder.py \
    python-remote-file-source \
    --server \
    --server-arg \
    --jvm-args="-Dauthentication.psk=plugins.repo.test -Dprocess.info.system-info.enabled=false"
   ```
> Note that the `-Dprocess.info.system-info.enabled=false` is only required for M1 / M2 Mac.

3. Before running tests for the first time, install dependencies for the test client:
   ```sh
   cd plugins/python-remote-file-source/test-node-client
   nvm install
   npm install
   cd -
   ```

