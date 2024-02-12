# Deephaven Plugin for Ag-Grid

Display Deephaven tables using Ag-Grid.

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

To unit test, run the following command from the root of the repo:

```sh
tox -e py
```

## Usage

Once you have the plugin installed and the server started, you can wrap a Deephaven table with the `AgGrid` plugin:

```python
from deephaven import new_table
from deephaven.column import string_col, double_col
from deephaven.aggrid import AgGrid

_result = new_table(
    [
        double_col("Doubles", [3.1, 5.45, -1.0]),
        string_col("Strings", ["Creating", "New", "Tables"]),
    ]
)

ag_result = AgGrid(_result)
```
