# Deephaven Plugin Utilities

This is a Python package that stores cross-plugin utilities for building Deephaven plugins.
If the functions are only used during the build process, they should be added to `packaging` instead.
This is not a plugin on its own.

## Build

To create your build / development environment (skip the first two lines if you already have a venv):

```sh
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools
pip install build deephaven-plugin
```

To build:

```sh
python -m build --wheel
```

The wheel is stored in `dist/`.

To test within [deephaven-core](https://github.com/deephaven/deephaven-core), note where this wheel is stored (using `pwd`, for example).
Then, follow the directions in the top-level README.md to install the wheel into your Deephaven environment.
