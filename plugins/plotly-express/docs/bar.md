# Bar Plot

A bar plot is a graphical representation of data that uses rectangular bars to display the values of different categories or groups, making it easy to compare and visualize the distribution of data.

Advantages of bar plots include:

1. **Comparative Clarity**: Bar plots are highly effective for comparing data across different categories or groups. They provide a clear visual representation of relative differences and make it easy to identify trends within the dataset.
2. **Categorical Representation**: Bar plots excel at representing categorical data, such as survey responses, product sales by region, or user preferences. Each category is presented as a distinct bar, simplifying the visualization of categorical information.
3. **Ease of Use**: Bar plots are user-friendly and quick to generate, making them a practical choice for various applications.
4. **Data Aggregation**: Bar plots allow for easy aggregation of data within categories, simplifying the visualization of complex datasets, and aiding in summarizing and comparing information efficiently.

Bar plots have limitations and are not suitable for certain scenarios. They are not ideal for continuous data, ineffective for multi-dimensional data exceeding two dimensions, and unsuitable for time-series data trends. Additionally, they become less practical with extremely sparse datasets and are inadequate for representing complex interactions or correlations among multiple variables.

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