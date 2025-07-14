# Violin Plot

A violin plot is a data visualization that combines a box plot with a rotated kernel density plot to provide a comprehensive representation of the data distribution. It offers a detailed view of the data's central tendency, spread and density.

Violin plots are appropriate when the data contain a continuous variable of interest. If there is an additional categorical variable that the variable of interest depends on, side-by-side violin plots may be appropriate using the `by` argument.

## What are violin plots useful for?

- **Comparing distributions**: Violin plots are effective for visually comparing and contrasting the distribution of multiple datasets or categories, allowing for quick identification of differences in data patterns.
- **Assessing central tendency and spread**: Violin plots provide insights into the central tendencies and variability of data, including the median, quartiles, and potential outliers.
- **Identifying multimodal data**: They are particularly useful when dealing with data that exhibits multiple modes or peaks, as they can reveal these underlying patterns effectively.

## Examples

### A basic violin plot

Visualize the distribution of a single variable by passing the column name to the `x` or `y` arguments.

```python order=violin_plot_x,violin_plot_y,versicolor
import deephaven.plot.express as dx
iris = dx.data.iris()

# subset to get a specific group
versicolor = iris.where("Species == `versicolor`")

# control the plot orientation using `x` or `y`
violin_plot_x = dx.violin(versicolor, x="SepalLength")
violin_plot_y = dx.violin(versicolor, y="SepalLength")
```

### Distributions for multiple groups

Create separate violins for each group of data by passing the name of the grouping column(s) to the `by` argument.

```python order=violin_plot_group,iris
import deephaven.plot.express as dx
iris = dx.data.iris()

violin_plot_group = dx.violin(iris, x="SepalLength", by="Species")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.violin
```
