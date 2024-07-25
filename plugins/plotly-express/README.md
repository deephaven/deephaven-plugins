# Deephaven Plugin for Charts

Custom implementation built on top of plotly express to make it compatible with deephaven tables.

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

Once you have the plugin installed and the server started, the recommended way to import the package mirrors plotly express:

```python
import deephaven.plot.express as dx
```

Then, you can create a table (or use an existing one) and start plotting

```python
from deephaven.column import int_col, string_col
import deephaven.plot.express as dx
from deephaven import new_table

source = new_table(
    [
        string_col("Categories", ["A", "B", "C"]),
        int_col("Values", [1, 3, 5]),
    ]
)

fig = dx.bar(table=source, x="Categories", y="Values")
```

## Docs
Docs can be built locally

Install the necessary dependencies:
```shell
pip install -r ../../sphinx_ext/sphinx-requirements.txt
pip install dist/deephaven_plugin_plotly_express-*.whl
```
then run the docs make script:
```shell
python make_docs.py
```

The files will be built into `docs/build/markdown`.
Note that these built files should not be committed to the repository.