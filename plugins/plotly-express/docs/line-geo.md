# Line Geo

A line geo plot is a geographic visualization that connects data points with lines on a map using latitude and longitude coordinates or locations. The lines are ideal for visualizing relationships between geographic locations such as paths or routes.

Line geo plots are appropriate when the dataset contains geographic coordinates (latitude and longitude) or locations that connect across geographic areas. `line_geo` visualizes data using a basic map projection, without a high degree of detail. For richer tile maps, use [`line_map`](./line-map.md). For visualizing values at individual locations, consider using [`scatter_geo`](./scatter-geo.md).

## What are line geo plots useful for?

- **Geographic relationships**: They are excellent for showing connections or relationships between different geographic locations, such as routes or paths.
- **Simple geographic context**: Line geo plots provide a clear and straightforward way to visualize geographic data that does not require detailed map features.
- **Sequential geographic data**: Geographic line plots specialize in showing how data changes across connected geographic points over time or other ordered dimensions.

## Examples

### A basic line geo plot

Visualize geographic paths by passing longitude and latitude column names to the `lon` and `lat` arguments. It's recommended to set `fitbounds` to `"locations"`, which automatically adjusts the map view to include all points, unless a broader view is desired. Click and drag on the resulting map to pan and zoom.

```python order=line_geo_plot,flights_table
import deephaven.plot.express as dx

# Load the flights dataset
# The speed_multiplier parameter speeds up the flight
flights_table = dx.data.flights(speed_multiplier=50)

# Plot a single flight path
# color is set for visibility
# fitbounds is set for better initial view
single_flight = flights_table.where("FlightId = `SAL101`")
line_geo_plot = dx.line_geo(
    single_flight,
    lat="Lat",
    lon="Lon",
    color_discrete_sequence="red",
    fitbounds="locations",
)
```

### Color by group

Denote different routes by using the color of the lines as group indicators by passing the grouping column name to the `by` argument. Set the color of each group using the `color_discrete_sequence` argument.

```python order=line_geo_plot,flights_table
import deephaven.plot.express as dx

# Load the flights dataset
# The speed_multiplier parameter speeds up the flight
flights_table = dx.data.flights(speed_multiplier=50)

# Color each flight path differently
# fitbounds is set for better view
line_geo_plot = dx.line_geo(
    flights_table,
    lat="Lat",
    lon="Lon",
    by="FlightId",
    color_discrete_sequence=["red", "blue", "green", "orange"],
    fitbounds="locations",
)
```

### Use different projections and scopes

Change the map projection using the `projection` argument. Options include 'natural earth', 'mercator', and 'orthographic'. Adjust the geographic scope using the `scope` argument to focus on specific regions such as 'world', 'usa', 'europe', or 'north america'. Set the `center` argument for a better initial view, especially when scoping to a specific region.

```python order=line_geo_plot,flights_table
import deephaven.plot.express as dx

# Load the flights dataset
# The speed_multiplier parameter speeds up the flight
flights_table = dx.data.flights(speed_multiplier=50)

# Use an orthographic (globe) projection and set scope to North America
# center is set for better initial view
line_geo_plot = dx.line_geo(
    flights_table,
    lat="Lat",
    lon="Lon",
    by="FlightId",
    projection="orthographic",
    scope="north america",
    center={"lat": dx.data.FLIGHT_LAT, "lon": dx.data.FLIGHT_LON}
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.line_geo
```
