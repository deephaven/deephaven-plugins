# Line Geo

A line geo plot is a geographic visualization that connects data points with lines on a map using latitude and longitude coordinates or locations. The lines are ideal for visualizing relationships between geographic locations such as paths or routes.

Line geo plots are appropriate when the dataset contains geographic coordinates (latitude and longitude) or locations that connect across geographic areas. `line_geo` visualizes data using a basic map projection, without a high degree of detail. For richer tile maps, use [`line_map`](./line-map.md). For visualizing values at individual locations, consider using [`scatter_geo`](./scatter-geo.md).

## What are line geo plots useful for?

- **Geographic relationships**: They are excellent for showing connections or relationships between different geographic locations, such as routes or paths.
- **Simple geographic context**: Line geo plots provide a clear and straightforward way to visualize geographic data that does not require detailed map features.
- **Sequential geographic data**: Geographic line plots specialize in showing how data changes across connected geographic points over time or other ordered dimensions.

## Examples

### A basic line geo plot

Visualize geographic paths by passing longitude and latitude column names to the `lon` and `lat` arguments. Click and drag on the resulting map to pan and zoom.

```python order=line_geo_plot,path
import deephaven.plot.express as dx
from deephaven import time_table

# Create a simple path dataset
path = time_table("PT1s").update_view(
    ["Lon = ((ii - 90) % 360)", "Lat = cos(ii/10) * 30"]
)

line_geo_plot = dx.line_geo(path, lat="Lat", lon="Lon")
```

### Color by group

Denote different routes or paths by using the color of the lines as group indicators by passing the grouping column name to the `by` argument.

```python order=line_geo_plot,paths
import deephaven.plot.express as dx
from deephaven import time_table

# Create a simple dataset with two paths
paths = time_table("PT1s").update_view(
    ["Path = i % 2", "Lon = ((ii - 90) % 360)", "Lat = Path == 0 ? cos(ii/10) * 30 : sin(ii/10) * 30"]
)

line_geo_colors = dx.line_geo(paths, lat="Lat", lon="Lon", by="Path")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.line_geo
```
