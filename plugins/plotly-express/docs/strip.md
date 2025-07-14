# Strip Plot

In a strip plot, individual data points are displayed along a single axis, providing a clear view of the distribution of data points without the additional density estimation and summary statistics provided by a violin plot. By default, the plotted categories are ordered by their appearance in the dataset.

Strip plots are appropriate when the data contain a continuous variable of interest. If there is an additional categorical variable that the variable of interest depends on, stacked strip plots may be appropriate. The data should be relatively sparse, as strip plots can get crowded quickly with large datasets. This may make it difficult to spot multimodal distributions, heavy-tailed distributions, or outliers. In such cases, [box plots](box.md) or [violin plots](violin.md) may be more appropriate.

## What are strip plots useful for?

- **Comparing data categories**: Strip plots effectively present the distribution of a dataset, and make it easy to compare the distributions of different categories of data.
- **Identifying outliers**: Because strip plots are made up of individual points, they are well-suited for identifying potential outliers in datasets.
- **Small to moderate dataset visualization**: Strip plots are suitable for visualizing the distribution of small to moderate-sized datasets, where individual data points can be effectively represented.

## Examples

### A basic strip plot

Visualize the distribution of a continuous variable by passing its column name to the `x` or `y` arguments.

```python order=strip_plot,thursday_tips,tips
import deephaven.plot.express as dx
tips = dx.data.tips()

# subset to get a single group
thursday_tips = tips.where("Day == `Thur`")

strip_plot = dx.strip(thursday_tips, x="TotalBill", color_discrete_sequence=["lightgreen"])
```

### Distributions for multiple groups

Strip plots are useful for comparing the distributions of two or more groups of data. Pass the name of the grouping column(s) to the `by` argument.

```python order=strip_plot_group,tips
import deephaven.plot.express as dx
tips = dx.data.tips()

strip_plot_group = dx.strip(tips, x="TotalBill", by="Day", color_discrete_sequence=["lightgreen", "lightblue", "goldenrod", "lightcoral"])
```

> [!NOTE]
> At the moment, `color_discrete_sequence` must be specified explicitly to get the points to render.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.strip
```
