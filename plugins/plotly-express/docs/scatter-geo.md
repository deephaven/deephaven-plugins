# Scatter Geo

A scatter geo plot is a geographic visualization that displays individual data points on a map using latitude and longitude coordinates or locations. The points are ideal for visualizing the distribution of data across geographic areas.

Scatter geo plots are appropriate when the dataset contains geographic coordinates (latitude and longitude) or locations that represent individual points on a map. `scatter_geo` visualizes data using a basic map projection, without a high degree of detail. For richer tile maps, use [`scatter_map`](./scatter-map.md). For visualizing connections between locations, consider using [`line_geo`](./line-geo.md).

## What are scatter geo plots useful for?

- **Geographic distribution**: They are excellent for showing the distribution of individual geographic locations on a map.
- **Simple geographic context**: Scatter geo plots provide a clear and straightforward way to visualize geographic data that does not require detailed map features.

## Examples

### A basic scatter geo plot

Visualize geographic points by passing longitude and latitude column names to the `lon` and `lat` arguments. It's recommended to set `fitbounds` to `"locations"`, which automatically adjusts the map view to include all points, unless a broader view is desired. Click and drag on the resulting map to pan and zoom.

```python order=scatter_geo_plot,flights_table
import deephaven.plot.express as dx

# Load the flights dataset
# The speed_multiplier parameter speeds up the flight
flights_table = dx.data.flights(speed_multiplier=50)

# Plot a single flight path
# color is set for visibility
# fitbounds is set for better initial view
single_flight = flights_table.where("FlightId = `SAL101`")
scatter_geo_plot = dx.scatter_geo(
    single_flight,
    lat="Lat",
    lon="Lon",
    color_discrete_sequence="red",
    fitbounds="locations",
)
```

### Color by group

Denote different categories by using the color of the points as group indicators by passing the grouping column name to the `by` argument. Set the color of each group using the `color_discrete_sequence` argument.

```python order=scatter_geo_plot,flights_table
import deephaven.plot.express as dx

# Load the flights dataset
# The speed_multiplier parameter speeds up the flight
flights_table = dx.data.flights(speed_multiplier=50)

# Color each flight path differently
# fitbounds is set for better view
scatter_geo_plot = dx.scatter_geo(
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

```python order=scatter_geo_plot,flights_table
import deephaven.plot.express as dx

# Load the flights dataset
# The speed_multiplier parameter speeds up the flight
flights_table = dx.data.flights(speed_multiplier=50)

# Use an orthographic (globe) projection and set scope to North America
# center is set for better initial view
scatter_geo_plot = dx.scatter_geo(
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
.. dhautofunction:: deephaven.plot.express.scatter_geo
```
