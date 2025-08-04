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

For a more automated development experience, see the [plugin_builder.py](#using-plugin_builderpy) section for a script that can help automate some of the setup steps.

Black and blacken-docs formatting, pyright type checking, and ruff linting is setup through a pre-commit hook.
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

To bypass the pre-commit hook, you can commit with the `--no-verify` flag, for example:

```shell
git commit --no-verify -m "commit message"`
```

### Running end-to-end tests

We use [Playwright](https://playwright.dev/) for end-to-end tests. We test against Chrome, Firefox, and Webkit (Safari). Snapshots from E2E tests are only run against Linux so they can be validated in CI.

You should be able to pass arguments to these commands as if you were running Playwright via CLI directly. For example, to test only `matplotlib.spec.ts` you could run `npm run e2e:docker -- ./tests/matplotlib.spec.ts`, or to test only `matplotlib.spec.ts` in Firefox, you could run `npm run e2e:docker -- --project firefox ./tests/matplotlib.spec.ts`. See [Playwright CLI](https://playwright.dev/docs/test-cli) for more details.

It is highly recommended to use `npm run e2e:docker` (instead of `npm run e2e`) as CI also uses the same environment. You can also use `npm run e2e:update-snapshots` to regenerate snapshots in said environment. If you only need to update the snapshots for a specific test, you can run `npm run e2e:update-snapshots -- ./tests/ui.spec.ts` to update only the snapshots for that test and save some time.

If you want to run tests locally (which may be easier for debugging or creating new tests), run Playwright in [UI Mode](https://playwright.dev/docs/test-ui-mode) with `npm run e2e:ui`. This will allow you to run each test individually, see the browser as it runs it, inspect the console, evaluate locators, etc. **Note**: There may be a permissions issue starting up Playwright in local mode after running it in docker. If you encounter this, delete the previous `test-results` folder using `sudo rm -rf test-results`.

### Running Python tests

The [venv setup](#pre-commit-hookspython-formatting) steps will also set up `tox` to run tests for the python plugins that support it.
Note that `tox` sets up an isolated environment for running tests.  
Be default, `tox` will run against Python 3.8, which will need to be installed on your system before running tests.
You can run tests with the following command from the `plugins/<plugin>` directory:

```shell
tox -e py
```

> [!IMPORTANT]
> Linux, and possibly other setups such as MacOS depending on method, may require additional packages to be installed to run Python 3.8.
>
> ```shell
> sudo apt install python3.8 python3.8-distutils libpython3.8
> # or just full install although it will include more packages than necessary
> sudo apt install python3.8-full
> ```

You can also run tests against a specific version of python by appending the version to `py`  
This assumes that the version of Python you're targeting is installed on your system.  
For example, to run tests against Python 3.12, run:

```shell
tox -e py3.12
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
# build all plugins in watch mode and serves the plugins directory
npm start
```

This will serve the plugins using Vite's dev server. You can optionally provide a `--scope` argument to filter which .js plugins will be built in watch mode:

e.g. To run all packages containing "theme" in the name:

```shell
# include a scope to filter which plugins to build in watch mode
npm start -- --scope *theme*
```

Alternatively, you can also run individual plugins in watch mode. Note that this will only build the plugin and won't start the dev server.

```shell
# build a single plugin in watch mode
cd plugins/plugin
npm start
```

Note that if you are mapping the `plugins` folder directly via DHC start options, the plugins dev server won't actually be used, and you will need to restart the deephaven-core server each time a change is made for the change to be picked up.

##### Serve Plugins

Running `npm start` will also will also serve the `plugins` directory using Vite's local dev server. The default host + port is `http://localhost:4100`, but the port can be configured via the `PORT` env variable.

DHC and DHE can be configured when running locally to target the local `plugins` server. This has the benefit of not requiring a server restart when developing plugins. See [DHC](https://github.com/deephaven/web-client-ui/blob/main/README.md#local-plugin-development) or [DHE](https://github.com/deephaven-ent/iris/blob/rc/grizzly/web/client-ui/README.md#local-plugin-development) README for details on using this configuration.

#### Running deephaven-core

##### Build deephaven-core

Build [deephaven-core](https://github.com/deephaven/deephaven-core) using the directions [here](https://deephaven.io/core/docs/getting-started/launch-build/#build-and-run-deephaven).

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

pip install <deephaven-plugins-path>/plugins/_/dist/_.whl

```

If you're reinstalling the python wheels without a version bump (generally for the purpose of development), you'll want to add the `--force-reinstall` tag. The `--no-deps` tag is also recommended as `--force-reinstall` will update all the dependencies as well, which is generally unnecessary.
For example, on reinstalls the above command becomes

```

pip install --force-reinstall --no-deps <deephaven-plugins-path>/plugins/_/dist/_.whl

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

### Using plugin_builder.py

The `tools/plugin_builder.py` script is a utility script that makes common plugin development cases easier.
The tool uses `click` for command line argument parsing and `watchdog` for file watching.  
Skip the venv setup if you already have one

```shell
python -m venv .venv
source .venv/bin/activate
pip install --upgrade -r requirements.txt
pip install click watchdog
```

The script can then be used to help set up your venv.
This command will setup the basic dependencies for building plugins:

```shell
python tools/plugin_builder.py --configure=min
```

This command will setup the basic dependencies, plus optional ones for building docs and running the server:

```shell
python tools/plugin_builder.py --configure=full
```

The simplest way to use the script is to run it with no arguments. This will build and install all plugins:

```shell
python tools/plugin_builder.py
```

To target a specific plugin or plugins, pass the name or names of the plugins as arguments:

```shell
python tools/plugin_builder.py plotly-express ui
```

This targeting works for all commands that target the plugins directly, such as `--docs` or `--install`.

To build docs, pass the `--docs` flag.  
First install the necessary dependencies (if setup with `--configure=full` this is already done)

```shell
pip install -r sphinx_ext/sphinx-requirements.txt
```

This example builds the docs for the `ui` plugin:

```shell
python tools/plugin_builder.py --docs ui
```

It is necessary to install the latest version of the plugin you're building docs for before building the docs themselves.  
Run with `--install` or `--reinstall` to install the plugin (depending on if you're installing a new version or not)
before building the docs.

```shell
python tools/plugin_builder.py --docs --install ui
```

After the first time install, you can drop the `--install` flag and just run the script with `--docs` unless you have plugin changes.

You can also re-generate the snapshots for the docs by passing the `--snapshots` flag. This should be done when new code blocks are added to the docs.

This example will build the docs for the `ui` plugin and re-generate the snapshots:

```shell
python tools/plugin_builder.py --docs --snapshots ui
```

To run the server, pass the `--server` flag.  
First install `deephaven-server` if it is not already installed (if setup with `--configure=full` this is already done):

```shell
pip install deephaven-server
```

This example reinstalls the `plotly-express` plugin, then starts the server:

```shell
python tools/plugin_builder.py --reinstall --server plotly-express
```

Reinstall will force reinstall the plugins (but only the plugins, not the dependencies), which is useful if there are changes to the plugins but without a bumped version number.

To run the server with specific args, pass the `--server-arg` flag.  
By default, the server is passed the `--no-browser` flag, which will prevent the server from opening a browser window.  
This example will override that default and open the browser:

```shell
python tools/plugin_builder.py --server-arg --browser
```

Similar to other arguments, this argument can be shortened to `-sa`.  
This example changes the port and psk and reinstalls the `ui` plugin before starting the server:

```shell
python tools/plugin_builder.py -r -sa --port=9999 -sa --jvm-args="-Dauthentication.psk=mypsk" ui
```

The js plugins can be built with the `--js` flag. This will build all js plugins or target specific ones if specified.
This example reinstalls the `ui` plugin with js, and starts the server with shorthand flags.

```shell
python tools/plugin_builder.py --js -r -s ui
```

Enable `watch` mode with the `--watch` flag. This will watch the project for changes and rerun the script with the same arguments.  
Note that when using `--watch`, the script will not exit until stopped manually.
For example, to watch the `plotly-express` plugin for changes and rebuild the docs when changes are made:

```shell
python tools/plugin_builder.py --docs --watch plotly-express
```

This example reinstalls the `ui` plugin with js, starts the server, and watches for changes.

```shell
python tools/plugin_builder.py -jrsw ui
```

### Previewing Docs

To preview the docs, run the following command from the root directory of this repo:

```shell
npm run docs
```

This will use the source directories and serve the preview docs at `http://localhost:3001`. Note that this will not include the API reference docs which are only part of the fully built docs with `plugin_builder.py`.

To build and preview docs from the `build` directory, run the following commands:

```shell
python tools/plugin_builder.py -d ui plotly-express
BUILT=true npm run docs
```

### Snapshotting docs with npm

You can also use `npm` to snapshot the docs instead of using the `--snapshots` flag in `plugin_builder.py`. Just run `npm run update-doc-snapshots` from the root directory of this repo. This will run the snapshotting script and update the snapshots in the `docs` directory.

## Release Management

In order to manage changelogs, version bumps and github releases, we use [cocogitto](https://github.com/cocogitto/cocogitto), or `cog` for short. Follow the [Installation instructions](https://github.com/cocogitto/cocogitto?tab=readme-ov-file#installation) to install `cog`. For Linux and Windows, we recommend using [cargo](https://doc.rust-lang.org/cargo/getting-started/installation.html) to install. For MacOS, we recommend using [brew](https://brew.sh/).

The main configuration file is cog.toml, which we run using some helper scripts located in the `tools/` directory.

You will also need the [GitHub CLI](https://cli.github.com/) tool installed to create and push releases to GitHub.

### Cutting a New Release

In order to release a given plugin, you will run the script: `tools/release.sh <pluginName>`.  
This must be done on a branch named `main` and will publish to the `git remote -v` named `origin` (you can do test releases on your fork).

`tools/release.sh <pluginName>` will validate that your system has the necessary software installed and setup correctly, then invoke `cog bump --auto --package <pluginName>`,  
which will invoke the necessary programs and scripts to automate a version bump and GitHub release.

During development, it is expected that all commit message will adhere to [conventional commits]([https://www.conventionalcommits.org/en/about/]).
`cog` will then uses your commit messages to compute a new version number, assemble a changelog, update our version in source code, create and push git tags, and perform a GitHub release for the given plugin.

See `cog.toml` to understand the full details of the release process.

After you have successfully run `tools/release.sh` once, you should be able to directly invoke `cog bump --auto --package <pluginName>`, or omit the `--package` to release all plugins which have updated files.

### Updating Versions in Source Code

As part of the release process, `cog` will, per our `cog.toml` configuration, invoke `tools/update_version.sh <packageName> <newVersion>`, which is a script that uses `sed` to update a plugin's version number in whatever source file we happen to use as the source of truth for version information in the given plugin.

_[WARNING]_ If you change where the source of truth for a plugin's version is located, you must update `tools/update_version.sh` to update the correct file with a new version number.

We use `tools/update_version.sh` to remove any `.dev0` "developer version" suffix before creating a release, and to put the `.dev0` version suffix back after completing the release.
