# Scatter Plot

A scatter plot is a type of data visualization that uses Cartesian coordinates to display values for typically two variables. It represents individual data points as dots on a graph, with each dot's position indicating its corresponding values on the two variables being plotted.

Scatter plots are appropriate when the data contain a continuous response variable that directly depends on a continuous explanatory variable. If there is an additional categorical variable that the response variable depends on, shapes or colors can be used in the scatter plot to distinguish the categories.

### What are scatter plots useful for?

- **Exploring relationships**: Scatter plots are useful for exploring and visualizing the relationship between two continuous variables. By plotting the data points, you can quickly identify patterns, trends, or correlations between the variables. It helps in understanding how changes in one variable affect the other.
- **Outlier detection**: Scatter plots are effective in identifying outliers or extreme values in a dataset. Outliers appear as points that deviate significantly from the general pattern of the data. By visualizing the data in a scatter plot, you can easily spot these outliers, which may be important in certain analyses.
- **Clustering analysis**: If you suspect that your data might exhibit clusters or groups, a scatter plot can help you identify those clusters. By observing the distribution of the points, you can visually determine if there are distinct groups forming or if the points are evenly spread out.

## Examples

### A basic scatter plot

Visualize the relationship between two variables. Defined as an x and y pair supplied using column names.

```python order=scatter_plot,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# create a basic scatter plot by specifying the `x` and `y` column
scatter_plot = dx.scatter(iris, x="sepal_width", y="sepal_length")
```

### Size markers by a quantitative variable

Use the size of the markers in a scatter plot to visualize a third quantitative variable. Such a plot is commonly called a bubble plot, where the size of each bubble corresponds to the value of the additional variable.

The `size` argument interprets the values in the given column as pixel size, so you may consider scaling or normalizing these values before creating the bubble chart.

```python order=bubble_plot,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# pass the name of the additional variable to the `size` argument 
bubble_plot = dx.scatter(iris, x="sepal_width", y="sepal_length", size="petal_length")
```

### Color markers by group

Denote groups of data by using the color of the markers as group indicators.

```python order=scatter_plot_groups,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# use the `by` argument to color markers by group
scatter_plot_groups = dx.scatter(iris, x="sepal_width", y="sepal_length", by="species")
```

Customize these colors using the `color_discrete_sequence` argument. Any [CSS color name](https://www.w3schools.com/cssref/css_colors.php), hexadecimal color code, or set of RGB values will work.

```python order=custom_colors_1,custom_colors_2,custom_colors_3,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# set custom colors using color_discrete_sequence
custom_colors_1 = dx.scatter(
    iris,
    x="sepal_width",
    y="sepal_length",
    # group colors by a column
    color="species",
    # A list of colors to sequentially apply to one or more series
    # The colors loop if there are more series than colors
    color_discrete_sequence=["salmon", "#fffacd", "rgb(100,149,237)"]
)

# use a dictionary to specify custom colors
custom_colors_2 = dx.scatter(
    iris,
    x="sepal_width",
    y="sepal_length",
    # group colors by a column
    color="species",
    # set each series to a specific color
    color_discrete_map={"virginica":"lemonchiffon", "setosa": "cornflowerblue", "versicolor":"#FA8173"}
)

# or, create a new table with a column of colors, and use that column for the color values
iris_with_custom_colors = iris.update(
    "example_colors = `rgb(` + Math.round(Math.random() * 255) + `,` + Math.round(Math.random() * 255) + `,`  + Math.round(Math.random() * 255) +`)`"
)

custom_colors_3 = dx.scatter(
    iris_with_custom_colors,
    x="sepal_width",
    y="sepal_length",
    color="example_colors",
    # When set to `identity`, the column data passed to the
    # color parameter will used as the actual color
    color_discrete_map="identity"
)
```

### Color markers by a continuous variable

Markers can also be colored by a continuous value. Any of plotly's [built-in color scales](https://plotly.com/python/builtin-colorscales/) may be used.

```python order=scatter_plot_conts,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# use the `color` argument to specify the value column, and the `color_continuous_scale` to specify the color scale
scatter_plot_conts = dx.scatter(
    iris,
    x="sepal_width",
    y="sepal_length",
    color="petal_length",
    # use any plotly express built in color scale names
    color_continuous_scale="viridis"
)
```

Or, define your own custom color scale.

```python order=custom_colors_conts,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

custom_colors_conts = dx.scatter_3d(
    iris,
    x="sepal_width",
    y="sepal_length",
    color="petal_length",
    # custom scale colors can be any valid browser css color
    color_continuous_scale=["lemonchiffon", "#FA8173", "rgb(201, 61, 44)"]
)
```

### Unique marker symbols by group



```python order=scatter_plot_diamonds,scatter_plot_symbol_by,scatter_plot_symbol_map
import deephaven.plot.express as dx
iris = dx.data.iris()

# Ex 1. Assign a custom symbol
scatter_plot_symbol = dx.scatter(
    iris,
    x="sepal_width",
    y="sepal_length",
    # See list of available symbols.
    symbol_sequence=["diamond"]
)

# Ex 2. Use symbols to differentiate groups
scatter_plot_symbol_by = dx.scatter(
    iris,
    x="sepal_width",
    y="sepal_length",
    color="species",
    # Assign symbols by group, shown using default symbol_sequence
    symbol="species"
)

# Ex 3. Use a map to assign symbols to groups
scatter_plot_symbol_map = dx.scatter(
    iris,
    x="sepal_width",
    y="sepal_length",
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
iris = dx.data.iris()

# Ex 1. Use values from a column as positive and negative error bars
scatter_plot_error = dx.scatter(
    iris.update("error_sepal_width = sepal_width * 0.01"),
    x="sepal_width",
    y="sepal_length",
    error_x="error_sepal_width",
)

#Ex 2. Use values from two columns for y-positive-error and y-negative-error
scatter_plot_error_minus = dx.scatter(
    iris.update(
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
    error_y_minus="error_sepal_length_negative",
)
```

### Labels and Hover Text

<!-- TODO: labels has a bug, check it works now -->

```python order=scatter_plot_title,scatter_plot_axes_titles
import deephaven.plot.express as dx
iris = dx.data.iris()

# Ex 1. Label axes using a map
scatter_plot_title = dx.scatter(
    iris,
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
    iris,
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
iris = dx.data.iris()

# Ex 1. Histogram style marginals
scatter_marginal_histogram = dx.scatter(
    iris,
    x="petal_width",
    y="petal_length",
    marginal_x="histogram",
    marginal_y="histogram",
)

# Ex 2. Violin style marginals
scatter_marginal_violin = dx.scatter(
    iris,
    x="petal_width",
    y="petal_length",
    marginal_x="violin",
    marginal_y="violin",
)

# Ex 3. Rug style marginals
scatter_marginal_rug = dx.scatter(
    iris,
    x="petal_width",
    y="petal_length",
    marginal_x="rug",
    marginal_y="rug",
)

# Ex 4. Box style marginals
scatter_marginal_box = dx.scatter(
    iris,
    x="petal_width",
    y="petal_length",
    marginal_x="box",
    marginal_y="box",
)
```

### Log Axes

```python order=scatter_plot_log
import deephaven.plot.express as dx
iris = dx.data.iris()

scatter_plot_axes_titles = dx.scatter(
    iris,
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
iris = dx.data.iris()

scatter_plot_range = dx.scatter(
    iris,
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
iris = dx.data.iris()

# Ex 1. Create multiple axes from mulitple columns
scatter_plot_axes_titles = dx.scatter(
    iris,
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

iris = dx.data.iris()  # import the example iris data set
# find the max peaks of each series to use as our example markers
marker_table = iris.select(["species", "petal_length", "timestamp"]).join(
    iris.select(["species", "petal_length"]).max_by("species"),
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
        iris,
        x="timestamp",
        y="petal_length",
        color="species",
    ),
)
```

### Large Data Sets

The default `render_mode` is webgl and can comfortably plot around 0.5 - 1 million points before performance of the browser will begin to degrade. In `render_mode=svg` that drops to around 10,000 points, but may offer more accurate rendering for some GPUs.

In situations where scatter plots become impractical due to overlaping markers in large datasets, it is advisable to consider employing a Density Heatmap (2D Histogram) as an alternative visualization method. This approach allows for data binning through the query engine, enabling visualization of billions of data points, making it more suitable for handling such scenarios. Moreover, users may benefit from a clearer interpretation of the data using this method.

For large, but managable datasets, setting an appropriate opacity can be beneficial as it helps address data overlap issuess, making the individual data points more distinguishable and enhancing overall visualization clarity.

<!-- TODO: link to density heatmap -->

```python order=density_heatmap,scatter_plot_opacity
import deephaven.plot.express as dx
iris = dx.data.iris()

# TODO: Method doesn't exist yet
# Consider a 2d Histograms for large data sets
density_heatmap = dx.density_heatmap(iris, x="sepal_width", y="sepal_length")

scatter_plot_opacity = dx.scatter(
    iris,
    x="sepal_width",
    y="sepal_length",
    # For data sets with a high degree of overlap between points, consider setting opacity
    opacity=0.5
)
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.scatter
```
