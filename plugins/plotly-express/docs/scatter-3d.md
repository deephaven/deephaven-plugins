# 3D Scatter Plot

A 3D scatter plot is a type of data visualization that displays data points in three-dimensional space. Each data point is represented as a marker or point, and its position in the plot is determined by the values of three different variables, one for each axis (x, y, and z). This plot allows for the visualization of relationships and patterns among three continuous variables simultaneously.

3D scatter plots are appropriate when a continuous response variable depends on two continuous explanatory variables. If there is an additional categorical variable that the response variable depends on, shapes or colors can be used in the scatter plot to distinguish the categories.

## What are 3D scatter plots useful for?

- **Visualizing multivariate data**: When you have three variables of interest, a 3D scatter plot allows you to visualize and explore their relationships in a single plot. It enables you to see how changes in one variable affect the other two, providing a more comprehensive understanding of the data.
- **Identifying clusters and patterns**: In some datasets, 3D scatter plots can reveal clusters or patterns that might not be evident in 2D scatter plots. The added dimensionality can help identify complex structures and relationships that exist in the data.
- **Outlier detection**: Outliers, which are data points that deviate significantly from the general pattern, can be more easily spotted in a 3D scatter plot. They may appear as isolated points away from the main cluster, drawing attention to potentially interesting observations or anomalies.

## Examples

### A basic 3D scatter plot

Visualize the relationship between three variables by passing their column names to the `x`, `y`, and `z` arguments. Click and drag on the resulting chart to rotate it for new perspectives.

```python order=scatter_plot_3D,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

scatter_plot_3D = dx.scatter_3d(iris, x="SepalWidth", y="SepalLength", z="PetalWidth")
```

### Create a bubble plot

Use the size of the markers in a 3D scatter plot to visualize a fourth quantitative variable. Such a plot is commonly called a bubble plot, where the size of each bubble corresponds to the value of the additional variable.

The `size` argument interprets the values in the given column as pixel size, so you may consider scaling or normalizing these values before creating the bubble chart.

```python order=bubble_plot_3D,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

bubble_plot_3D = dx.scatter_3d(iris, x="SepalWidth", y="SepalLength", z="PetalWidth", size="PetalLength")
```

### Color markers by group

Denote groups of data by using the color of the markers as group indicators. Pass the name of the grouping column(s) to the `by` argument.

```python order=scatter_plot_3D_groups,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

scatter_plot_3D_groups = dx.scatter_3d(iris, x="SepalWidth", y="SepalLength", z="PetalWidth", by="Species")
```

Customize these colors using the `color_discrete_sequence` or `color_discrete_map` arguments. Any [CSS color name](https://www.w3schools.com/cssref/css_colors.php), hexadecimal color code, or set of RGB values will work.

```python order=scatter_3D_custom_1,scatter_3D_custom_2,scatter_3D_custom_3,iris,iris_with_custom_colors
import deephaven.plot.express as dx
iris = dx.data.iris()

# set custom colors using color_discrete_sequence
scatter_3D_custom_1 = dx.scatter_3d(
    iris,
    x="SepalWidth",
    y="SepalLength",
    z="PetalWidth",
    by="Species",
    # A list of colors to sequentially apply to one or more series
    # The colors loop if there are more series than colors
    color_discrete_sequence=["salmon", "#fffacd", "rgb(100,149,237)"]
)

# use a dictionary to specify custom colors
scatter_3D_custom_2 = dx.scatter_3d(
    iris,
    x="SepalWidth",
    y="SepalLength",
    z="PetalWidth",
    by="Species",
    # set each series to a specific color
    color_discrete_map={"virginica":"lemonchiffon", "setosa": "cornflowerblue", "versicolor":"#FA8173"}
)

# or, create a new table with a column of colors, and use that column for the color values
iris_with_custom_colors = iris.update(
    "ExampleColors = `rgb(` + Math.round(Math.random() * 255) + `,` + Math.round(Math.random() * 255) + `,`  + Math.round(Math.random() * 255) +`)`"
)

scatter_3D_custom_3 = dx.scatter_3d(
    iris_with_custom_colors,
    x="SepalWidth",
    y="SepalLength",
    z="PetalWidth",
    by="ExampleColors",
    # When set to `identity`, the column data passed to the
    # color parameter will used as the actual color
    color_discrete_map="identity"
)
```

### Color markers by a continuous variable

Markers can also be colored by a continuous value by specifying the `color_continuous_scale` argument.

```python order=scatter_3D_color,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# use the `color` argument to specify the value column, and the `color_continuous_scale` to specify the color scale
scatter_3D_color = dx.scatter_3d(
    iris,
    x="SepalWidth",
    y="SepalLength",
    z="PetalWidth",
    by="PetalLength",
    # use any plotly express built in color scale name
    color_continuous_scale="viridis"
)
```

Or, supply your own custom color scale to `color_continuous_scale`.

```python order=scatter_3D_custom_color,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

scatter_3D_custom_color = dx.scatter_3d(
    iris,
    x="SepalWidth",
    y="SepalLength",
    z="PetalWidth",
    by="PetalLength",
    # custom scale colors can be any valid browser css color
    color_continuous_scale=["lemonchiffon", "#FA8173", "rgb(201, 61, 44)"]
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.scatter_3d
```
