# Multiple Axes

You can create multiple x or y axes in a single plot in a few different ways, from columns or from paritions, or as layers from multiple plots. Passing multiple columns to the `x` or `y` parameters along with setting a `yaxis_sequence` or `xaxis_sequence` will create multiple axes. Using the `by` parameter along with an axis sequence can also create multiple axes, with one for each unique value in the column. The `layer` function can also be used to create multiple axes.

## Examples

### Multiple columns

When two or more response variables appear in separate columns, passing multiple column names to `x` or `y` is the recommended way to create multiple axes.

```python order=line_plot_multi,brazil,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import a ticking version of the Gapminder dataset

# get a specific country
brazil = gapminder.where("country == `Brazil`")

# specify multiple y-axis columns and order axes left to right with yaxis_sequence
line_plot_multi = dx.line(brazil, x="year", y=["pop", "gdpPercap"], yaxis_sequence=[1, 2])
```

### The `by` parameter

When a single response variable has observations from several groups of data, use the `by` parameter to specify the grouping column.

```python order=line_plot_by,cat_dog,stocks
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import the example stock market data set

# subset to get two symbols
cat_dog = stocks.where("sym in `CAT`, `DOG`")

# use `by` to specify the grouping column and order axes left to right with yaxis_sequence
line_plot_by = dx.line(cat_dog, x="timestamp", y="price", by="sym", yaxis_sequence=[1, 2])
```

### Layering

Finally, plots can be layered to achieve multiple axes. Use the `dx.layer` function to accomplish this.

```python order=line_plot_layered,fish,bird,stocks
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import the example stock market data set

# subset to get two tables with a shared x-axis
fish = stocks.where("sym == `FISH`")
bird = stocks.where("sym == `BIRD`")

# create multiple axes using dx.layer and specifying yaxis_sequence
line_plot_layered = dx.layer(
    dx.line(fish, x="timestamp", y="price", yaxis_sequence=1),
    dx.line(bird, x="timestamp", y="price", yaxis_sequence=2)
)
```