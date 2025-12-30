# Scatter Geo

A scatter geo plot is a geographic visualization that displays individual data points on a map using latitude and longitude coordinates or locations. The points are ideal for visualizing the distribution of data across geographic areas.

Scatter geo plots are appropriate when the dataset contains geographic coordinates (latitude and longitude) or locations that represent individual points on a map. `scatter_geo` visualizes data using a basic map projection, without a high degree of detail. For richer tile maps, use [`scatter_map`](./scatter-map.md). For visualizing connections between locations, consider using [`line_geo`](./line-geo.md).

## What are scatter geo plots useful for?

- **Geographic distribution**: They are excellent for showing the distribution of individual geographic locations on a map.
- **Simple geographic context**: Scatter geo plots provide a clear and straightforward way to visualize geographic data that does not require detailed map features.

## Examples

### A basic scatter geo plot

Visualize geographic paths by passing longitude and latitude column names to the `lon` and `lat` arguments. Click and drag on the resulting map to pan and zoom.

```python order=scatter_geo_plot,path
import deephaven.plot.express as dx
from deephaven import time_table

# Create a simple path dataset
path = time_table("PT1s").update_view(
    ["Lon = ((ii - 90) % 360)", "Lat = cos(ii/10) * 30"]
)

scatter_geo_plot = dx.scatter_geo(path, lat="Lat", lon="Lon")
```

### Color by group

Denote different routes or paths by using the color of the points as group indicators by passing the grouping column name to the `by` argument.

```python order=scatter_geo_plot,paths
import deephaven.plot.express as dx
from deephaven import time_table

# Create a simple dataset with two paths
paths = time_table("PT1s").update_view(
    ["Path = i % 2", "Lon = ((ii - 90) % 360)", "Lat = Path == 0 ? cos(ii/10) * 30 : sin(ii/10) * 30"]
)

scatter_geo_colors = dx.scatter_geo(paths, lat="Lat", lon="Lon", by="Path")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.scatter_geo
```
