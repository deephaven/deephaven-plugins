# Sunburst Plot

Sunburst plots are a data visualization technique used to represent hierarchical data with a radial layout. They display data as nested rings or sectors, where each level of the hierarchy is represented by a ring, and each category or subcategory is shown as a sector within the ring. Sunburst plots provide an effective way to visualize hierarchical data structures and the relationships between different levels and categories within the data, making them a valuable tool for understanding complex data hierarchies.

Sunburst plots are appropriate when the data have a hierarchical structure. Each level of the hierarchy consists of a categorical variable and an associated numeric variable with a value for each unique category.

### What are sunburst plots useful for?

- **Hierarchical Data Visualization**: Sunburst plots are valuable for visualizing hierarchical data structures, making them suitable for applications where data has multiple levels of nested categories or relationships. Developers can use sunburst plots to represent data in a manner that clearly illustrates the hierarchical organization of information.
- **Tree Maps Replacement**: Sunburst plots can be an alternative to tree maps for visualizing hierarchical data. Developers can use sunburst plots to present hierarchical data in a space-efficient and visually appealing manner. This can be particularly beneficial in applications where screen real estate is limited, and users need to view hierarchical data with an interactive and intuitive interface.
- **Drill-Down Data Exploration**: Developers can implement sunburst plots for drill-down data exploration, allowing users to interactively explore and delve deeper into hierarchical data by clicking on sectors to reveal lower-level categories or information. This use case is valuable in applications that require detailed hierarchical data analysis.

## Examples

### A basic sunburst plot

Visualize a hierarchical dataset as concentric circles, with the size of each group decreasing in a counter-clockwise fashion. Use the `names` argument to specify the column name for each group's labels, the `values` argument to specify the column name for each group's values, and the `parents` column to specify the root category of the chart.

```python order=sunburst_plot,gapminder_recent,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder()

# create table of only the most recent year of data, compute total population for each continent
gapminder_recent = (
    gapminder
    .last_by("Country")
    .view(["Continent", "Pop"])
    .sum_by("Continent")
    .update("World = `World`")
)

sunburst_plot = dx.sunburst(gapminder_recent, names="Continent", values="Pop", parents="World")
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.sunburst
```