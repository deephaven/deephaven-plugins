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
- Externalize `react`, `react-dom`, `redux`, `react-redux`, and any appropriate `@deephaven/*` packages if used
  - Add it as a `rollupOptions.external` in `vite.config.ts`

## Development

Start by setting up the python venv and pre-commit hooks.

### Pre-commit hooks/Python formatting

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

### Running Python tests

The above steps will also set up `tox` to run tests for the python plugins that support it.
You can run tests with the following command from the `plugins/<plugin>` directory:

```shell
tox -e py
```

### Running plugin against deephaven-core

#### Building Python plugins for development

Build and install the plugin wheels for the plugins, plotly and matplotlib in this example, into the deephaven-core venv.
See READMEs in the directories of the python plugins you're working with for specific packages to install for development with that plugin.

You can build the wheels using the following commands (or similar for other plugins) from the root directory of this repo:

```
python -m build --wheel plugins/matplotlib
python -m build --wheel plugins/plotly
```

#### Building JS plugins for development

Run `npm install` to install js dependencies.

You can build the js plugin(s) in watch mode from the root directory of this repo by using the following commands:

```shell
npm start # starts all plugins in watch mode
# OR
cd plugins/plugin
npm start # starts just the current directory plugin in watch mode
```

This will rebuild the plugin(s) any time the source changes. If you are mapping the folder directly via DHC start options, you will need to restart the deephaven-core server each time a change is made for the change to be picked up.

##### Serve Plugins

Vite supports a proxy configuration that can be used to point local DHC or DHE to another url when loading plugins. This has the benefit of not requiring a server restart when developing plugins. If you would like to use this option, you can run:

```shell
npm serve
```

This will serve the `plugins` directory at `http://localhost:5173`

The vite proxy can be configured in DHC with something like:

```typescript
proxy['/js-plugins'] = {
  target: 'http://localhost:5173',
  changeOrigin: true,
  rewrite: path => path.replace(/^\/js-plugins/, ''),
};
```

The proxy can be configured in DHE for DeephavenCommunity worker with:

```typescript
proxy['/iriside/worker-kind/DeephavenCommunity/plugins'] = {
  target: 'http://localhost:5173',
  changeOrigin: true,
  rewrite: path =>
    path.replace(/^\/iriside\/worker-kind\/DeephavenCommunity\/plugins/, ''),
};
```

#### Running deephaven-core

##### Build deephaven-core

Build [deephaven-core](https://github.com/deephaven/deephaven-core) using the directions [here](https://deephaven.io/core/docs/how-to-guides/launch-build/#build-and-run-deephaven).

##### Install python plugin wheels

Then, install the python plugin wheels for the plugins, plotly and matplotlib in this example, into the deephaven-core venv.
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

##### Start deephaven-core

Finally, start up Deephaven with the appropriate js-plugin flags using the path to your deephaven-plugins repo. For example, to start with the matplotlib and plotly plugins, start the server with the following command:

```
START_OPTS="-Ddeephaven.jsPlugins.@deephaven/js-plugin-matplotlib=<deephaven-plugins-path>/plugins/matploltib/src/js -Ddeephaven.jsPlugins.@deephaven/js-plugin-plotly=<deephaven-plugins-path>/plugins/plotly/src/js" ./gradlew server-jetty-app:run
```

The Deephaven IDE can then be opened at http://localhost:10000/ide/, with your plugins ready to use.
