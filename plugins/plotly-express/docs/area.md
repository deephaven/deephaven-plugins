# Area Plot

An area plot, also known as a stacked area chart, is a data visualization that uses multiple filled areas stacked on top of one another to represent the cumulative contribution of distinct categories over a continuous interval or time period.

#### When are area plots appropriate?

Area plots are appropriate when the data contain a single continuous response variable that directly depends on a continuous explanatory variable, such as time. Further, the response variable can be broken down into contributions from each of several independent categories, and those categories are represented by an additional categorical variable. 

#### What are area plots are useful for?

- **Decomposing Contribution by Category**: When several categories contribute to the value of the response variable, area plots are used to examine the relative contribution from each category to the whole.
- **Track Trends in Contributions**: Area plots provide more than a single snapshot of each category's contribution - they display how these contributions change and evolve over the course of the data.

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