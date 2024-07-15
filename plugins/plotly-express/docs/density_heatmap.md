# Density Heatmap Plot

A density heatmap plot is a data visualization that uses a colored grid to represent a count over two columns or more generally an aggregation over three columns. The grid is divided into cells which are colored based on the aggregated value of the data points that fall within each cell. Using two columns provides a replacement for a scatter plot when there are too many data points to be easily visualized, whereas using three columns allows for a more general aggregation to assess a specific metric of the data distribution. The number of grid bins significantly impacts the visualization. Currently, these numbers must be set manually.

#### When are density heatmap plots appropriate? 
Density heatmap plots are appropriate when the data contains two or three continuous variables of interest.

#### What are density heatmap plots useful for? 

- **Scatter Plot Replacement**: When dealing with a large number of data points, density heatmaps provide a more concise, informative and performant visualization than a scatter plot.
- **2D Density Estimation**: Density heatmaps can serve as the basis for 2D density estimation methods, helping to model and understand underlying data distributions, which is crucial in statistical analysis and machine learning.
- **Metric Aggregation**: By aggregating data points within each cell, density heatmaps can provide insights into the distribution of a specific metric or value across different regions.

## Examples

### A basic density heatmap

Visualize the counts of data points between two continuous variables within a grid. This is possibly a replacement for a scatter plot when there are too many data points to be easily visualized.

```python order=heatmap,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# create a basic density heatmap by specifying columns for the `x` and `y` axes
heatmap = dx.density_heatmap(iris, x="petal_length", y="petal_width")
```

### A density heatmap with a custom color scale

Visualize the counts of data points between two continuous variables within a grid with a custom color scale.

```py order=heatmap_colorscale,iris
import deephaven.plot.express as dx
iris = dx.data.iris() # import a ticking version of the Iris dataset

# Color the heatmap using the "viridis" color scale with a range from 5 to 8
heatmap_colorscale = dx.density_heatmap(
    iris,
    x="petal_length", 
    y="petal_width", 
    color_continuous_scale="viridis", 
    range_color=[5, 8]
)
```

### A density heatmap with a custom grid size and range

Visualize the counts of data points between two continuous variables within a grid with a custom grid size and range. The number of bins significantly impacts the visualization by changing the granularity of the grid.

```py order=heatmap_bins,iris
import deephaven.plot.express as dx
iris = dx.data.iris() # import a ticking version of the Iris dataset

# Create a density heatmap with 20 bins on each axis and a range from 3 to the maximum value for the x-axis. 
# None is used to specify an upper bound of the maximum value.
heatmap_bins = dx.density_heatmap(
    iris, 
    x="petal_length", 
    y="petal_width", 
    nbinsx=20,
    nbinsy=20,
    range_bins_x=[3, None],  
)
```

### A density heatmap with a custom aggregation function

Visualize the average of a third dependent continuous variable across the grid. Histfuncs can only be used when three columns are provided. Possible histfuncs are `"abs_sum"`, `"avg"`, `"count"`, `"count_distinct"`, `"max"`, `"median"`, `"min"`, `"std"`, `"sum"`, and `"var"`.

```py order=heatmap_aggregation,iris

import deephaven.plot.express as dx
iris = dx.data.iris() # import a ticking version of the Iris dataset

# Create a density heatmap with an average aggregation function.
heatmap_aggregation = dx.density_heatmap(
    iris, 
    x="petal_length", 
    y="petal_width", 
    z="sepal_length", 
    histfunc="avg"
)
```


## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.density_heatmap
```