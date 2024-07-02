# Bar Plot

A bar plot is a graphical representation of data that uses rectangular bars to display the values of different categories or groups, making it easy to compare and visualize the distribution of data.

#### When are bar plots appropriate?

Bar plots are appropriate when the data contain a continuous response variable that is directly related to a categorical explanatory variable. Additionally, if the response variable is a cumulative total of contributions from different subcategories, each bar can be broken up to demonstrate those contributions.

#### What are bar plots useful for?

- **Comparing Categorical Data**: Bar plots are ideal for comparing the quantities or frequencies of different categories. The height of each bar represents the value of each category, making it easy to compare them at a glance.
- **Decomposing Data by Category**: When the data belong to several independent categories, bar plots make it easy to visualize the relative contributions of each category to the overall total. The bar segments are colored by category, making it easy to identify the contribution of each.
- **Tracking Trends**: If the categorical explanatory variable can be ordered left-to-right (like day of week), then bar plots provide a visualization of how the response variable changes as the explanatory variable evolves.

## Examples

### A basic bar plot

Visualize the relationship between a continuous variable and a categorical or discrete variable. By default, the y-axis shows the cumulative value for each group over the whole dataset.

```python order=bar_plot,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# create a basic bar plot by specifying columns for the `x` and `y` axes
bar_plot = dx.bar(tips, x="day", y="total_bill")
```

### Partition bars by group

Use the `by` argument to break each bar up into contributions from the given group.

```python order=bar_plot_smoke,bar_plot_sex,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# Ex 1. Partition bars by smoker / non-smoker
bar_plot_smoke = dx.bar(tips, x="day", y="total_bill", by="smoker")

# Ex 2. Partition bars by male / female
bar_plot_sex = dx.bar(tips, x="day", y="total_bill", by="sex")
```

## API Reference
```{eval-rst}
.. autofunction:: deephaven.plot.express.bar
```