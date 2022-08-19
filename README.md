# Deephaven Plugin for Plotly

The Deephaven Plugin for Plotly. Allows for opening Plotly plots in a Deephaven environment. Any Plotly plot
should be viewable by default. For example:

### Line Plot
```python
# TODO
```

### Scatter Plot
Scatter plots require data in a different format that Line plots, so need to pass in the data differently.
```python
# TODO
```

### Multiple Series
It's possible to have multiple kinds of series in the same figure. Here is an example driving a line and a scatter plot:
```python
# TODO
```

## Build

To create your build / development environment:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip setuptools
pip install build deephaven-plugin plotly
```

To build:

```sh
python -m build --wheel
```

produces the wheel into `dist/`.