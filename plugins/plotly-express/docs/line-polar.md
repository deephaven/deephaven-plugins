# Polar Line Plot

Polar line plots are a type of data visualization that represents data points on a polar coordinate system. They display data as connected line segments extending from the center of a circular plot, often used to illustrate relationships, trends, or patterns within data that have angular or periodic dependencies.

Polar line plots are appropriate when the data contain a continuous variable represented in polar coordinates, with a radial and an angular component instead of the typical x and y components. Further, polar line plots are preferable to polar scatter plots when the explanatory variables are ordered.

### What are polar line plots useful for?

- **Cyclical data analysis**: They are ideal for analyzing cyclical or periodic data, such as daily temperature fluctuations, seasonal patterns, or circular processes in physics and engineering.
- **Representing directional data**: Polar line plots are valuable for representing directional data, such as wind direction, compass bearings, or circular measurements, offering a clear way to visualize and analyze these kinds of patterns.
- **Phase or angular relationships**: When assessing phase shifts, angular dependencies, or correlations in data, polar line plots provide an intuitive representation for understanding relationships within circular data.

## Examples

### A basic polar line plot

```python order=wind_line,wind
import deephaven.plot.express as dx
wind = dx.data.wind()

# create a polar line plot by specifying `r` and `theta`. `by` is used to separate data by groups
wind_line = dx.line_polar(wind, r="frequency", theta="direction", by="strength")
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.line_polar
```