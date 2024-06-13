# Treemap Plot

Treemap plots are a data visualization technique used to represent hierarchical data in a space-filling manner. They display data as nested rectangles or squares, where the size and color of each rectangle represent the values or categories within the hierarchy. Developers can create treemaps to provide users with an efficient and visually intuitive way to explore hierarchical data structures and understand relationships between categories and subcategories, making them a valuable tool for various applications that involve hierarchical data presentation, analysis, and exploration.

Treemap plots are useful for:

1. **Hierarchical Data Visualization**: Treemap plots are valuable for visualizing hierarchical data structures with multiple levels of nested categories or relationships. Developers can use treemaps to represent data in a space-efficient manner, making them suitable for applications where data has complex hierarchical organizations.
2. **Hierarchical Data Comparison**: Treemaps can be used to compare data within hierarchical structures, allowing users to understand the distribution of categories and their relative sizes. Developers can implement features that enable users to compare data across multiple hierarchies or time periods.
3. **Data Summarization**: Treemaps are effective for summarizing large amounts of hierarchical data into a compact, visual format. Developers can use treemaps to provide users with an overview of hierarchical data, and users can drill down into specific categories for more detailed information.

## Examples

### A basic treemap plot

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

# create a basic treemap plot by specifying the categories, the values of interest, and a single root 'world'
continent_population = dx.treemap(gapminder_recent.update("world = `world`"), names="continent", values="pop", parents="world")
```