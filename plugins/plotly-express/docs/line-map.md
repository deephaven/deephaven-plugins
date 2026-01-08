# Line Map

A line map plot is a geographic visualization that connects data points with lines on a map using latitude and longitude coordinates or locations. The lines are ideal for visualizing relationships between geographic locations such as paths or routes.

Line map plots are appropriate when the dataset contains geographic coordinates (latitude and longitude) or locations that connect across geographic areas. `line_map` visualizes data using detailed map tiles. For simpler projection maps, use [`line_geo`](./line-geo.md). For visualizing values at individual locations, consider using [`scatter_map`](./scatter-map.md).

## What are line map plots useful for?

- **Geographic relationships**: They are excellent for showing connections or relationships between different geographic locations, such as routes or paths.
- **Detailed geographic context**: Line map plots provide a rich and detailed way to visualize geographic data with map tile features.
- **Sequential geographic data**: Geographic line plots specialize in showing how data changes across connected geographic points over time or other ordered dimensions.

## Examples

### A basic line map plot

Visualize geographic paths by passing longitude and latitude column names to the `lon` and `lat` arguments. It's recommended to set the initial `zoom` level and `center` coordinates for better visualization based on the data. Click and drag on the resulting map to pan and zoom.

```python order=line_map_plot,flights_table
import deephaven.plot.express as dx
from deephaven.plot.express import data as dx_data

# Load the flights dataset
# The speed_multiplier parameter speeds up the flight
flights_table = dx_data.flights(speed_multiplier=50)

# Plot a single flight path
# Color is set for visibility
# Zoom and center are set for better initial view
single_flight = flights_table.where("FlightId = `SAL101`")
line_map_plot = dx.line_map(
    single_flight,
    lat="Lat",
    lon="Lon",
    color_discrete_sequence="red",
    zoom=3,
    center={"lat": 50, "lon": -100}
)
```

### Color by group

Denote different routes by using the color of the lines as group indicators by passing the grouping column name to the `by` argument. Set the color of each group using the `color_discrete_sequence` argument.

```python order=line_map_plot,flights_table
import deephaven.plot.express as dx
from deephaven.plot.express import data as dx_data

# Load the flights dataset
# The speed_multiplier parameter speeds up the flight
flights_table = dx_data.flights(speed_multiplier=50)

# Color each flight path differently
# Zoom and center are set for better initial view
line_map_plot = dx.line_map(
    flights_table,
    lat="Lat",
    lon="Lon",
    by="FlightId",
    color_discrete_sequence=["red", "blue", "green", "orange"],
    zoom=3,
    center={"lat": 50, "lon": -100}
)
```

### Customize map style

Change the appearance of the base map using the `map_style` argument. Recommended options are 'open-street-map', 'carto-positron', and 'carto-darkmatter'.

```python order=line_map_plot,flights_table
import deephaven.plot.express as dx
from deephaven.plot.express import data as dx_data

# Load the flights dataset
# The speed_multiplier parameter speeds up the flight
flights_table = dx_data.flights(speed_multiplier=50)

# Use a dark map style for contrast
# Zoom and center are set for better initial view
line_map_plot = dx.line_map(
    flights_table,
    lat="Lat",
    lon="Lon",
    by="FlightId",
    zoom=3,
    center={"lat": 50, "lon": -100},
    map_style="carto-darkmatter"
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.line_map
```
