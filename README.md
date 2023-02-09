# Deephaven Plugin for Charts

Custom implementation built on top of plotly express to make it compatible with deephaven tables.

## Build

To create your build / development environment:

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
Then, follow the directions in the [deephaven-js-plugins](https://github.com/deephaven/deephaven-js-plugins) repo.

