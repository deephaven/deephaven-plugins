# Area Plot

An area plot, also known as a stacked area chart, is a data visualization that uses multiple filled areas stacked on top of one another to represent the cumulative contribution of distinct categories over a continuous interval or time period.

#### When are area plots appropriate?

Area plots are appropriate for visualizing a single continuous response variable that directly depends on a continuous explanatory variable, such as time. Further, the response variable can be broken down into contributions from each of several independent categories, and those categories are represented by an additional categorical variable. 

#### What are area plots are useful for?

- **Visualizing Trends Over Time**: Area plots are great for displaying the trend of a single continuous variable. The filled areas can make it easier to see the magnitude of changes and trends compared to line plots.
- **Displaying Cumulative Totals**: Area plots are effective in showing cumulative totals over a period. They can help in understanding the contribution of different categories to the total amount and how these contributions evolve.
- **Comparing Multiple Categories**: Rather than providing a single snapshot of the composition of a total, area plots show how contributions from each category change over time. The different colored or shaded areas help distinguish each category, making it easier to see their individual contributions and to compare how those categories evolve.

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

# subset to get a few categories to compare
large_countries_population = gapminder.where("country in `United States`, `India`, `China`")

# the `by` uses unique values in the supplied column to color the plot according to those column values
area_plot_multi = dx.area(large_countries_population, x="year", y="pop", by="country")
```