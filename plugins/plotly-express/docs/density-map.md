# Density Map

A density map plot is a geographic visualization that connects data points with a heatmap on a geographic map using latitude and longitude coordinates or locations. The heatmap is ideal for visualizing the density of data across geographic areas.

Density map plots are appropriate when the dataset contains geographic coordinates (latitude and longitude) or locations that represent individual points on a map. `density_map` visualizes data using detailed map tiles. For visualizing individual points, use [`scatter_geo`](./scatter-geo.md) or [`scatter_map`](./scatter-map.md).

## What are density map plots useful for?

- **Geographic density**: They are excellent for showing the density of individual geographic locations on a map.
- **Detailed geographic context**: Density map plots provide a rich and detailed way to visualize geographic data with map tile features.

## Examples

### A basic density map plot

Visualize geographic density by passing longitude and latitude column names to the `lon` and `lat` arguments.
It's recommended to set the initial `zoom` level and `center` coordinates for better visualization based on the data. Click and drag on the resulting map to pan and zoom.

```python order=density_map_plot,outages_table
import deephaven.plot.express as dx

# Load the outages dataset
outages_table = dx.data.outages()

# Create a density map showing concentration of outages
# Zoom and center are set for better initial view
density_map_plot = dx.density_map(
    outages_table,
    lat="Lat",
    lon="Lon",
    zoom=9,
    center={"lat": 44.97, "lon": -93.17}
)
```

### Adjust the density radius

Control how spread out the density visualization appears using the `radius` argument.

```python order=density_map_plot,outages_table
import deephaven.plot.express as dx

# Load the outages dataset
outages_table = dx.data.outages()

# Use a larger radius for a more diffuse heatmap
# Zoom and center are set for better initial view
density_map_plot = dx.density_map(
    outages_table,
    lat="Lat",
    lon="Lon",
    radius=10,
    zoom=9,
    center={"lat": 44.97, "lon": -93.17}
)
```

### Customize the color scale

Change the color scale using the `color_continuous_scale` argument.

```python order=density_map_plot,outages_table
import deephaven.plot.express as dx

# Load the outages dataset
outages_table = dx.data.outages()

# Use a different color scale
# Zoom and center are set for better initial view
density_map_plot = dx.density_map(
    outages_table,
    lat="Lat",
    lon="Lon",
    color_continuous_scale=["yellow", "orange", "red"],
    zoom=9,
    center={"lat": 44.97, "lon": -93.17}
)
```

### Change map style

Use different base map styles with the `map_style` argument. Recommended options are 'open-street-map', 'carto-positron', and 'carto-darkmatter'.

```python order=density_map_plot,outages_table
import deephaven.plot.express as dx

# Load the outages dataset
outages_table = dx.data.outages()

# Use a dark map style for better contrast
# Zoom and center are set for better initial view
density_map_plot = dx.density_map(
    outages_table,
    lat="Lat",
    lon="Lon",
    map_style="carto-darkmatter",
    zoom=9,
    center={"lat": 44.97, "lon": -93.17}
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.density_map
```
