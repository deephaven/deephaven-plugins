# Area Plot

An area plot, also known as a stacked area chart, is a data visualization that uses multiple filled areas stacked on top of one another to represent the cumulative contribution of distinct categories over a continuous interval or time period. Area plots always start the y-axis at zero, because the height of each line at any point is exactly equal to its contribution to the whole, and the proportion of each category's contribution must be represented faithfully.

Area plots are appropriate when the data contain a continuous response variable that directly depends on a continuous explanatory variable, such as time. Further, the response variable can be broken down into contributions from each of several independent categories, and those categories are represented by an additional categorical variable.

## What are area plots useful for?

- **Visualizing trends over time**: Area plots are great for displaying the trend of a single continuous variable. The filled areas can make it easier to see the magnitude of changes and trends compared to line plots.
- **Displaying cumulative totals**: Area plots are effective in showing cumulative totals over a period. They can help in understanding the contribution of different categories to the total amount and how these contributions evolve.
- **Comparing multiple categories**: Rather than providing a single snapshot of the composition of a total, area plots show how contributions from each category change over time.

## Examples

### A basic area plot

Visualize the relationship between two variables by passing each column name to the `x` and `y` arguments.

```python order=area_plot,usa_population
import deephaven.plot.express as dx
gapminder = dx.data.gapminder()

# subset to get a specific group
usa_population = gapminder.where("Country == `United States`")

area_plot = dx.area(usa_population, x="Year", y="Pop")
```

### Area by group

Area plots are unique in that the y-axis demonstrates each groups' total contribution to the whole. Pass the name of the grouping column(s) to the `by` argument.

```python order=area_plot_group,large_countries_population
import deephaven.plot.express as dx
gapminder = dx.data.gapminder()

# subset to get several countries to compare
large_countries_population = gapminder.where("Country in `United States`, `India`, `China`")

# cumulative trend showing contribution from each group
area_plot_group = dx.area(large_countries_population, x="Year", y="Pop", by="Country")
```

### Calendar

Area plots take a calendar argument. Dates and times are excluded from axes so that they conform to the calendar.

```python order=area_plot_default,area_plot_cal_name,area_plot_cal_y,area_plot_cal,dog_prices,stocks
import deephaven.plot.express as dx
from deephaven.calendar import calendar, set_calendar

cal_name = "USNYSE_EXAMPLE"
cal = calendar(cal_name)
set_calendar(cal_name)

stocks = dx.data.stocks(starting_time="2018-06-01T09:27:00 ET")

dog_prices = stocks.where("Sym = `DOG`")

# plot with a specific calendar by name
area_plot_cal_name = dx.area(dog_prices, x="Timestamp", y="Price", calendar=cal_name)

# plot with a specific calendar by name on the y-axis
area_plot_cal_y = dx.area(dog_prices, x="Price", y="Timestamp", calendar=cal_name)

# plot with a specific calendar object
area_plot_cal = dx.area(dog_prices, x="Timestamp", y="Price", calendar=cal)

# plot with the default calendar
area_plot_default = dx.area(dog_prices, x="Timestamp", y="Price", calendar=True)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.area
```
