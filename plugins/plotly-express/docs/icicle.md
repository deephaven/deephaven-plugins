# Icicle Plot

Icicle plots, a hierarchical data visualization technique, are used to represent structured data with nested categories or levels. They are characterized by a rectangular layout where each column represents a level of the hierarchy, and the width of each subcolumn is proportional to the quantity of data within its respective category, facilitating the visualization of data structure and distribution.

Icicle plots are appropriate when the data have a hierarchical structure. Each level of the hierarchy consists of a categorical variable and an associated numeric variable with a value for each unique category.

## What are icicle plots useful for?

- **Representing hierarchical data**: Icicle charts are particularly useful for visualizing hierarchical data, such as organizational structures, file directories, or nested categorical data. They provide a clear and intuitive way to represent multiple levels of hierarchy in a single view.
- **Space-efficient plotting**: By using a compact rectangular layout, icicle charts make efficient use of space. This allows for the display of large and complex hierarchies without requiring extensive scrolling or panning, making it easier to analyze and interpret the data at a glance.
- **Comparative analysis**: The consistent and proportional layout of icicle charts makes them effective for comparing the size and structure of different branches within the hierarchy. Users can easily identify and compare the relative importance or size of various categories, facilitating better decision-making and resource allocation.

## Examples

### A basic icicle plot

Visualize a hierarchical dataset as nested rectangles, with categories displayed left-to-right, and the size of each category displayed top-to-bottom. Use the `names` argument to specify the column name for each group's labels, the `values` argument to specify the column name for each group's values, and the `parents` column to specify the root category of the chart.

```python order=icicle_plot,gapminder_recent,gapminder
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

icicle_plot = dx.icicle(gapminder_recent, names="Continent", values="Pop", parents="World")
```

### An icicle plot with `path`

Instead of manually aggregating and passing in `names` and `parents`, use the `path` argument to specify the hierarchy of the data. The first column is the root category, and the last column is the leaf category. The values are automatically summed up.

```python order=icicle_path_plot,gapminder
import deephaven.plot.express as dx

gapminder = dx.data.gapminder().update_view("World = `World`")

icicle_path_plot = dx.icicle(gapminder, path=["World", "Continent", "Country"], values="Pop")
```

# A nested icicle plot with branch values

By default, the `branchvalues` argument is set to `"remainder"`.
Keep the default if the values column should be added to the sum of its children to get the value for a node.
If the values column is equal to the sum of its children, set `branchvalues` to `"total"`.

```python order=icicle_nested,merged_gapminder,world,continents,countries
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
icicle_nested = dx.icicle(
    merged_gapminder, names="Name", values="Pop", parents="Parent", branchvalues="total"
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.icicle
```
