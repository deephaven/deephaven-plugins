# Deephaven Plugin for matplotlib

The Deephaven Plugin for matplotlib.

Currently in development.

## Build

To create your build / development environment:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools
pip install build deephaven-plugin matplotlib
```

To build:

```sh
python -m build --wheel
```

produces the wheel into `dist/`.