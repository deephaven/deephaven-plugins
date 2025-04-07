# Deephaven Express UI Filtering

## Options

1. Wrapper around table, similar to current oneClick API, e.g. `p = dx.line(one_click(t), x="x", y="y")`

2. Parameter on the plot: `dx.line(t, x="Timestamp", y="Last", input_filters=["Sym"])`

3. Wrapper around the plot, e.g. `p = ui.filterable(table, lambda t: dx.line(...))`

4. State object `[state] = ui.dashboard_inputs()`
