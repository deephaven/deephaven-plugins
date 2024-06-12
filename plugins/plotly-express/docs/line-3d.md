# 3D Line Plot

3D line plots are a data visualization technique that displays data points as connected line segments in a three-dimensional space. They are used to visualize and continuous variables that depend on two continuous independent variables, facilitating the exploration of patterns, trends, and relationships within the data.

3D line plots are useful for:

1. **Multidimensional Data Visualization**: They allow for the representation of data in a 3D space, providing a more comprehensive view of complex relationships.
2. **Trend Exploration**: 3D line plots are useful for exploring and understanding trends, patterns, and variations in data within a 3D space, making them valuable in scientific and engineering fields.
3. **Data Interaction**: They enable the visualization of data interactions within three-dimensional datasets, aiding in the analysis of data dependencies and correlations.

Alternatives to 3D line plots include:

- **Scatter Plots with Color or Size Mapping**: These can be used to represent three variables with the addition of color or size mapping to signify the third dimension.
- **Surface Plots**: When visualizing continuous data over a 3D space, surface plots may be more appropriate, as they create a continuous surface representation.

## Examples

### A basic 3D line plot

```python
import deephaven.plot.express as dx
from deephaven import time_table

# create a simple spiral dataset
spiral = time_table("PT0.01s").update_view(
    ["X = sin(ii / 100)", "Y = cos(ii / 100)", "Z = 4 * ii / 100"]
)

# create a basic 3d line plot by specifying each spatial component
spiral_plot = dx.line_3d(t, x="X", y="Y", z="Z")
```