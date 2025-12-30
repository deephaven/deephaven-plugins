# Density Map

A density map plot is a geographic visualization that connects data points with a heatmap on a geographic map using latitude and longitude coordinates or locations. The heatmap is ideal for visualizing the density of data across geographic areas.

Density map plots are appropriate when the dataset contains geographic coordinates (latitude and longitude) or locations that represent individual points on a map. `density_map` visualizes data using detailed map tiles. For visualizing individual points, use [`scatter_geo`](./scatter-geo.md) or [`scatter_map`](./scatter-map.md).

## What are density map plots useful for?

- **Geographic density**: They are excellent for showing the density of individual geographic locations on a map.
- **Detailed geographic context**: Density map plots provide a rich and detailed way to visualize geographic data with map tile features.

## Examples

### A basic density map plot

Visualize geographic density by passing longitude and latitude column names to the `lon` and `lat` arguments. Click and drag on the resulting map to pan and zoom.

```python order=density_map_plot,path
import deephaven.plot.express as dx
from deephaven import time_table

# Create a simple path dataset
path = time_table("PT1s").update_view(
    ["Lon = ((ii - 90) % 360)", "Lat = cos(ii/10) * 30"]
)

# Create the density map plot
# Color is set for better visibility
density_map_plot = dx.density_map(path, lat="Lat", lon="Lon")
```

### Variable density plot

Provide variable geographic densities by using the `z` argument to specify a column that contains density values.

```python order=density_map_plot,path
import deephaven.plot.express as dx
from deephaven import time_table

# Create a simple dataset with density values
path = time_table("PT1s").update_view(
    ["Lon = ((ii - 90) % 360)", "Lat = cos(ii/10) * 30", "Z = ii % 100"]
)

# Create the density map plot
# Color is set for better visibility
density_map_plot = dx.density_map(path, lat="Lat", lon="Lon", z="Z")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.line_map
```
