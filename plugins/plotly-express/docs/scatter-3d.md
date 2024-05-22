---
title: 3D Scatter Plot
---

A 3D scatter plot is a type of data visualization that displays data points in three-dimensional space. Each data point is represented as a marker or point, and its position in the plot is determined by the values of three different variables, one for each axis (x, y, and z). This plot allows for the visualization of relationships and patterns among three continuous variables simultaneously.

A 3D scatter plot is useful in several ways:

1. **Visualizing Multivariate Data**: When you have three variables of interest, a 3D scatter plot allows you to visualize and explore their relationships in a single plot. It enables you to see how changes in one variable affect the other two, providing a more comprehensive understanding of the data.
2. **Identifying Clusters and Patterns**: In some datasets, 3D scatter plots can reveal clusters or patterns that might not be evident in 2D scatter plots. The added dimensionality can help identify complex structures and relationships that exist in the data.
3. **Outlier Detection**: Outliers, which are data points that deviate significantly from the general pattern, can be more easily spotted in a 3D scatter plot. They may appear as isolated points away from the main cluster, drawing attention to potentially interesting observations or anomalies.

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

### Symbols by group

Symbols can be statically assigned, assigned to a group as part of a `parition_by` operation drawing from a sequence, or from a map. See the symbol list for all available symbols.

<!-- TODO: link to symbol list -->

```python order=scatter_plot_diamonds,scatter_plot_symbol_by,scatter_plot_symbol_map
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

# Ex 1. Assign a custom symbol
scatter_plot_diamonds = dx.scatter_3d(
    my_table,
    x="sepal_width",
    y="sepal_length",
    z="petal_width",
    color="species",
    # See list of available symbols.
    symbol_sequence=["diamond"]
)

# Ex 2. Use symbols to differentiate groups
scatter_plot_symbol_by = dx.scatter_3d(
    my_table,
    x="sepal_width",
    y="sepal_length",
    z="petal_width",
    color="species",
    # Assign symbols by group, shown using default symbol_sequence
    symbol="species"
)

# Ex 3. Use a map to assign symbols to groups
scatter_plot_symbol_map = dx.scatter_3d(
    my_table,
    x="sepal_width",
    y="sepal_length",
    z="petal_width",
    color="species",
    # Using a map for symbols by value
    symbol="species",
    symbol_map={"setosa":"cross", "versicolor":"pentagon", "virginica":"star"}
)
```

### Error Bars

Error bars can be set on x and/or y, using values from a column.

```python order=scatter_plot_error,scatter_plot_error_minus
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

# Ex 1. Use values from a column as positive and negative error bars
scatter_plot_error = dx.scatter(
    my_table.update("error_sepal_width = sepal_width * 0.01"),
    x="sepal_width",
    y="sepal_length",
    error_x="error_sepal_width",
)

#Ex 2. Use values from two columns for y-positive-error and y-negative-error
scatter_plot_error_minus = dx.scatter(
    my_table.update(
        [
            # let's pretend these columns represent error
            "error_sepal_length_positive = petal_width * 0.25",
            "error_sepal_length_negative = petal_length * 0.25",
        ]
    ),
    x="sepal_width",
    y="sepal_length",
    # will be use as positive and negative error unless _minus is set
    error_y="error_sepal_length_positive",
    error_y_minus="error_sepal_length_negative"
)
```

### Labels and Hover Text

<!-- TODO: labels has a bug, check it works now -->

```python order=scatter_plot_title,scatter_plot_axes_titles
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

# Ex 1. Label axes using a map
scatter_plot_title = dx.scatter(
    my_table,
    x="sepal_width",
    y="sepal_length",
    # Adds a title label, title supports a subset of html and css
    title="Iris <span style='color: salmon'>Scatter Plot</span>",
    # re-label the axis
    labels={"sepal_width": "Sepal Width", "sepal_length": "Sepal Length"},
    # adds values from a column as bolded text to hover tooltip
    hover_name="species"
)

# Ex 2. Label multiple axes using an array of strings
scatter_plot_axes_titles = dx.scatter(
    my_table,
    x="sepal_width",
    y="sepal_length",
    xaxis_titles=["Sepal Width"],
    yaxis_titles=["Sepal Length"],
)
```

### Marginals

Plot marginals are additional visual representations, like histograms or density plots, displayed alongside the main plot to provide insights into the individual distributions of variables being analyzed. They enhance the understanding of data patterns and trends by showing the univariate distribution of each variable in conjunction with the main plot's visualization.

```python order=scatter_marginal_histogram,scatter_marginal_violin,scatter_marginal_rug,scatter_marginal_box
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

# Ex 1. Histogram style marginals
scatter_marginal_histogram = dx.scatter(
    my_table,
    x="petal_width",
    y="petal_length",
    marginal_x="histogram",
    marginal_y="histogram",
)

# Ex 2. Violin style marginals
scatter_marginal_violin = dx.scatter(
    my_table,
    x="petal_width",
    y="petal_length",
    marginal_x="violin",
    marginal_y="violin",
)

# Ex 3. Rug style marginals
scatter_marginal_rug = dx.scatter(
    my_table,
    x="petal_width",
    y="petal_length",
    marginal_x="rug",
    marginal_y="rug",
)

# Ex 4. Box style marginals
scatter_marginal_box = dx.scatter(
    my_table,
    x="petal_width",
    y="petal_length",
    marginal_x="box",
    marginal_y="box",
)
```

### Log Axes

```python order=scatter_plot_log
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

scatter_plot_axes_titles = dx.scatter(
    my_table,
    x="petal_width",
    # Each y value becomes a seperate series
    y="petal_length",
    log_x=True,
    log_y=True,
)
```

### Axes Range

```python order=scatter_plot_range
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

scatter_plot_range = dx.scatter(
    my_table,
    x="petal_width",
    # Each y value becomes a seperate series
    y="petal_length",
    # Set at custom range for each axes
    range_x=[0,5],
    range_y=[0,10],
)
```

### Multiple Axes

You can create multiple axes on a single graph in a number of different ways depending on what you are trying to do. Axes can be created from columns, or by value from a column, of from multiple plots layered together.

```python order=scatter_plot_title,scatter_plot_axes_titles
import deephaven.plot.express as dx
my_table = dx.data.iris() # import the example iris data set

# Ex 1. Create multiple axes from mulitple columns
scatter_plot_axes_titles = dx.scatter(
    my_table,
    x="sepal_width",
    # Each y value becomes a seperate series
    y=["sepal_length", "petal_length"],
    # position each axis for each series
    yaxis_sequence=[1, 2],
    # Label the axes
    xaxis_titles=["Sepal Width"],
    yaxis_titles=["Sepal Length", "Petal Length"],
)


# Ex 2. Create multiple axes by values from a column
stocks_table = dx.data.stocks().where("sym in `DOG`, `CAT`")

scatter_stocks = dx.scatter(
    stocks_table,
    x="timestamp",
    y="price",
    # Parition color by sym
    color="sym",
    # Apply each trace to a different axis
    yaxis_sequence=[1, 2],
    # Label each axis, where order is by first appearence in the data
    yaxis_titles=["CAT", "DOG"],
)

#Ex 3. Create multiple axes from multiple tables using layers
layered_table = dx.data.iris() # import the example iris data set

# split into two tables by species
table_setosa = layered_table.where("species = `setosa`")
table_versicolor = layered_table.where("species = `versicolor`")

# layer two plots together, layout is inherited from the last table in the layer
layered_scatter = dx.layer(
    # scatter plot from table 1
    dx.scatter(
        table_setosa,
        x="petal_width",
        y="petal_length",
        color_discrete_sequence=["salmon"],
    ),
    # scatter from table 2
    dx.scatter(
        table_versicolor,
        x="petal_width",
        y="petal_length",
        color_discrete_sequence=["lemonchiffon"],
        # place this trace on a secondary axis
        yaxis_sequence=[2],
        # set the titles for both axes, as layer inherits from this layout
        yaxis_titles=["versicolor petal_length","setosa petal_length"]
    )
)
```

### Layer as Event Markers

Combines a line plot and a scatter plot to use as event markers indicating the maximum peak in each series.

```python order=scatter_as_markers,marker_table
import deephaven.plot.express as dx

my_table = dx.data.iris()  # import the example iris data set
# find the max peaks of each series to use as our example markers
marker_table = my_table.select(["species", "petal_length", "timestamp"]).join(
    my_table.select(["species", "petal_length"]).max_by("species"),
    on=["species", "petal_length"],
)

# layer  as scatter on a line plot
scatter_as_markers = dx.layer(
    # create a scatter plot to use as markers
    dx.scatter(
        marker_table,
        x="timestamp",
        y="petal_length",
        symbol_sequence=["x"],
        size_sequence=[15],
        hover_name="species",
        color_discrete_sequence=["#FFF"],
    ),
    # layer it with a line plot
    dx.line(
        my_table,
        x="timestamp",
        y="petal_length",
        color="species",
    ),
)
```
