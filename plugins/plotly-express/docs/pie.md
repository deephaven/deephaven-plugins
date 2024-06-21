# Pie Plot

A pie plot is a circular data visualization that illustrates the relative proportions of discrete categories within a dataset by dividing a circle into sectors. This format provides a quick and straightforward way to convey the composition of data.

#### When are pie plots appropriate?

Pie plots are appropriate when the data contain a categorical variable where the frequencies of each category can be computed.

#### What are pie plots useful for?

- **Proportional Representation**: Pie plots effectively convey the proportional distribution of categories, making them useful when you want to highlight the relative size of discrete components within a whole.
- **Simplicity**: Pie plots are straightforward to interpret and can be especially valuable when communicating data to non-technical audiences, as they provide an easily digestible overview of data composition.

Limitations of pie plots include:

- **Limited Categories**: Pie plots become less effective when dealing with a large number of categories, as it can be challenging to differentiate and interpret small slices, leading to cluttered and less informative visualizations. Consider using a bar plot instead.
- **Comparison Complexity**: Comparing the sizes of slices in a pie plot is less precise than with other chart types, such as bar plots or stacked bar charts. This makes it less suitable for situations where accurate quantitative comparisons are crucial.

## Examples

# A basic pie plot

Visualize the contribution of each part to the whole, arranged clockwise from greatest to least contribution.

```python order=continent_population,gapminder_recent_pop,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder()

gapminder_recent_pop = (
    gapminder
    .last_by("country")
    .drop_columns(["country", "lifeExp", "gdpPercap"])
    .sum_by(["year", "month", "continent"])
)

continent_population = dx.pie(gapminder_recent_pop, names="continent", values="pop")
```

## API Reference
```{eval-rst}
.. autofunction:: deephaven.plot.express.pie
```