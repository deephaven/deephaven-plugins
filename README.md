# Deephaven Plugin for Plotly

The Deephaven Plugin for Plotly. Allows for opening Plotly plots in a Deephaven environment. Any Plotly plot
should be viewable by default. For example:

### Scatter Plot
```python
import plotly.express as px
df = px.data.iris()
fig = px.scatter(df, x="sepal_width", y="sepal_length", color="species",
                 size='petal_length', hover_data=['petal_width'])
```

### Box Plot
```python
import plotly.express as px
df = px.data.tips()
fig = px.box(df, x="time", y="total_bill")
```

### Multiple Series
It's possible to have multiple kinds of series in the same figure. Here is an example driving a line and a bar plot:
```python
from plotly.subplots import make_subplots
import plotly.graph_objects as go
fig = make_subplots(rows=1, cols=2)
fig.add_trace(
    go.Scatter(x=[1, 2, 3], y=[4, 5, 6]),
    row=1, col=1)
fig.add_trace(
    go.Bar(x=[1, 2, 3], y=[4, 5, 6], marker=dict(color=[4, 5, 6], coloraxis="coloraxis")),
    row=1, col=2)
fig.update_layout(title_text="Side By Side Subplots", showlegend=False)
```

### Plot data from a Deephaven table
```python
from deephaven import empty_table, numpy
import plotly.express as px
t = empty_table(300).update(formulas=["X = (double)i", "Y = Math.sin(X)"])
data = numpy.to_numpy(t, ["X", "Y"])
fig = px.line(x=data[:,0], y=data[:,1])
```

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

