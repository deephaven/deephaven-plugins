# 3D Scatter Plot

A 3D scatter plot is a type of data visualization that displays data points in three-dimensional space. Each data point is represented as a marker or point, and its position in the plot is determined by the values of three different variables, one for each axis (x, y, and z). This plot allows for the visualization of relationships and patterns among three continuous variables simultaneously.

#### When are 3D scatter plots appropriate?

3D scatter plots are appropriate when a continuous reponse variable depends on two continuous explanatory variables. If there is an additional categorical variable that the response variable depends on, shapes or colors can be used in the scatter plot to distinguish the categories.

#### What are 3D scatter plots useful for?

- **Visualizing Multivariate Data**: When you have three variables of interest, a 3D scatter plot allows you to visualize and explore their relationships in a single plot. It enables you to see how changes in one variable affect the other two, providing a more comprehensive understanding of the data.
- **Identifying Clusters and Patterns**: In some datasets, 3D scatter plots can reveal clusters or patterns that might not be evident in 2D scatter plots. The added dimensionality can help identify complex structures and relationships that exist in the data.
- **Outlier Detection**: Outliers, which are data points that deviate significantly from the general pattern, can be more easily spotted in a 3D scatter plot. They may appear as isolated points away from the main cluster, drawing attention to potentially interesting observations or anomalies.

However, 3D scatter plots also have some limitations. When dealing with more than three variables, visual interpretation can become challenging. Overplotting (many points overlapping) can obscure patterns, and certain perspectives may lead to misinterpretation. In such cases, alternative visualizations like 3D surface plots or parallel coordinate plots might be considered.

## Examples

### A basic scatter plot

Visualize the relationship between three variables. Defined as an x, y and z supplied using column names.

```python order=scatter_plot,mytable
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

# Create a basic scatter plot by specifying the x and y column
scatter_3d_plot = dx.scatter_3d(my_table, x="sepal_width", y="sepal_length", z="petal_width")
```

### 3d bubble charts sized from a column

A 3d bubble chart is a type of data visualization that displays data points as spheres, where the position of each sphere corresponds to three variables, and the size of the sphere represents a fourth variable.

The size column values function as the sphere size, you may consider scaling or normalizing these values before plotting the bubble chart.

```python order=bubble_3d_plot
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

# Sets size of the circle using values from a column sized in pixels
bubble_3d_plot = dx.scatter_3d(my_table, x="sepal_width", y="sepal_length", z="petal_width", size="petal_length")
```

### Color scatter plot by group

Plot values by group. The query engine performs a `parition_by` on the given color column to create each series.

```python order=scatter_plot,mytable
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

# Assign unique colors to each grouping key in a column
scatter_3d_plot = dx.scatter_3d(my_table, x="sepal_width", y="sepal_length", z="petal_width", color="species")
```

### Color using a continuous color scale

Colors can be set to a continuous scale, instead of by group as above. Use any of the built in color scales, or specify a custom scale.

<!-- TODO: LINK TO A PAGE ON COLOR SCALES -->

```python order=scatter_plot_color_by,scatter_plot_color_custom
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

# Ex 1. Use built in color scales
scatter_3d_plot_color_by = dx.scatter_3d(
    my_table,
    x="sepal_width",
    y="sepal_length",
    z="petal_width",
    color="petal_length",
    # use any plotly express built in color scale names
    color_continuous_scale="viridis"
)

# Ex 2. Use a custom color scale
scatter_plot_color_custom = dx.scatter_3d(
    my_table,
    x="sepal_width",
    y="sepal_length",
    z="petal_width",
    color="petal_length",
    # custom scale colors can be any valid browser css color
    color_continuous_scale=["lemonchiffon", "#FA8173", "rgb(201, 61, 44)"]
)
```

### Color using custom discrete colors

```python order=scatter_plot_color_sequence,scatter_plot_color_map,scatter_plot_color_column
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

# Ex 1. Set custom colors
scatter_plot_color_sequence = dx.scatter_3d(
    my_table,
    x="sepal_width",
    y="sepal_length",
    z="petal_width",
    # group colors by a column
    color="species",
    # A list of colors to sequentially apply to one or more series
    # The colors loop if there are more series than colors
    color_discrete_sequence=["salmon", "#fffacd", "rgb(100,149,237)"]
)

# Ex 2. Set trace colors from a map of colors
scatter_plot_color_map = dx.scatter_3d(
    my_table,
    x="sepal_width",
    y="sepal_length",
    z="petal_width",
    # group colors by a column
    color="species",
    # set each series to a specific color
    color_discrete_map={"virginica":"lemonchiffon", "setosa": "cornflowerblue", "versicolor":"#FA8173"}
)

# Ex 3. Set colors using values from a column
# Generate a column of valid CSS colors to use as an example
table_with_column_of_colors = my_table.update(
    "example_colors = `rgb(` + Math.round(Math.random() * 255) + `,` + Math.round(Math.random() * 255) + `,`  + Math.round(Math.random() * 255) +`)`"
)

scatter_plot_color_column = dx.scatter_3d(
    table_with_column_of_colors,
    x="sepal_width",
    y="sepal_length",
    z="petal_width",
    color="example_colors",
    # When set to `identity`, the column data passed to the
    # color parameter will used as the actual color
    color_discrete_map="identity"
)
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.scatter_3d
```
