# Sunburst Plot

Sunburst plots are a data visualization technique used to represent hierarchical data with a radial layout. They display data as nested rings or sectors, where each level of the hierarchy is represented by a ring, and each category or subcategory is shown as a sector within the ring. Sunburst plots provide an effective way to visualize hierarchical data structures and the relationships between different levels and categories within the data, making them a valuable tool for understanding complex data hierarchies.

Sunburst plots are appropriate when the data have a hierarchical structure. Each level of the hierarchy consists of a categorical variable and an associated numeric variable with a value for each unique category.

## What are sunburst plots useful for?

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

### A sunburst plot with `path`

Instead of manually aggregating and passing in `names` and `parents`, use the `path` argument to specify the hierarchy of the data. The first column is the root category, and the last column is the leaf category. The values are automatically summed up.

```python order=sunburst_path_plot,gapminder
import deephaven.plot.express as dx

gapminder = dx.data.gapminder().update_view("World = `World`")

sunburst_path_plot = dx.sunburst(gapminder, path=["World", "Continent", "Country"], values="Pop")
```

# A nested sunburst plot with branch values

By default, the `branchvalues` argument is set to `"remainder"`.
Keep the default if the values column should be added to the sum of its children to get the value for a node.
If the values column is equal to the sum of its children, set `branchvalues` to `"total"`.

```python order=sunburst_nested,merged_gapminder,world,continents,countries
import deephaven.plot.express as dx
from deephaven import merge

data = dx.data.gapminder(ticking=False)

countries = data.last_by("Country").view(["Name=Country", "Pop", "Parent=Continent"])

# Sum country population by continent
continents = (
    countries.drop_columns("Name")
    .sum_by("Parent")
    .view(["Name=Parent", "Pop", "Parent=`World`"])
)

# Sum continent population
world = (
    continents.view("Pop").sum_by().view(["Name=`World`", "Pop", "Parent=(String)null"])
)

merged_gapminder = merge([world, continents, countries])

# Since the values column is equal to the sum of it's children, set branchvalues to "total"
sunburst_nested = dx.sunburst(
    merged_gapminder, names="Name", values="Pop", parents="Parent", branchvalues="total"
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.sunburst
```
