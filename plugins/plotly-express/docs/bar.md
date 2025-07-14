# Bar Plot

A bar plot is a graphical representation of data that uses rectangular bars to display the values of different categories or groups. Bar plots aggregate the response variable across the entire dataset for each category, so that the y-axis represents the sum of the response variable per category.

Bar plots are appropriate when the data contain a continuous response variable that is directly related to a categorical explanatory variable. Additionally, if the response variable is a cumulative total of contributions from different subcategories, each bar can be broken up to demonstrate those contributions.

## What are bar plots useful for?

- **Comparing categorical data**: Bar plots are ideal for comparing the quantities or frequencies of different categories. The height of each bar represents the value of each category, making it easy to compare them at a glance.
- **Decomposing data by category**: When the data belong to several independent categories, bar plots make it easy to visualize the relative contributions of each category to the overall total. The bar segments are colored by category, making it easy to identify the contribution of each.
- **Tracking trends**: If the categorical explanatory variable can be ordered left-to-right (like day of week), then bar plots provide a visualization of how the response variable changes as the explanatory variable evolves.

## Examples

### A basic bar plot

Visualize the relationship between a continuous variable and a categorical or discrete variable by passing the column names to the `x` and `y` arguments.

```python order=bar_plot,tips
import deephaven.plot.express as dx
tips = dx.data.tips()

bar_plot = dx.bar(tips, x="Day", y="TotalBill")
```

Change the x-axis ordering by sorting the dataset by the categorical variable.

```python order=ordered_bar_plot,tips
import deephaven.plot.express as dx
tips = dx.data.tips()

# sort the dataset to get a specific x-axis ordering, sort() acts alphabetically
ordered_bar_plot = dx.bar(tips.sort("Day"), x="Day", y="TotalBill")
```

### Partition bars by group

Break bars down by group by passing the name of the grouping column(s) to the `by` argument.

```python order=bar_plot_smoke,bar_plot_sex,tips
import deephaven.plot.express as dx
tips = dx.data.tips()

sorted_tips = tips.sort("Day")

# group by smoker / non-smoker
bar_plot_smoke = dx.bar(sorted_tips, x="Day", y="TotalBill", by="Smoker")

# group by male / female
bar_plot_sex = dx.bar(sorted_tips, x="Day", y="TotalBill", by="Sex")
```

### Frequency of categories

Visualize the frequency of categories in a column by passing to either the `x` or `y` argument.

```python order=bar_plot_vertical,bar_plot_horizontal,tips
import deephaven.plot.express as dx

tips = dx.data.tips()

# count the number of occurrences of each day with a vertical bar plot
bar_plot_vertical = dx.bar(tips, x="Day")

# count the number of occurrences of each day with a horizontal bar plot
bar_plot_horizontal = dx.bar(tips, y="Day")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.bar
```
