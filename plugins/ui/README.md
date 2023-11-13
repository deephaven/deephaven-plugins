# ⚠️This plugin is a work in progress and is subject to change. Use at your own risk.⚠️

# deephaven.ui Plugin

Plugin prototype for programmatic layouts and callbacks. Currently calling it `deephaven.ui` but that's not set in stone.

## Build

To create your build / development environment (skip the first two lines if you already have a venv):

```sh
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools
pip install build deephaven-plugin plotly
```

To build:

```sh
python -m build --wheel
```

The wheel is stored in `dist/`.

To test within [deephaven-core](https://github.com/deephaven/deephaven-core), note where this wheel is stored (using `pwd`, for example).
Then, follow the directions in the top-level README.md to install the wheel into your Deephaven environment.

To unit test, run the following command from the root of the repo:

```sh
tox -e py
```

## Usage

Once you have the JS and python plugins installed and the server started, you can use deephaven.ui. See [examples](examples/README.md) for examples.

## Logging

The Python library uses the [logging](https://docs.python.org/3/howto/logging.html) module to log messages. The default log level is `WARNING`. To change the log level for debugging, set the log level to `DEBUG`:

```python
import logging
import sys

# Have the root logger output to stdout instead of stderr
logging.basicConfig(stream=sys.stdout, level=logging.WARNING)

# Set the log level for the deephaven.ui logger to DEBUG
logging.getLogger("deephaven.ui").setLevel(level=logging.DEBUG)
```

You can also set the log level for specific modules if you want to see specific modules' debug messages or filter out other ones, e.g.

```python
# Only log warnings from deephaven.ui.hooks
logging.getLogger("deephaven.ui.hooks").setLevel(level=logging.WARNING)

# Log all debug messages from the render module specifically
logging.getLogger("deephaven.ui.render").setLevel(level=logging.DEBUG)
```
