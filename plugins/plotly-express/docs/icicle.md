# Icicle Plot

Icicle plots, a hierarchical data visualization technique, are used to represent structured data with nested categories or levels. They are characterized by a rectangular layout where each column represents a level of the hierarchy, and the width of each subcolumn is proportional to the quantity of data within its respective category, facilitating the visualization of data structure and distribution.

#### When are icicle plots appropriate?

Icicle plots are appropriate when the data have a hierarchical structure. Each level of the hierarchy consists of a categorical variable and an associated numeric variable with a value for each unique category.

#### What are icicle plots useful for?

- **Hierarchical Data Representation**: Icicle charts are particularly useful for visualizing hierarchical data, such as organizational structures, file directories, or nested categorical data. They provide a clear and intuitive way to represent multiple levels of hierarchy in a single view.
- **Space-efficient Representation**: By using a compact rectangular layout, icicle charts make efficient use of space. This allows for the display of large and complex hierarchies without requiring extensive scrolling or panning, making it easier to analyze and interpret the data at a glance.
- **Interactive Exploration**: Icicle charts often come with interactive features that allow users to drill down into specific branches of the hierarchy. This interactivity enables detailed exploration and analysis of sub-categories, aiding in uncovering insights and patterns within the data.
- **Comparative Analysis**: The consistent and proportional layout of icicle charts makes them effective for comparing the size and structure of different branches within the hierarchy. Users can easily identify and compare the relative importance or size of various categories, facilitating better decision-making and resource allocation.

## Examples

### A basic icicle plot

Visualize a hierarchical dataset as nested rectangles, with categories displayed left-to-right, and the size of each category displayed top-to-bottom.

```python order=continent_population,gapminder_recent,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import a ticking version of the Gapminder dataset

# create table of only the most recent year of data, compute total population for each continent
gapminder_recent = (
    gapminder
    .last_by("country")
    .view(["continent", "pop"])
    .sum_by("continent")
)

# create a basic icicle plot by specifying the categories, the values of interest, and a single root 'world'
continent_population = dx.icicle(gapminder_recent.update("world = `world`"), names="continent", values="pop", parents="world")
```

## API Reference
```{eval-rst}
.. autofunction:: deephaven.plot.express.icicle
```