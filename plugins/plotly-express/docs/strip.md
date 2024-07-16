# Strip Plot

In a strip plot, individual data points are displayed along a single axis, providing a clear view of the distribution of data points without the additional density estimation and summary statistics provided by a violin plot.

Strip plots are appropriate when the data contain a continuous variable of interest. If there is an additional categorical variable that the variable of interest depends on, stacked strip plots may be appropriate. The data should be relatively sparse, as strip plots can get crowded quickly with large datasets. This may make it difficult to spot multimodal distributions, heavy-tailed distributions, or outliers. In such cases, box plots or violin plots may be more appropriate.

### What are strip plots useful for?

- **Comparing data categories**: Strip plots effectively present the distribution of a dataset, and make it easy to compare the distributions of different categories of data.
- **Identifying outliers**: Because strip plots are made up of individual points, they are well-suited for identifying potential outliers in datasets.
- **Small to moderate dataset visualization**: Strip plots are suitable for visualizing the distribution of small to moderate-sized datasets, where individual data points can be effectively represented.

## Examples

### A basic strip plot

Visualize the distributions of several groups of data at once. Specify the grouping column with the `by` argument.

```python order=bill_distr,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# create a strip plot by specifying the variable of interest
bill_distr = dx.strip(tips, x="total_bill", by="day", color_discrete_sequence=["lightblue"])
```

> [!NOTE]
> At the moment, `color_discrete_sequence` must be specified explicitly.

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.strip
```
