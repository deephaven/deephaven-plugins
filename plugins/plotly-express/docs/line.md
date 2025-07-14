# Line Plot

A line plot is a graphical representation that displays data points connected by straight lines, commonly employed in time series analysis to depict temporal trends or relationships in a dataset.

Line plots are appropriate when the data contain a continuous response variable that directly depends on a continuous explanatory variable. Further, line plots are preferable to [scatter plots](scatter.md) when the explanatory variables are ordered.

## What are line plots useful for?

- **Visualizing trends:** Line plots excel at revealing trends and patterns in data, making them ideal for time series analysis and showcasing changes over a continuous range.
- **Simplicity and clarity:** Line plots offer a straightforward and uncluttered representation, enhancing readability and allowing developers to focus on the data's inherent structure.
- **Comparing multiple series:** Line plots make it easy to compare multiple data series on the same graph, aiding in the identification of similarities and differences.

## Examples

### A basic line plot

Visualize the relationship between two variables by passing each column name to the `x` and `y` arguments.

```python order=line_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# subset data for just DOG transactions
dog_prices = my_table.where("Sym = `DOG`")

line_plot = dx.line(dog_prices, x="Timestamp", y="Price")
```

### Line by group

Create a line with a unique color for each group in the dataset by passing the grouping column name to the `by` argument.

```python order=line_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# each line represents a group and has a unique color
line_plot = dx.line(my_table, x="Timestamp", y="Price", by="Sym")
```

### Calendar

Line plots take a calendar argument. Dates and times are excluded from axes so that they conform to the calendar.

```python order=line_plot_default,line_plot_cal_name,line_plot_cal_y,line_plot_cal,dog_prices,stocks
import deephaven.plot.express as dx
from deephaven.calendar import calendar, set_calendar

cal_name = "USNYSE_EXAMPLE"
cal = calendar(cal_name)
set_calendar(cal_name)

stocks = dx.data.stocks(starting_time="2018-06-01T09:27:00 ET")

dog_prices = stocks.where("Sym = `DOG`")

# plot with a specific calendar by name
line_plot_cal_name = dx.line(dog_prices, x="Timestamp", y="Price", calendar=cal_name)

# plot with a specific calendar by name on the y-axis
line_plot_cal_y = dx.line(dog_prices, x="Price", y="Timestamp", calendar=cal_name)

# plot with a specific calendar object
line_plot_cal = dx.line(dog_prices, x="Timestamp", y="Price", calendar=cal)

# plot with the default calendar
line_plot_default = dx.line(dog_prices, x="Timestamp", y="Price", calendar=True)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.line
```
