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
npm start # starts all plugins in watch mode and serves the plugins directory
# OR
cd plugins/plugin
npm start # starts just the current directory plugin in watch mode
```

This will rebuild the plugin(s) any time the source changes. If you are mapping the folder directly via DHC start options, you will need to restart the deephaven-core server each time a change is made for the change to be picked up.

##### Serve Plugins

Running `npm start` will also will also serve the `plugins` directory using Vite's local dev server. The default host + port is `http://localhost:4100`, but the port can be configured via the `PORT` env variable.

DHC and DHE can be configured when running locally to target the local `plugins` server. This has the benefit of not requiring a server restart when developing plugins. See [DHC](https://github.com/deephaven/web-client-ui/blob/main/README.md#local-plugin-development) or [DHE](https://github.com/deephaven-ent/iris/blob/rc/grizzly/web/client-ui/README.md#local-plugin-development) README for details on using this configuration.

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

### Running with Docker container

Instead of running deephaven-core from source and building all plugins yourself, you can run a docker container that automatically builds the plugins and installs them in an instance of deephaven-core, then serving it up at http://localhost:10000. JS Plugins are specified in [./docker/config/deephaven.prop](./docker/config/deephaven.prop) as to which ones are loaded. Run `npm run docker` to start up the docker container, or just run `docker compose up --build` if you do not have `npm` installed. It will open at port 10000 by default, and use the demo data from [./docker/data](./docker/data) as the data folder.
If you wish to change the port it opens on, you can specify the `DEEPHAVEN_PORT` environment variable. For example, to open on port 11000, you would run `DEEPHAVEN_PORT=11000 npm run docker`.
If you wish to customize what data is used for the docker container, you can create a [docker-compose.override.yml file](https://docs.docker.com/compose/multiple-compose-files/merge/) to override the default values. For example, if you want to use `/path/to/mydata/` as the data folder instead of the default, you would add a `volumes` property to your docker-compose.override.yml:

```yml
version: '3'

services:
  deephaven-plugins:
    volumes:
      # Specifying a data volume here will override the default data folder, and you will not be able to access the default data files (such as the demo data)
      - /path/to/mydata/:/data
```

## Release Management

In order to manage changelogs, version bumps and github releases, we use cocogitto, or `cog` for short. [https://github.com/cocogitto/cocogitto]

The main configuration file is cog.toml, which we run using some helper scripts located in the `tools/` directory.

### Cutting a New Release

In order to release a given plugin, you will run the script: `tools/release.sh <pluginName>`.  
The must be done on a branch named `main` and will publish to the `git remote -v` named `origin` (you can do test releases on your fork).

`tools/release.sh` will validate that your system has the necessary software installed and setup correctly, then invoke `cog bump --auto --package <pluginName>`,  
which will invoke the necessary programs and scripts to automate a version bump and github release.

During development, it is expected that all commit message will adhere to `conventional commit` ([https://www.conventionalcommits.org/en/about/]) formats.  
`cog` will then uses your commit messages to compute a new version number, assemble a changelog, update our version in source code, create and push git tags, and perform a github release for the given plugin.

See `cog.toml` to understand the full details of the release process.

### Updating Versions in Source Code

As part of the release process, `cog` will, per our `cog.toml` configuration, invoke `tools/update_version.sh <packageName> <newVersion>`, which is a script that uses `sed` to update a plugin's version number in whatever source file we happen to use as the source of truth for version information in the given plugin.

*[WARNING]* If you change where the source of truth for a plugin's version is located, you must update `tools/update_version.sh` to update the correct file with a new version number.

We use `tools/update_version.sh` to remove any `.dev0` "developer version" suffix before creating a release, and to put the `.dev0` version suffix back after completing the release.
