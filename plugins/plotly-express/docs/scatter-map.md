# Scatter Map

A scatter geo plot is a geographic visualization that displays individual data points on a map using latitude and longitude coordinates or locations. The points are ideal for visualizing the distribution of data across geographic areas.

Scatter map plots are appropriate when the dataset contains geographic coordinates (latitude and longitude) or locations that represent individual points on a map. `scatter_map` visualizes data using detailed map tiles. For simpler projection maps, use [`scatter_geo`](./scatter-geo.md). For visualizing connections between locations, consider using [`line_map`](./line-map.md).

## What are scatter map plots useful for?

- **Geographic distribution**: They are excellent for showing the distribution of individual geographic locations on a map.
- **Detailed geographic context**: Scatter map plots provide a rich and detailed way to visualize geographic data with map tile features.

## Examples

### A basic scatter map plot

Visualize geographic paths by passing longitude and latitude column names to the `lon` and `lat` arguments. Click and drag on the resulting map to pan and zoom.

```python order=scatter_map_plot,path
import deephaven.plot.express as dx
from deephaven import time_table

# Create a simple path dataset
path = time_table("PT1s").update_view(
    ["Lon = ((ii - 90) % 360)", "Lat = cos(ii/10) * 30"]
)

# Create the scatter map plot
# Color is set for better visibility
scatter_map_plot = dx.scatter_map(path, lat="Lat", lon="Lon", color_discrete_sequence="black")
```

### Color by group

Denote different routes or paths by using the color of the lines as group indicators by passing the grouping column name to the `by` argument.

```python order=scatter_map_plot,paths
import deephaven.plot.express as dx
from deephaven import time_table

# Create a simple dataset with two paths
paths = time_table("PT1s").update_view(
    ["Path = i % 2", "Lon = ((ii - 90) % 360)", "Lat = Path == 0 ? cos(ii/10) * 30 : sin(ii/10) * 30"]
)
# Create the scatter map plot
# Color is set for better visibility
scatter_map_plot = dx.scatter_map(paths, lat="Lat", lon="Lon", color_discrete_sequence=["black", "darkgrey"], by="Path")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.scatter_map
```
