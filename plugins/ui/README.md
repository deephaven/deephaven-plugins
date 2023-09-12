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
Once you have the JS and python plugins installed and the server started, you can use deephaven.ui. See [EXAMPLES.md](EXAMPLES.md) for examples.
