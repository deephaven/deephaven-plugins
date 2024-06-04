---
title: Icicle Plot
---

Icicle plots, a hierarchical data visualization technique, are used to represent structured data with nested categories or levels. They are characterized by a rectangular layout where each column represents a level of the hierarchy, and the width of each subcolumn is proportional to the quantity of data within its respective category, facilitating the visualization of data structure and distribution.

Icicle plots are useful for:

1. **Hierarchical Data Representation**: Icicle charts are particularly useful for visualizing hierarchical data, such as organizational structures, file directories, or nested categorical data. They provide a clear and intuitive way to represent multiple levels of hierarchy in a single view.
2. **Space-efficient Representation**: By using a compact rectangular layout, icicle charts make efficient use of space. This allows for the display of large and complex hierarchies without requiring extensive scrolling or panning, making it easier to analyze and interpret the data at a glance.
3. **Interactive Exploration**: Icicle charts often come with interactive features that allow users to drill down into specific branches of the hierarchy. This interactivity enables detailed exploration and analysis of sub-categories, aiding in uncovering insights and patterns within the data.
4. **Comparative Analysis**: The consistent and proportional layout of icicle charts makes them effective for comparing the size and structure of different branches within the hierarchy. Users can easily identify and compare the relative importance or size of various categories, facilitating better decision-making and resource allocation.

## Examples

## API Reference
```{eval-rst}
.. autofunction:: deephaven.plot.express.icicle
```