# Scatter Plot

A scatter plot is a type of data visualization that uses Cartesian coordinates to display values for typically two variables. It represents individual data points as dots on a graph, with each dot's position indicating its corresponding values on the two variables being plotted.

Scatter plots are appropriate when the data contain a continuous response variable that directly depends on a continuous explanatory variable. If there is an additional categorical variable that the response variable depends on, shapes or colors can be used in the scatter plot to distinguish the categories. For large datasets (> 1 million points), consider using a [density heatmap](density_heatmap.md) instead of a scatter plot.

## What are scatter plots useful for?

- **Exploring relationships**: Scatter plots are useful for exploring and visualizing the relationship between two continuous variables. By plotting the data points, you can quickly identify patterns, trends, or correlations between the variables. It helps in understanding how changes in one variable affect the other.
- **Outlier detection**: Scatter plots are effective in identifying outliers or extreme values in a dataset. Outliers appear as points that deviate significantly from the general pattern of the data. By visualizing the data in a scatter plot, you can easily spot these outliers, which may be important in certain analyses.
- **Clustering analysis**: If you suspect that your data might exhibit clusters or groups, a scatter plot can help you identify those clusters. By observing the distribution of the points, you can visually determine if there are distinct groups forming or if the points are evenly spread out.

## Examples

### A basic scatter plot

Visualize the relationship between two variables by passing each column name to the `x` and `y` arguments.

```python order=scatter_plot,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

scatter_plot = dx.scatter(iris, x="SepalWidth", y="SepalLength")
```

### Create a bubble plot

Use the `size` argument to resize the markers by a third quantitative variable. Such a plot is commonly called a bubble plot, where the size of each bubble corresponds to the value of the additional variable.

The `size` argument interprets the values in the given column as pixel size, so you may consider scaling or normalizing these values before creating the bubble chart.

```python order=bubble_plot,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

bubble_plot = dx.scatter(iris, x="SepalWidth", y="SepalLength", size="PetalLength")
```

### Color markers by group

Denote groups of data by using the color of the markers as group indicators by passing the grouping column name to the `by` argument.

```python order=scatter_plot_groups,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

scatter_plot_groups = dx.scatter(iris, x="SepalWidth", y="SepalLength", by="Species")
```

Customize these colors using the `color_discrete_sequence` or `color_discrete_map` arguments. Any [CSS color name](https://www.w3schools.com/cssref/css_colors.php), hexadecimal color code, or set of RGB values will work.

```python order=custom_colors_1,custom_colors_2,custom_colors_3,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# use a list
custom_colors_1 = dx.scatter(
    iris,
    x="SepalWidth",
    y="SepalLength",
    by="Species",
    # A list of colors to sequentially apply to one or more series
    # The colors loop if there are more series than colors
    color_discrete_sequence=["salmon", "#fffacd", "rgb(100,149,237)"]
)

# or a dictionary
custom_colors_2 = dx.scatter(
    iris,
    x="SepalWidth",
    y="SepalLength",
    by="Species",
    # set each series to a specific color
    color_discrete_map={"virginica":"lemonchiffon", "setosa": "cornflowerblue", "versicolor":"#FA8173"}
)

# or, create a new table with a column of colors, and use that column for the color values
iris_with_custom_colors = iris.update(
    "example_colors = `rgb(` + Math.round(Math.random() * 255) + `,` + Math.round(Math.random() * 255) + `,`  + Math.round(Math.random() * 255) +`)`"
)

custom_colors_3 = dx.scatter(
    iris_with_custom_colors,
    x="SepalWidth",
    y="SepalLength",
    by="example_colors",
    # When set to `identity`, the column data passed to the
    # grouping/color parameter will be used as the actual color
    color_discrete_map="identity"
)
```

### Color markers by a continuous variable

Markers can also be colored by a continuous value by specifying the `color_continuous_scale` argument.

```python order=scatter_plot_conts,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

scatter_plot_conts = dx.scatter(
    iris,
    x="SepalWidth",
    y="SepalLength",
    by="PetalLength",
    # use any plotly express built in color scale name
    color_continuous_scale="viridis"
)
```

Or, supply your own custom color scale to `color_continuous_scale`.

```python order=custom_colors_conts,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

custom_colors_conts = dx.scatter_3d(
    iris,
    x="SepalWidth",
    y="SepalLength",
    by="PetalLength",
    # custom scale colors can be any valid browser css color
    color_continuous_scale=["lemonchiffon", "#FA8173", "rgb(201, 61, 44)"]
)
```

### Unique symbols by group

Rather than using the color of the markers to visualize groups, you can use different symbols for each group with the `symbol`, `symbol_map`, or `symbol_sequence` arguments.

```python order=scatter_plot_symbol_1,scatter_plot_symbol_2,scatter_plot_symbol_3,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# assign the grouping column to the `symbol` argument, and plotly will pick a symbol for each group
scatter_plot_symbol_1 = dx.scatter(
    iris,
    x="SepalWidth",
    y="SepalLength",
    by="Species",
    # Assign symbols by group, shown using default symbol_sequence
    symbol="Species"
)

# or, assign a sequence of symbols to the `symbol_sequence` argument
scatter_plot_symbol_2 = dx.scatter(
    iris,
    x="SepalWidth",
    y="SepalLength",
    # See list of available symbols.
    symbol_sequence=["diamond", "circle", "triangle"]
)

# use `symbol_map` to assign a particular symbol to each group
scatter_plot_symbol_3 = dx.scatter(
    iris,
    x="SepalWidth",
    y="SepalLength",
    by="Species",
    # Using a map for symbols by value
    symbol="Species",
    symbol_map={"setosa":"cross", "versicolor":"pentagon", "virginica":"star"}
)
```

### Rename axes

Use the `labels` argument or the `xaxis_titles` and `yaxis_titles` arguments to change the names of the axis labels.

```python order=scatter_plot_labels_1,scatter_plot_labels_2,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# pass a dict of axis names to the `labels` argument to rename the axes
scatter_plot_labels_1 = dx.scatter(
    iris,
    x="SepalWidth",
    y="SepalLength",
    # relabel axes with a dict
    labels={"SepalWidth": "Sepal Width", "SepalLength": "Sepal Length"},
)

# or, pass a new label to each of `xaxis_titles` and `yaxis_titles`
scatter_plot_labels_2 = dx.scatter(
    iris,
    x="SepalWidth",
    y="SepalLength",
    # relabel axes with separate strings
    xaxis_titles="Sepal Width",
    yaxis_titles="Sepal Length",
)
```

### Marginals

Plot marginals are additional visual representations, like [histograms](histogram.md) or [violin plots](violin.md), displayed alongside the main plot to provide insights into the individual distributions of variables being analyzed. Use the `marginal_x` and `marginal_y` arguments to plot marginals.

```python order=scatter_marginal_histogram,scatter_marginal_violin,scatter_marginal_box,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# histogram style marginals
scatter_marginal_histogram = dx.scatter(
    iris,
    x="PetalWidth",
    y="PetalLength",
    marginal_x="histogram",
    marginal_y="histogram",
)

# violin style marginals
scatter_marginal_violin = dx.scatter(
    iris,
    x="PetalWidth",
    y="PetalLength",
    marginal_x="violin",
    marginal_y="violin",
)

# box style marginals
scatter_marginal_box = dx.scatter(
    iris,
    x="PetalWidth",
    y="PetalLength",
    marginal_x="box",
    marginal_y="box",
)
```

### Log axes

Use `log_x` or `log_y` to use log-scale axes in your plot.

```python order=scatter_plot_log_axes,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# create log axes
scatter_plot_log_axes = dx.scatter(
    iris,
    x="PetalWidth",
    y="PetalLength",
    log_x=True,
    log_y=True,
)
```

### Rescale axes

Use `range_x` or `range_y` to set the range values of each axis explicitly.

```python order=scatter_plot_range_axes,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# set the axis range explicitly
scatter_plot_range_axes = dx.scatter(
    iris,
    x="PetalWidth",
    y="PetalLength",
    range_x=[0,5],
    range_y=[0,10],
)
```

### Multiple Axes

You can create multiple axes on a single graph in a number of different ways depending on what you are trying to do. Axes can be created from columns, or by value from a column, of from multiple plots layered together.

```python order=layered_scatter,table_versicolor,table_setosa,layered_table,scatter_stocks,stocks_table,scatter_plot_axes_titles,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

# create multiple axes from mulitple columns
scatter_plot_axes_titles = dx.scatter(
    iris,
    x="SepalWidth",
    # each y value becomes a seperate series
    y=["SepalLength", "PetalLength"],
    # position each axis for each series
    yaxis_sequence=[1, 2],
    # Label the axes
    xaxis_titles=["Sepal Width"],
    yaxis_titles=["Sepal Length", "Petal Length"],
)


# create multiple axes by values from a column
stocks_table = dx.data.stocks().where("Sym in `DOG`, `CAT`")

scatter_stocks = dx.scatter(
    stocks_table,
    x="Timestamp",
    y="Price",
    by="Sym",
    # Apply each trace to a different axis
    yaxis_sequence=[1, 2],
    # Label each axis, where order is by first appearence in the data
    yaxis_titles=["CAT", "DOG"],
)

# create multiple axes from multiple tables using layers
layered_table = dx.data.iris() # import the example iris data set

# split into two tables by species
table_setosa = layered_table.where("Species = `setosa`")
table_versicolor = layered_table.where("Species = `versicolor`")

# layer two plots together, layout is inherited from the last table in the layer
layered_scatter = dx.layer(
    # scatter plot from table 1
    dx.scatter(
        table_setosa,
        x="PetalWidth",
        y="PetalLength",
        color_discrete_sequence=["salmon"],
    ),
    # scatter from table 2
    dx.scatter(
        table_versicolor,
        x="PetalWidth",
        y="PetalLength",
        color_discrete_sequence=["lemonchiffon"],
        # place this trace on a secondary axis
        yaxis_sequence=[2],
        # set the titles for both axes, as layer inherits from this layout
        yaxis_titles=["Versicolor Petal Length","Setosa Petal Length"]
    )
)
```

### Layer event markers

Combines a line plot and a scatter plot to use as event markers indicating the maximum peak in each series.

```python order=scatter_as_markers,marker_table
import deephaven.plot.express as dx

iris = dx.data.iris()  # import the example iris data set
# find the max peaks of each series to use as our example markers
marker_table = iris.select(["Species", "PetalLength", "Timestamp"]).join(
    iris.select(["Species", "PetalLength"]).max_by("Species"),
    on=["Species", "PetalLength"],
)

# layer  as scatter on a line plot
scatter_as_markers = dx.layer(
    # create a scatter plot to use as markers
    dx.scatter(
        marker_table,
        x="Timestamp",
        y="PetalLength",
        symbol_sequence=["x"],
        size_sequence=[15],
        hover_name="Species",
        color_discrete_sequence=["#FFF"],
    ),
    # layer it with a line plot
    dx.line(
        iris,
        x="Timestamp",
        y="PetalLength",
        by="Species",
    ),
)
```

### Large data sets

Deephaven's scatter plots can comfortably render around 0.5 - 1 million points before performance of the browser will begin to degrade. For large datasets under 1 million observations, setting an appropriate marker opacity and/or marker size can provide a much clearer picture of the data. If the number of points is expected to exceed 1 million, consider employing a [density heatmap](density_heatmap.md) as an alternative visualization method, which can easily summarize billions of data points in a single plot.

```python skip-test
from deephaven.plot import express as dx
from deephaven import empty_table

large_data = empty_table(1_000_000).update([
   "X = 50 + 25 * cos(i * Math.PI / 180)",
   "Y = 50 + 25 * sin(i * Math.PI / 180)",
])

# heatmap can be a good alternative to scatter plots with many points
heatmap_replacement = dx.density_heatmap(large_data, x="X", y="Y", range_bins_x=[0,100], range_bins_y=[0,100])

# alternatively, consider a scatter plot with reduced opacity
scatter_plot_opacity = dx.scatter(large_data, x="X", y="Y", range_x=[0,100], range_y=[0,100], opacity=0.01)
```

### Calendar

Scatter plots take a calendar argument. Dates and times are excluded from axes so that they conform to the calendar.

```python order=scatter_plot_cal_name,scatter_plot_cal_y,scatter_plot_cal,scatter_plot_default,dog_prices,stocks
import deephaven.plot.express as dx
from deephaven.calendar import calendar, set_calendar

cal_name = "USNYSE_EXAMPLE"
cal = calendar(cal_name)
set_calendar(cal_name)

stocks = dx.data.stocks(starting_time="2018-06-01T09:27:00 ET")

dog_prices = stocks.where("Sym = `DOG`")

# plot with a specific calendar by name
scatter_plot_cal_name = dx.scatter(
    dog_prices, x="Timestamp", y="Price", calendar=cal_name
)

# plot with a specific calendar by name on the y-axis
scatter_plot_cal_y = dx.scatter(dog_prices, x="Price", y="Timestamp", calendar=cal_name)

# plot with a specific calendar object
scatter_plot_cal = dx.scatter(dog_prices, x="Timestamp", y="Price", calendar=cal)

# plot with the default calendar
scatter_plot_default = dx.scatter(dog_prices, x="Timestamp", y="Price", calendar=True)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.scatter
```
