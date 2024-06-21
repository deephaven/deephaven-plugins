# Strip Plot

In a strip plot, individual data points are displayed along a single axis, providing a clear view of the distribution of data points without the additional density estimation and summary statistics provided by a violin plot.

#### When are strip plots appropriate?

Strip plots are appropriate when the data contain a continuous variable of interest. If there is an additional categorical variable that the variable of interest depends on, stacked strip plots may be appropriate. The data should be relatively sparse, as strip plots can get crowded quickly with large datasets. In such cases, box plots or violin plots may be more appropriate.

#### What are strip plots useful for?

- **Individual Data Points**: Displaying individual data points along an axis, allowing for a detailed view of each data point in the dataset.
- **Identifying Outliers**: Facilitating the easy identification of outliers and anomalies within the data, aiding in data quality assessment.
- **Small to Moderate Dataset Visualization**: Suitable for datasets of small to moderate sizes where individual data points can be effectively represented.
- **Comparing Data Categories**: Comparing the distribution and spread of data across different categories or groups, making it useful for categorical data analysis.

## Examples

### A basic strip plot

Visualize the distributions of several groups of data at once. Specify the grouping column with the `by` argument.

```python order=bill_distr,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# create a strip plot by specifying the variable of interest
bill_distr = dx.strip(tips, x="total_bill", by="day", color_discrete_sequence=["lightblue"])
```

:::note
At the moment, `color_discrete_sequence` must be specified explicitly.
:::

## API Reference
```{eval-rst}
.. autofunction:: deephaven.plot.express.strip
```
