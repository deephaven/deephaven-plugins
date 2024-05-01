# {{ cookiecutter.project_name }}

This is a Python plugin for Deephaven generated from a [deephaven-plugin](https://github.com/deephaven/deephaven-plugins) template.

Specifically, this plugin is a bidirectional widget plugin, which can send and receive messages on both the client and server.
The plugin works out of the box, demonstrates basic plugin structure, and can be used as a starting point for building more complex plugins.

## Plugin Structure

The `src` directory contains the Python and JavaScript code for the plugin.
Within the `src` directory, the {{ cookiecutter.python_project_name }} directory contains the Python code, and the `js` directory contains the JavaScript code.

The Python files have the following structure:
`{{ cookiecutter.__object_file_name }}.py` defines a simple Python class that can send messages to the client.
`{{ cookiecutter.__type_file_name }}.py` defines the Python type for the plugin (which is used for registration) and a simple message stream.
`js_plugin.py` defines the Python class that will be used to setup the JavaScript side of the plugin.
`register.py` registers the plugin with Deephaven.

The JavaScript files have the following structure:
`{{ cookiecutter.__js_plugin_obj }}.ts` registers the plugin with Deephaven.
`{{ cookiecutter.__js_plugin_view_obj }}.tsx` defines the plugin panel and message handling.

Additionally, the `test` directory contains Python tests for the plugin. This demonstrates how the embedded Deephaven server can be used in tests.
It's recommended to use `tox` to run the tests, and the `tox.ini` file is included in the project.

## Building the Plugin

To build the plugin, you will need `npm` and `python` installed, as well as the `build` package for Python.
The python venv can be created and the recommended packages installed with the following commands:
```sh
cd {{ cookiecutter.python_project_name }}
python -m venv .venv
source .venv/bin/activate
pip install --upgrade -r requirements.txt
```

Build the JavaScript plugin from the `src/js` directory:

```sh
cd src/js
npm install
npm run build
```

Then, build the Python plugin from the top-level directory:

```sh
cd ../..
python -m build --wheel
```

The built wheel file will be located in the `dist` directory.

## Installing the Plugin

The plugin can be installed into a Deephaven instance with `pip install <wheel file>`.
Exactly how this is done will depend on how you are running Deephaven.
See the [plug-in documentation](https://deephaven.io/core/docs/how-to-guides/use-plugins/) for more information.

## Using the Plugin

Once the Deephaven server is running, the plugin should be available to use.

```python
from {{ cookiecutter.python_project_name }} import {{ cookiecutter.__object_name }}

obj = {{ cookiecutter.__object_name }}()
```

A panel should appear. You can now use the object to send messages to the client.

```python
obj.send_message("Hello, world!")
```
