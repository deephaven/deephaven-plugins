# Density Heatmap Plot

A density heatmap plot is a data visualization that uses a colored grid to represent the joint distribution of a pair of continuous variables. More generally, density heatmaps can be used to visualize any statistical aggregation over a pair of continuous variables. The pair of continuous variables may be explanatory and response variables. In this case, a density heatmap provides an approximation to a scatter plot when there are too many data points to be easily visualized. The number of grid bins significantly impacts the visualization. Currently, the grid bins default to 10 on each axis, yielding 100 bins in total.

Density heatmaps are appropriate when the data contain two continuous variables of interest. An additional quantitative variable may be incorporated into the visualization using shapes or colors.

## What are density heatmap plots useful for?

- **Scatter Plot Replacement**: When dealing with a large number of data points, density heatmaps provide a more concise, informative and performant visualization than a [scatter plot](scatter.md).
- **2D Density Estimation**: Density heatmaps can serve as the basis for 2D density estimation methods, helping to model and understand underlying data distributions, which is crucial in statistical analysis and machine learning.
- **Metric Assessment**: By aggregating data points within each cell, density heatmaps can provide insights into the distribution of a specific metric or value across different regions, highlighting groups for further analysis.

## Examples

### A basic density heatmap

Visualize the joint distribution of two variables by passing each column name to the `x` and `y` arguments.

```python order=heatmap,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

heatmap = dx.density_heatmap(iris, x="PetalLength", y="PetalWidth")
```

### A density heatmap with a custom color scale

Custom color scales can be provided to the `color_continuous_scale` argument, and their range can be defined with the `range_color` argument.

```python order=heatmap_colorscale,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# use the "viridis" color scale with a range from 5 to 8
heatmap_colorscale = dx.density_heatmap(iris,
    x="PetalLength",
    y="PetalWidth",
    color_continuous_scale="viridis",
    range_color=[5, 8]
)
```

### A density heatmap with a custom grid size and range

The number of bins on each axis can be set using the `nbinsx` and `nbinsy` arguments. The number of bins significantly impacts the visualization by changing the granularity of the grid.

```python order=heatmap_bins,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# Create a density heatmap with 20 bins on each axis and a range from 3 to the maximum value for the x-axis.
# None is used to specify an upper bound of the maximum value.
heatmap_bins = dx.density_heatmap(
    iris,
    x="PetalLength",
    y="PetalWidth",
    nbinsx=20,
    nbinsy=20,
    range_bins_x=[3, None],
)
```

### A density heatmap with a custom aggregation function

Use an additional continuous variable to color the heatmap. Many statistical aggregations can be computed on this column by providing the `histfunc` argument. Possible values for the `histfunc` are `"abs_sum"`, `"avg"`, `"count"`, `"count_distinct"`, `"max"`, `"median"`, `"min"`, `"std"`, `"sum"`, and `"var"`.

```python order=heatmap_aggregation,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# color the map by the average of an additional continuous variable
heatmap_aggregation = dx.density_heatmap(iris,
    x="PetalLength",
    y="PetalWidth",
    z="SepalLength",
    histfunc="avg"
)
```

### Large datasets

Visualize the joint distribution of a large dataset (10 million rows in this example) by passing each column name to the `x` and `y` arguments. Increasing the number of bins can produce a much smoother visualization.

```python order=large_heatmap_2,large_heatmap_1,large_data
from deephaven.plot import express as dx
from deephaven import empty_table

large_data = empty_table(10_000_000).update([
    "X = 50 + 25 * cos(i * Math.PI / 180)",
    "Y = 50 + 25 * sin(i * Math.PI / 180)",
])

# specify range to see entire plot
large_heatmap_1 = dx.density_heatmap(large_data, x="X", y="Y", range_bins_x=[0,100], range_bins_y=[0,100])

# using bins may be useful for more precise visualizations
large_heatmap_2 = dx.density_heatmap(
    large_data,
    x="X",
    y="Y",
    range_bins_x=[0,100],
    range_bins_y=[0,100],
    nbinsx=100,
    nbinsy=100
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.density_heatmap
```
