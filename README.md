# Plugin modules

This folder contains internally developed JS Plugin modules. Each plugin should be the following:

- Based off the [JS Module Plugin template](https://github.com/deephaven/deephaven-js-plugin-template/)
- Package name `@deephaven/js-plugin-<folderName>`
- Independent versioning, `npm install`, `npm run build`

## Development

Start by building the plugins from the root directory of this repo:
```
npm install
npm build
```

Next, create a `manifest.json` file in the root directory of this project.

In it, there should be JSON containing a plugins object. This plugins object contains of list of plugins with their name, version, and location (main).

For example, if using matplotlib and plotly plugins with version 0.1.0, the file looks like this:
```
{
    "plugins": [
      { "name": "matplotlib", "version": "0.1.0", "main": "dist/index.js" },
      { "name": "plotly", "version": "0.1.0", "main": "dist/index.js" }
    ]
}
```

Then, build [deephaven-core](https://github.com/deephaven/deephaven-core). The directions below are relative to the root directory of your deephaven-core repo, but you can create the venv elsewhere if you'd like.

Within the deephaven-core repo, create a venv.
```
python -m venv .venv
source .venv/bin/activate
```

Then, build and install the python server wheels. The version number will depend on which release `deephaven-core` is currently on.
```
./gradlew :py-server:assemble :py-embedded-server:assemble

pip install py/server/build/wheel/deephaven_core-0.20.0-py3-none-any.whl py/embedded-server/build/wheel/deephaven_server-0.20.0-py3-none-any.whl 
```

Finally, install the plugin wheels for the plugins, plotly and matplotlib in this example. See directions in the repos for the python plugins you're working with to learn how to build the wheels. Substitute in your local wheel locations.
```
pip install <plotly-plugin-path>/deephaven-plugin-plotly/dist/deephaven_plugin_plotly-0.0.1.dev2-py3-none-any.whl <matplotlib-plugin-path>/deephaven-plugin-matplotlib/dist/deephaven_plugin_matplotlib-0.1.1-py3-none-any.whl
```

Using the path to your local deephaven-js-plugins repo where the manifest.json is contained, start the server with the following command:
```
START_OPTS="-Ddeephaven.jsPlugins.resourceBase=<js-plugins-path>/deephaven-js-plugins" ./gradlew server-jetty-app:run
```
The deephaven IDE can then be opened at http://localhost:10000/ide/, with your plugins ready to use.