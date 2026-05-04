# Choropleth Map

A choropleth map plot is a geographic visualization that shades regions of a tile-based map according to a data value. It uses MapLibre map tiles, providing rich geographic context with zoom and pan, making it ideal for thematic maps that need detailed underlying imagery.

Choropleth map plots are appropriate when the dataset contains values associated with regions defined by GeoJSON. For a simpler tile-free projection, use [`choropleth`](./choropleth.md). For point-based map visualizations, see [`scatter_map`](./scatter-map.md).

## What are choropleth map plots useful for?

- **Regional comparisons with map context**: They are excellent for comparing a single quantitative value across geographic regions while keeping detailed map imagery underneath.
- **Interactive exploration**: Users can zoom and pan to inspect specific regions in detail.
- **Live, region-level data**: Because the figure updates as the underlying Deephaven table ticks, choropleth map plots can reflect changing aggregate values per region in real time.

## Examples

### A basic choropleth map with custom GeoJSON

`choropleth_map` requires GeoJSON to define the regions. Use `featureidkey` to point at the property in the GeoJSON that matches the values in the `locations` column.

```python order=choropleth_map_plot,election_table
import deephaven.plot.express as dx
from plotly import express as px

# Load the election dataset (ticking by default)
election_table = dx.data.election()

# plotly ships matching geojson for the election dataset
geojson = px.data.election_geojson()

# Color districts by votes for one candidate; updates live as the table ticks
choropleth_map_plot = dx.choropleth_map(
    election_table,
    locations="District",
    geojson=geojson,
    featureidkey="properties.district",
    color="Joly",
    zoom=9,
    center={"lat": 45.55, "lon": -73.7},
)
```

### Customize the color scale

Change the color scale using the `color_continuous_scale` argument and constrain it with `range_color`.

```python order=choropleth_map_plot,election_table
import deephaven.plot.express as dx
from plotly import express as px

election_table = dx.data.election()
geojson = px.data.election_geojson()

choropleth_map_plot = dx.choropleth_map(
    election_table,
    locations="District",
    geojson=geojson,
    featureidkey="properties.district",
    color="Joly",
    color_continuous_scale=["yellow", "orange", "red"],
    zoom=9,
    center={"lat": 45.55, "lon": -73.7},
)
```

### Adjust opacity to show map detail

Lower the `opacity` so the underlying map tiles remain visible through the colored regions.

```python order=choropleth_map_plot,election_table
import deephaven.plot.express as dx
from plotly import express as px

election_table = dx.data.election()
geojson = px.data.election_geojson()

choropleth_map_plot = dx.choropleth_map(
    election_table,
    locations="District",
    geojson=geojson,
    featureidkey="properties.district",
    color="Joly",
    opacity=0.5,
    zoom=9,
    center={"lat": 45.55, "lon": -73.7},
)
```

### Change map style

Use different base map styles with the `map_style` argument. The default style depends on the theme.

```python order=choropleth_map_plot,election_table
import deephaven.plot.express as dx
from plotly import express as px

election_table = dx.data.election()
geojson = px.data.election_geojson()

choropleth_map_plot = dx.choropleth_map(
    election_table,
    locations="District",
    geojson=geojson,
    featureidkey="properties.district",
    color="Joly",
    map_style="open-street-map",
    zoom=9,
    center={"lat": 45.55, "lon": -73.7},
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.choropleth_map
```
