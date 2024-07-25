# Histogram Plot

A histogram plot is a data visualization technique commonly used in statistics and data analysis to visualize the distribution of a single continuous variable. It consists of a series of contiguous, non-overlapping bars that provide a visual summary of the frequency or density of data points within predefined intervals or "bins." The number of bins significantly impacts the visualization.

Histograms are appropriate when the data contain a continuous variable of interest. If there is an additional categorical variable that the variable of interest depends on, layered histograms may be appropriate.

### What are histograms useful for?

- **Data distribution analysis**: Histograms are a valuable tool to gain insights into the distribution of a dataset, making it easier to understand the central tendencies, spread, and skewness of the data.
- **Identifying outliers**: Histograms help in detecting outliers or anomalies in a dataset by highlighting data points that fall outside the typical distribution.
- **Density estimation**: Histograms can serve as the basis for density estimation methods, helping to model and understand underlying data distributions, which is crucial in statistical analysis and machine learning.

## Examples

### A basic histogram

Visualize the distribution of a single variable by passing the column name to the `x` or `y` arguments.

```python order=hist_plot,setosa,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# subset to get specific species
setosa = iris.where("species == `setosa`")

hist_plot = dx.histogram(setosa, x="sepal_length")
```

Modify the bin size by setting `nbins` equal to the number of desired bins.

```python order=hist_20_bins,hist_3_bins,hist_8_bins,virginica,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# subset to get specific species
virginica = iris.where("species == `virginica`")

# too many bins will produce jagged, disconnected histograms
hist_20_bins = dx.histogram(setosa, x="sepal_length", nbins=20)

# too few bins will mask distributional information
hist_3_bins = dx.histogram(setosa, x="sepal_length", nbins=3)

# play with the `nbins` parameter to get a good visualization
hist_8_bins = dx.histogram(setosa, x="sepal_length", nbins=8)
```

### Distributions of several groups

Histograms can also be used to compare the distributional properties of different groups of data, though they may be a little harder to read than box plots or violin plots. Pass the name of the grouping column(s) to the `by` argument.

```python order=stacked_hist,overlay_hist,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# each bin may be stacked side-by-side for each group
stacked_hist = dx.histogram(iris, x="sepal_length", by="species")

# or, each bin may be overlaid with the others
overlay_hist = dx.histogram(iris, x="sepal_length", by="species", barmode="overlay")
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.histogram
```