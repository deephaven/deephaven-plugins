# Histogram Plot

A histogram plot is a data visualization technique commonly used in statistics and data analysis to visualize the distribution of a single continuous variable. It consists of a series of contiguous, non-overlapping bars that provide a visual summary of the frequency or density of data points within predefined intervals or "bins." The number of bins significantly impacts the visualization.

Histograms are appropriate when the data contain a continuous variable of interest. If there is an additional categorical variable that the variable of interest depends on, layered histograms may be appropriate using the `by` argument.

## What are histograms useful for?

- **Data distribution analysis**: Histograms are a valuable tool to gain insights into the distribution of a dataset, making it easier to understand the central tendencies, spread, and skewness of the data.
- **Identifying outliers**: Histograms help in detecting outliers or anomalies in a dataset by highlighting data points that fall outside the typical distribution.
- **Density estimation**: Histograms can serve as the basis for density estimation methods, helping to model and understand underlying data distributions, which is crucial in statistical analysis and machine learning.

## Examples

### A basic histogram

Visualize the distribution of a single variable by passing the column name to the `x` or `y` arguments.

```python order=hist_plot_x,hist_plot_y,setosa,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# subset to get specific species
setosa = iris.where("Species == `setosa`")

# control the plot orientation using `x` or `y`
hist_plot_x = dx.histogram(setosa, x="SepalLength")
hist_plot_y = dx.histogram(setosa, y="SepalLength")
```

Modify the bin size by setting `nbins` equal to the number of desired bins.

```python order=hist_20_bins,hist_3_bins,hist_8_bins,virginica,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# subset to get specific species
virginica = iris.where("Species == `virginica`")

# too many bins will produce jagged, disconnected histograms
hist_20_bins = dx.histogram(virginica, x="SepalLength", nbins=20)

# too few bins will mask distributional information
hist_3_bins = dx.histogram(virginica, x="SepalLength", nbins=3)

# play with the `nbins` parameter to get a good visualization
hist_8_bins = dx.histogram(virginica, x="SepalLength", nbins=8)
```

### Bin and aggregate on different columns

If the plot orientation is vertical (`"v"`), the `x` column is binned and the `y` column is aggregated. The operations are flipped if the plot orientation is horizontal.

```python order=hist_v,hist_h,hist_avg,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# subset to get specific species
setosa = iris.where("Species == `setosa`")

# The default orientation is "v" (vertical) and the default aggregation function is "sum"
hist_v = dx.histogram(setosa, x="SepalLength", y="SepalWidth")

# Control the plot orientation using orientation
hist_h = dx.histogram(setosa, x="SepalLength", y="SepalWidth", orientation="h")

# Control the aggregation function using histfunc
hist_avg = dx.histogram(setosa, x="SepalLength", y="SepalWidth", histfunc="avg")
```

### Distributions of several groups

Histograms can also be used to compare the distributional properties of different groups of data, though they may be a little harder to read than [box plots](box.md) or [violin plots](violin.md). Pass the name of the grouping column(s) to the `by` argument.

```python order=stacked_hist,overlay_hist,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# each bin may be stacked side-by-side for each group
stacked_hist = dx.histogram(iris, x="SepalLength", by="Species")

# or, each bin may be overlaid with the others
overlay_hist = dx.histogram(iris, x="SepalLength", by="Species", barmode="overlay")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.histogram
```
