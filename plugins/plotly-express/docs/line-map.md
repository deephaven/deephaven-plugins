# Line Map

A line map plot is a geographic visualization that connects data points with lines on a map using latitude and longitude coordinates or locations. The lines are ideal for visualizing relationships between geographic locations such as paths or routes.

Line map plots are appropriate when the dataset contains geographic coordinates (latitude and longitude) or locations that connect across geographic areas. `line_map` visualizes data using detailed map tiles. For simpler projection maps, use [`line_geo`](./line-geo.md). For visualizing values at individual locations, consider using [`scatter_map`](./scatter-map.md).

## What are line map plots useful for?

- **Geographic relationships**: They are excellent for showing connections or relationships between different geographic locations, such as routes or paths.
- **Detailed geographic context**: Line map plots provide a rich and detailed way to visualize geographic data with map tile features.
- **Sequential geographic data**: Geographic line plots specialize in showing how data changes across connected geographic points over time or other ordered dimensions.

## Examples

### A basic line map plot

Visualize geographic paths by passing longitude and latitude column names to the `lon` and `lat` arguments. Click and drag on the resulting map to pan and zoom.

```python order=line_map_plot,path
import deephaven.plot.express as dx
from deephaven import time_table

# Create a simple path dataset
path = time_table("PT1s").update_view(
    ["Lon = ((ii - 90) % 360)", "Lat = cos(ii/10) * 30"]
)

# Create the line map plot
# Color is set for better visibility
line_map_plot = dx.line_map(path, lat="Lat", lon="Lon", color_discrete_sequence="black")
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
# Create the line map plot
# Color is set for better visibility
line_map_plot = dx.line_map(paths, lat="Lat", lon="Lon", color_discrete_sequence=["black", "darkgrey"], by="Path")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.line_map
```
