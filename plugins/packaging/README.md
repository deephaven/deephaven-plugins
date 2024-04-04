# Deephaven Plugin Packaging

This is a Python package that stores cross-plugin utilities for packaging Deephaven plugins.
This package is used by the Deephaven plugin build process to create wheels for plugins.
If the functions need to be available at runtime, they should be added to `utilities` instead.
This is not a plugin on its own.

## Build

To create your build / development environment (skip the first two lines if you already have a venv):

```sh
python -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools
pip install build
```

To build:

```sh
python -m build --wheel
```

The wheel is stored in `dist/`.
