# Area Plot

An area plot, also known as a stacked area chart, is a data visualization that uses multiple filled areas stacked on top of one another to represent the cumulative contribution of distinct categories over a continuous interval or time period. This makes it valuable for illustrating the composition and trends within data, especially when comparing the distribution of different categories.

Area plots are useful for:

1. **Comparing Category Trends**: Use area plots to compare and track trends in different categories over time, providing a clear view of their cumulative contributions.
2. **Proportional Representation**: When you need to show the relative proportion of different categories within a dataset, area plots offer an effective means of visualizing this information.
3. **Data Composition**: Area plots are ideal for revealing the composition and distribution of data categories, making them useful in scenarios where the relative makeup of categories is crucial.
4. **Time Series Analysis**: For time-dependent data, area plots are valuable for displaying changes in categorical contributions and overall trends over time.

## Examples

### A basic area plot

Visualize the relationship between two variables. In this case, an area plot is similar to a line plot.

```python order=area_plot,usa_population
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import a ticking version of the Gapminder dataset

# subset to get a specific group
usa_population = gapminder.where("country == `United States`")

# create a basic area plot by specifying columns for the `x` and `y` axes
area_plot = dx.area(usa_population, x="year", y="pop")
```

### Color by group

Area plots are unique in that the y-axis demonstrates each groups' total contribution to the whole. Use the `by` argument to specify a grouping column.

```python order=area_plot_multi,large_countries_population
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import a ticking version of the Gapminder dataset
large_countries_population = gapminder.where("country in `United States`, `India`, `China`")

# the `by` uses unique values in the supplied column to color the plot according to those column values
area_plot_multi = dx.area(large_countries_population, x="year", y="pop", by="country")
```