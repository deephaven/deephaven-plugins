# Multiple Axes

Create plots with multiple axes by specifying `xaxis_sequence` or `yaxis_sequence`. Multiple axis plots are useful for visualizing the relationship between variables that have very different units or scales. In these cases, multiple axes can help display their relationship without forcing one variable to conform to the scale of the other.

## Examples

### Multiple columns

When two or more response variables appear in separate columns, pass their column names to the `x` or `y` arguments. The resulting chart will have shared axes.

```python order=line_plot_shared,brazil,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder()

# get a specific country
brazil = gapminder.where("Country == `Brazil`")

# population and per capita gdp have very different scales and units
line_plot_shared = dx.line(brazil, x="Year", y=["Pop", "GdpPerCap"])
```

The `xaxis_sequence` or `yaxis_sequence` arguments can be used to create multiple axes.

```python order=line_plot_multi,brazil,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder()

# get a specific country
brazil = gapminder.where("Country == `Brazil`")

# specify multiple y-axis columns and split axes with yaxis_sequence
line_plot_multi = dx.line(brazil, x="Year", y=["Pop", "GdpPerCap"], yaxis_sequence=[1, 2])
```

### Use `by` with multiple axes

When a single response variable has observations from several groups of data, use the `by` parameter to specify the grouping column.

```python order=line_plot_by,cat_dog,stocks
import deephaven.plot.express as dx
stocks = dx.data.stocks()

# subset to get two symbols
cat_dog = stocks.where("Sym in `CAT`, `DOG`")

# use `by` to specify the grouping column and order axes left to right with yaxis_sequence
line_plot_by = dx.line(cat_dog, x="Timestamp", y="Price", by="Sym", yaxis_sequence=[1, 2])
```

### Layering

Finally, plots can be layered to achieve multiple axes. Use the `dx.layer` function to accomplish this.

```python order=line_plot_layered,fish,bird,stocks
import deephaven.plot.express as dx
stocks = dx.data.stocks()

# subset to get two tables with a shared x-axis
fish = stocks.where("Sym == `FISH`")
bird = stocks.where("Sym == `BIRD`")

# create multiple axes using dx.layer and specifying yaxis_sequence
line_plot_layered = dx.layer(
    dx.line(fish, x="Timestamp", y="Price", yaxis_sequence=1),
    dx.line(bird, x="Timestamp", y="Price", yaxis_sequence=2)
)
```
