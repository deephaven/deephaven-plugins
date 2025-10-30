# Deephaven Python Remote File Source Plugin

A Deephaven bi-directional plugin to allow sourcing Python imports from a remote file source. It consists of a Python plugin installed and then instantiated in a Deephaven Core / Core+ worker. When a client connects to the plugin, a custom Python `sys.meta_path` finder and loader are registered that will send messages to the client to request content for loading modules.

## Plugin Messages
Bi-directional communication between the server plugin and a client uses JSON-RPC.

### JSON-RPC Messages

The plugin uses the following JSON-RPC v2 messages for communication between the Python server and the client:

#### Request: `request_plugin_info`
**Direction:** Client → Server

Returns a list of top-level module names available for remote import.

**Example:**
```json
{
   "jsonrpc": "2.0",
   "id": "<unique id>",
   "method": "request_plugin_info",
   "params": {}
}
```

**Response:**
```json
{
   "jsonrpc": "2.0",
   "id": "<same id>",
   "result": {
      "full_names": ["module1", "module2", ...]
   }
}
```

#### Request: `set_connection_id`
**Direction:** Client → Server

Sets the connection id on the MessageStream and tells the MessageStream it can register a `RemoteMetaPathFinder` to source Python imports for scripts run with a matching execution context connection id.

**Example:**
```json
{
   "jsonrpc": "2.0",
   "id": "<unique id>",
   "method": "set_connection_id",
   "params": {"id": "<connection id>"}
}
```

**Response:**
```json
{
   "jsonrpc": "2.0",
   "id": "<same id>",
   "result": null
}
```

#### Request: `fetch_module`
**Direction:** Server → Client

Requests the source code and file path for a Python module from the client. Used by the server to fetch remote modules for import.

**Example:**
```json
{
   "jsonrpc": "2.0",
   "id": "<unique id>",
   "method": "fetch_module",
   "params": {"module_name": "some.module.name"}
}
```

**Response:**
```json
{
   "jsonrpc": "2.0",
   "id": "<same id>",
   "result": {
      "filepath": "/path/to/module.py",
      "source": "<python source code as string>"
   }
}
```
If the module spec is not found `result` will be `None`. The `filepath` property will contain a filesystem path or `<script>` if no associated path can be provided. The `source` property will either contain the source of the module, or `None` if no content exists.

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
pip install plugins/python-remote-file-source/dist/deephaven_plugin_python_remote_file_source-*.whl
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

