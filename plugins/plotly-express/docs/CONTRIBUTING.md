# Contibuting to our plotting docs

## Goal

Each plot type should have a link to it's own page from the main README.md with:

- Exposition on what the plot type is and when to use it
- A basic and minimal example
- An exhaustive set of common use cases with examples covering all the parameters of each plot
- An autodoc reference section with all the parameters and their types

We should have a seperate section covering shared concepts such as:

- Plot by
- Layering plots
- Subplots
- Multiple axes
- Titles, labels, and legends

## Examples

Examples should be contextually relevant to their plot type and use a ticking data generator that would make sense to that plot type. Each example should be a complete and runnable code snippet that can be copy-pasted, and not require previous snippets to run. Global variables should be named appropriately, and be globally unique. Ex. `bubble_plot`, `scatter_plot`, `scatter_plot_by_color`

## Autodoc

Each plot type should have an autodoc reference section at the bottom of the page that lists all the parameters and their types. This will be generated from the source code and inserted when docs are built, and not manually maintained.

````md
```{eval-rst}
.. autodoc(deephaven.plot.express.scatter)
```
````
