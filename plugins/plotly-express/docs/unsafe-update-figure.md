# `unsafe_update_figure` Chart Customization

To customize a chart in a way that is not directly supported by Deephaven Plotly Express (`dx`), use the `unsafe_update_figure` parameter.  
Every `dx` chart is backed by a Plotly [`Figure`](https://plotly.com/python/figure-structure/). This object gets passed to `unsafe_update_figure` where it can be modified directly. See the [Plotly Figure Reference](https://plotly.com/python/reference/) docs for details on available `Figure` properties.

> [!WARNING]
> Update figure is marked "unsafe" because some modifications can entirely break your figure, and care must be taken.  
> `dx` maps `Table` columns to an index of a trace within `Figure.data` which will break if the trace order changes. Do not remove traces. Add new traces at the end of the list.

`unsafe_update_figure` accepts a function that takes a Plotly `Figure` object as input and optionally returns a modified `Figure` object. If a `Figure` is not returned, it is assumed that the input `Figure` has been modified in place.

## Examples

### Bar Line

Add a line to bars in a bar plot with `update_traces`.

```python order=bar_lined_plot,tips
import deephaven.plot.express as dx

tips = dx.data.tips()


def update(figure):
    # Add a gray line to the bars
    figure.update_traces(marker_line_width=3, marker_line_color="gray")


bar_lined_plot = dx.bar(tips, x="Day", unsafe_update_figure=update)
```

### Vertical Line

Add a vertical line to a plot with `add_vline`.

```python order=scatter_vline_plot,tips
import deephaven.plot.express as dx

tips = dx.data.tips()


def update(figure):
    # Add a dashed orange vertical line at x=20
    figure.add_vline(x=20, line_width=3, line_dash="dash", line_color="orange")


scatter_vline_plot = dx.scatter(
    tips, x="TotalBill", y="Tip", unsafe_update_figure=update
)
```

### Between Line Fill

Fill the area between lines in a line plot with `fill="tonexty"`.

```python order=filled_line_plot,dog_prices,my_table
import deephaven.plot.express as dx

my_table = dx.data.stocks()

# subset data for just DOG transactions and add upper and lower bounds
dog_prices = my_table.where("Sym = `DOG`").update_view(
    ["UpperPrice = Price + 5", "LowerPrice = Price - 5"]
)


def update(figure):
    # tonexty fills the area between the trace and the previous trace in the list
    figure.update_traces(
        fill="tonexty", fillcolor="rgba(123,67,0,0.3)", selector={"name": "LowerPrice"}
    )
    figure.update_traces(
        fill="tonexty", fillcolor="rgba(123,67,0,0.3)", selector={"name": "Price"}
    )


# Order matters for y since the fill is between the trace and the previous trace in the list
filled_line_plot = dx.line(
    dog_prices,
    x="Timestamp",
    y=["UpperPrice", "Price", "LowerPrice"],
    unsafe_update_figure=update,
)
```
