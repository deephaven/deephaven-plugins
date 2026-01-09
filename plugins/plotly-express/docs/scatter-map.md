# Scatter Map

A scatter geo plot is a geographic visualization that displays individual data points on a map using latitude and longitude coordinates or locations. The points are ideal for visualizing the distribution of data across geographic areas.

Scatter map plots are appropriate when the dataset contains geographic coordinates (latitude and longitude) or locations that represent individual points on a map. `scatter_map` visualizes data using detailed map tiles. For simpler projection maps, use [`scatter_geo`](./scatter-geo.md). For visualizing connections between locations, consider using [`line_map`](./line-map.md).

## What are scatter map plots useful for?

- **Geographic distribution**: They are excellent for showing the distribution of individual geographic locations on a map.
- **Detailed geographic context**: Scatter map plots provide a rich and detailed way to visualize geographic data with map tile features.

## Examples

### A basic scatter map plot

Visualize geographic points by passing longitude and latitude column names to the `lon` and `lat` arguments.
It's recommended to set the initial `zoom` level and `center` coordinates for better visualization based on the data. Click and drag on the resulting map to pan and zoom.

```python order=scatter_map_plot,outages_table
import deephaven.plot.express as dx

# Load the outages dataset
outages_table = dx.data.outages()

# Create a scatter map showing individual outage points
# Color is set for visibility
# Zoom and center are set for better initial view
scatter_map_plot = dx.scatter_map(
    outages_table,
    lat="Lat",
    lon="Lon",
    color_discrete_sequence="black",
    zoom=9,
    center={"lat": 44.97, "lon": -93.17}
)
```

### Color by group

Denote different categories by using the color of the points as group indicators by passing the grouping column name to the `by` argument. Set the color of each group using the `color_discrete_sequence` argument.

```python order=scatter_map_plot,outages_table
import deephaven.plot.express as dx

# Load the outages dataset
outages_table = dx.data.outages().sort_descending("Severity")

# Color each outage point differently based on the cause
# Zoom and center are set for better initial view
scatter_map_plot = dx.scatter_map(
    outages_table,
    lat="Lat",
    lon="Lon",
    by="Severity",
    color_discrete_sequence=["black", "blue", "purple", "green"],
    zoom=9,
    center={"lat": 44.97, "lon": -93.17}
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.scatter_map
```
