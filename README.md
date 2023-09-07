# Plugin modules

The `plugins` folder contains internally developed Plugin modules. 
Each folder contains either a python plugin, a javascript plugin, or both.
The python plugin is housed in the top level of each plugin folder, and the javascript plugin is housed in the `src/js` 
folder within each individual plugin folder.

## Python Plugins
Each python plugin should have code stored in a non-colliding path within the `deephaven` folder. Generally, this path
will be `deephaven/plugin/<pluginName>`, but it may be different depending on the plugin. For example, the `plotly-express` 
plugin is housed in `deephaven/plot/express` so that it has a structure that mirrors Plotly Express.

Each python plugin should also have at least the following:
- `pyproject.toml`
- `setup.cfg`
- `README.md`
- Independently versioned
- A github workflow that builds the plugin and publishes it to pypi
- Black formatting applied to all python files

## JS Plugins
Each js plugin should be the following:

- Based off the [JS Module Plugin template](https://github.com/deephaven/deephaven-js-plugin-template/)
- Package name `@deephaven/js-plugin-<folderName>`
- Independent versioning, `npm install`, `npm run build`
- Exported as a CJS bundle
- Externalize `react`, `react-dom`, `redux`, and `react-redux` if used

## Development
Start by setting up the python venv and pre-commit hooks.

Black and blacken-docs formatting is setup through a pre-commit hook. 
To install the pre-commit hooks, run the following commands from the root directory of this repo:
```shell
python -m venv .venv
source .venv/bin/activate
pip install --upgrade -r requirements.txt
pre-commit install
``` 

This will setup a venv, activate it, and install the pre-commit hooks. The hooks will run on every commit.
You can verify that pre-commit is setup by testing with the following:

```shell
pre-commit run --all-files
```
All steps should pass.

The above steps will also set up `tox` to run tests for the python plugins that support it. 
You can run tests with the following command from the `plugins/<plugin>` directory:
```shell
tox -e py
```

Then, run `npm install` to install js dependencies.

You can build the js plugin(s) in watch mode from the root directory of this repo by using the following commands:

```shell
npm start # starts all plugins in watch mode
# OR
cd plugins/plugin
npm start # starts just the current directory plugin in watch mode
```

This will rebuild the plugin(s) any time the source changes. Changes can be reflected by refreshing the Deephaven web IDE page after the build finishes.

To build for publishing, run

```shell
npm run build
```

Next, create a `manifest.json` file in the `plugins` directory of this project or modify the existing one.

In it, there should be JSON containing a plugins object containing metadata about all plugins to use, e.g.:
```
{
  "plugins": [
    {
      /** Name of the plugin, and relative path from this manifest to the plugin's root folder. */
      "name": "...", 

      /** Version of the plugin. */
      "version": "...", 

      /** Location of the primary entry point for the plugin. */
      "main": "..." 
    },
    ...
  ]
}
```

For example, if using matplotlib and plotly plugins with version 0.1.0, the file looks like this:

```
{
    "plugins": [
      { "name": "matplotlib", "version": "0.1.0", "main": "src/js/dist/index.js" },
      { "name": "plotly", "version": "0.1.0", "main": "src/js/dist/index.js" }
    ]
}
```

Then, build [deephaven-core](https://github.com/deephaven/deephaven-core) using the directions [here](https://deephaven.io/core/docs/how-to-guides/launch-build/#build-and-run-deephaven).

Finally, install the plugin wheels for the plugins, plotly and matplotlib in this example, into the deephaven-core venv.
See READMEs in the directories of the python plugins you're working with for specific packages to install for development with that plugin.

You can build the wheels using the following commands (or similar for other plugins) from the root directory of this repo:
```
python -m build --wheel plugins/matplotlib
python -m build --wheel plugins/plotly
```

Substitute in your local wheel locations for the wheels in the following command.
Note that `<deephaven-plugins-path>` is the path to this repo.
```
pip install <deephaven-plugins-path>/plotly/plugins/dist/deephaven_plugin_plotly-0.0.1.dev2-py3-none-any.whl <deephaven-plugins-path>/plugins/matplotlib/dist/deephaven_plugin_matplotlib-0.1.1-py3-none-any.whl
```

If installing multiple wheels, you can use the following shorthand to install all built wheels:
```
pip install <deephaven-plugins-path>/plugins/*/dist/*.whl
```

If you're reinstalling the python wheels without a version bump (generally for the purpose of development), you'll want to add the `--force-reinstall` tag. The `--no-deps` tag is also recommended as `--force-reinstall` will update all the dependencies as well, which is generally unnecessary.
For example, on reinstalls the above command becomes 
```
pip install --force-reinstall --no-deps <deephaven-plugins-path>/plugins/*/dist/*.whl
```

Using the path to your local deephaven-js-plugins repo where the manifest.json is contained (which will be in the `plugins` directory if you followed the steps above), start the server with the following command:

```
START_OPTS="-Ddeephaven.jsPlugins.resourceBase=<deephaven-plugins-path>deephaven-js-plugins/plugins" ./gradlew server-jetty-app:run
```

The deephaven IDE can then be opened at http://localhost:10000/ide/, with your plugins ready to use.
