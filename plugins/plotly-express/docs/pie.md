# Pie Plot

A pie plot is a circular data visualization that illustrates the relative proportions of discrete categories within a dataset by dividing a circle into sectors. This format provides a quick and straightforward way to convey the composition of data.

Pie plots are appropriate when the data contain a categorical variable where the frequencies of each category can be computed.

## What are pie plots useful for?

- **Proportional representation**: Pie plots effectively convey the proportional distribution of categories, making them useful when you want to highlight the relative size of discrete components within a whole.
- **Simplicity**: Pie plots are straightforward to interpret and can be especially valuable when communicating data to non-technical audiences, as they provide an easily digestible overview of data composition.

Pie plots do have some limitations. They become less effective when dealing with a large number of categories, as it can be challenging to differentiate and interpret small slices, leading to cluttered and less informative visualizations. Consider using a [bar plot](bar.md) instead.

## Examples

# A basic pie plot

Visualize the contribution of each part to the whole, arranged clockwise from greatest to least contribution. Pass the label column name to the `names` argument, and the value column name to the `values` argument.

```python order=pie_plot,gapminder_recent_pop,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder()

# get table of most recent total population per continent
gapminder_recent_pop = (
    gapminder
    .last_by("Country")
    .drop_columns(["Country", "LifeExp", "GdpPerCap"])
    .sum_by(["Year", "Month", "Continent"])
)

pie_plot = dx.pie(gapminder_recent_pop, names="Continent", values="Pop")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.pie
```
