# Treemap Plot

Treemap plots are a data visualization technique used to represent hierarchical data in a space-filling manner. They display data as nested rectangles or squares, where the size and color of each rectangle represent the values or categories within the hierarchy. Developers can create treemaps to provide users with an efficient and visually intuitive way to explore hierarchical data structures and understand relationships between categories and subcategories, making them a valuable tool for various applications that involve hierarchical data presentation, analysis, and exploration.

Treemap plots are appropriate when the data have a hierarchical structure. Each level of the hierarchy consists of a categorical variable and an associated numeric variable with a value for each unique category.

## What are treemap plots useful for?

- **Visualizing hierarchical data**: Treemap plots are valuable for visualizing hierarchical data structures with multiple levels of nested categories or relationships. Developers can use treemaps to represent data in a space-efficient manner, making them suitable for applications where data has complex hierarchical organizations.
- **Hierarchical data comparison**: Treemaps can be used to compare data within hierarchical structures, allowing users to understand the distribution of categories and their relative sizes. Developers can implement features that enable users to compare data across multiple hierarchies or time periods.
- **Data summarization**: Treemaps are effective for summarizing large amounts of hierarchical data into a compact, visual format. Developers can use treemaps to provide users with an overview of hierarchical data, and users can drill down into specific categories for more detailed information.

## Examples

### A basic treemap plot

Visualize a hierarchical dataset as nested rectangles, with the size of each rectangle corresponding to a value for a particular group. Use the `names` argument to specify the column name for each group's labels, the `values` argument to specify the column name for each group's values, and the `parents` column to specify the root category of the chart.

```python order=treemap_plot,gapminder_recent,gapminder
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

treemap_plot = dx.treemap(gapminder_recent, names="Continent", values="Pop", parents="World")
```

### A treemap plot with `path`

Instead of manually aggregating and passing in `names` and `parents`, use the `path` argument to specify the hierarchy of the data. The first column is the root category, and the last column is the leaf category. The values are automatically summed up.

```python order=treemap_path_plot,gapminder
import deephaven.plot.express as dx

gapminder = dx.data.gapminder().update_view("World = `World`")

treemap_path_plot = dx.treemap(gapminder, path=["World", "Continent", "Country"], values="Pop")
```

# A nested treemap plot with branch values

By default, the `branchvalues` argument is set to `"remainder"`.
Keep the default if the values column should be added to the sum of its children to get the value for a node.
If the values column is equal to the sum of its children, set `branchvalues` to `"total"`.

```python order=treemap_nested,merged_gapminder,world,continents,countries,data
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
treemap_nested = dx.treemap(
    merged_gapminder, names="Name", values="Pop", parents="Parent", branchvalues="total"
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.treemap
```
