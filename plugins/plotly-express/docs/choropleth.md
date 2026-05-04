# Choropleth

A choropleth plot is a geographic visualization that shades regions of a map according to a data value. It uses a basic geographic projection without map tiles, making it ideal for thematic maps where the focus is on regional values rather than detailed geographic context.

Choropleth plots are appropriate when the dataset contains values associated with named geographic regions (countries, states, custom polygons defined by GeoJSON). For tile-based maps with zoom and pan over detailed map imagery, use [`choropleth_map`](./choropleth-map.md). For point-based geographic visualizations, see [`scatter_geo`](./scatter-geo.md).

## What are choropleth plots useful for?

- **Regional comparisons**: They are excellent for comparing a single quantitative value across many geographic regions at a glance.
- **Thematic mapping**: Choropleth plots provide a clear visual encoding for variables like population, election results, or any per-region statistic.
- **Live, region-level data**: Because the figure updates as the underlying Deephaven table ticks, choropleth plots can reflect changing aggregate values per region in real time.

## Examples

### A basic choropleth using built-in country names

When the `locations` column contains values that match a built-in `locationmode` (`'ISO-3'`, `'USA-states'`, or `'country names'`), no GeoJSON is needed.

```python order=choropleth_plot,gapminder_table
import deephaven.plot.express as dx

# Load the gapminder dataset (ticking by default)
gapminder_table = dx.data.gapminder()

# Color each country by life expectancy using the built-in country geometry
choropleth_plot = dx.choropleth(
    gapminder_table,
    locations="Country",
    locationmode="country names",
    color="LifeExp",
    projection="natural earth",
)
```

### Choropleth with custom GeoJSON

Pass GeoJSON directly to render arbitrary regions. Use `featureidkey` to point at the property in the GeoJSON that matches the values in the `locations` column.

```python order=choropleth_plot,election_table
import deephaven.plot.express as dx
from plotly import express as px

# Load the election dataset (ticking by default)
election_table = dx.data.election()

# plotly ships matching geojson for the election dataset
geojson = px.data.election_geojson()

# Color districts by votes for one candidate; updates live as the table ticks
choropleth_plot = dx.choropleth(
    election_table,
    locations="District",
    geojson=geojson,
    featureidkey="properties.district",
    color="Joly",
    fitbounds="locations",
)
```

### Customize the color scale

Change the color scale using the `color_continuous_scale` argument and constrain it with `range_color`.

```python order=choropleth_plot,gapminder_table
import deephaven.plot.express as dx

gapminder_table = dx.data.gapminder()

choropleth_plot = dx.choropleth(
    gapminder_table,
    locations="Country",
    locationmode="country names",
    color="LifeExp",
    color_continuous_scale=["yellow", "orange", "red"],
    range_color=[40, 85],
)
```

### Change projection and scope

Use the `projection` argument to switch the map projection (for example `"orthographic"` for a globe view), and `scope` to focus on a region such as `"europe"` or `"north america"`.

```python order=choropleth_plot,gapminder_table
import deephaven.plot.express as dx

gapminder_table = dx.data.gapminder()

choropleth_plot = dx.choropleth(
    gapminder_table,
    locations="Country",
    locationmode="country names",
    color="LifeExp",
    projection="orthographic",
    scope="world",
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.choropleth
```
