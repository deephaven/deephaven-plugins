# Polar Scatter Plot

Polar scatter plots are a data visualization method that represents data points on a polar coordinate system. They display individual data points as dots or markers in a circular plot, providing a means to visualize the distribution, relationships, or patterns in data with angular or directional dependencies. Polar scatter plots are particularly useful for exploring data within a circular context, where the angle or periodic nature of the data is a significant aspect.

Polar scatter plots are appropriate when the data contain a continuous variable represented in polar coordinates, with a radial and an angular component instead of the typical x and y components.

## What are polar scatter plots useful for?

- **Analyzing cyclical data**: Polar scatter plots are valuable for analyzing data with cyclical or periodic patterns, as they enable the visualization of cyclic trends and periodic variations within the data.
- **Representing directional data**: They are used to represent directional data, such as wind directions, compass bearings, or angular measurements, providing a visual means to explore data with specific orientations.
- **Angular or Periodic Data Relationships**: Polar scatter plots aid in exploring relationships and correlations in data with angular or periodic dependencies, making them suitable for applications where understanding circular patterns is essential.

## Examples

### A basic polar scatter plot

Visualize a dataset in polar coordinates by passing column names to the `r` and `theta` arguments. `theta` may be a string of cardinal directions, as in this case. `theta` also supports the use of numeric types that may represent radians or degrees, depending on how the `range_theta` argument is supplied.

```python order=polar_scatter_plot,wind
import deephaven.plot.express as dx
wind = dx.data.wind()

# `by` is used to separate data by groups
polar_scatter_plot = dx.scatter_polar(wind, r="Frequency", theta="Direction", by="Strength")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.scatter_polar
```
