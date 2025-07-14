# 3D Line Plot

3D line plots are a data visualization technique that displays data points as connected line segments in a three-dimensional space. They are used to visualize and continuous variables that depend on two continuous independent variables, facilitating the exploration of patterns, trends, and relationships within the data.

3D line plots are appropriate when a continuous response variable depends on two continuous explanatory variables. If there is an additional categorical variable that the response variable depends on, shapes or colors can be used in the scatter plot to distinguish the categories. Further, line plots are preferable to scatter plots when the explanatory variables are ordered.

## What are 3D line plots useful for?

- **Multidimensional data visualization**: 3D line plots allow for the representation of data in a 3D space, providing a more comprehensive view of complex relationships.
- **Trend exploration**: 3D line plots are useful for exploring and understanding trends, patterns, and variations in data within a 3D space, making them valuable in scientific and engineering fields.
- **Data interaction**: They enable the visualization of data interactions within 3D datasets, aiding in the analysis of data dependencies and correlations.

Alternatives to 3D line plots include:

- **[Scatter Plots](scatter.md) with Color or Size Mapping**: These can be used to represent three variables with the addition of color or size mapping to signify the third dimension.
- **[Density Heatmaps](density_heatmap.md)**: When visualizing continuous data over a 3D space, density heatmaps may be more appropriate, as they create a continuous surface representation.

## Examples

### A basic 3D line plot

Visualize the relationship between three variables by passing their column names to the `x`, `y`, and `z` arguments. Click and drag on the resulting chart to rotate it for new perspectives.

```python order=line_plot_3D,spiral
import deephaven.plot.express as dx
from deephaven import time_table

# create a simple spiral dataset
spiral = time_table("PT0.01s").update_view(
    ["X = sin(ii / 100)", "Y = cos(ii / 100)", "Z = 4 * ii / 100"]
)

line_plot_3D = dx.line_3d(spiral, x="X", y="Y", z="Z")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.line_3d
```
