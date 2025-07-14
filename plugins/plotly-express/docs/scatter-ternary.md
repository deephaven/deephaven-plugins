# Ternary Scatter Plot

Ternary scatter plots are a data visualization method used to represent data within a triangular coordinate system. They display individual data points as markers or dots in the triangular space, offering a means to visualize the distribution, relationships, or patterns in data that consist of three mutually exclusive components. Ternary scatter plots are particularly useful when analyzing compositional data or data involving proportions that sum to a constant total.

Ternary scatter plots are appropriate when the data contain three interrelated mutually exclusive categories whose relationships can be quantified with a continuous variable.

## What are ternary scatter plots useful for?

- **Compositional data analysis**: Ternary scatter plots are useful for analyzing data where proportions of three components add up to a constant total. They help visualize the distribution of these components and their relationships within the composition.
- **Exploring multivariate data**: They can be applied in multivariate data analysis to visualize relationships, patterns, and trends among three variables or components, particularly when these components are interrelated.
- **Optimization studies**: Ternary scatter plots aid in optimization studies to understand how adjustments in the proportions of three components impact the overall composition, making them valuable in informed decision-making processes.

## Examples

### A basic ternary scatter plot

Visualize a ternary dataset by passing column names to each of the `a`, `b`, and `c` arguments.

```python order=ternary_scatter_plot,election
import deephaven.plot.express as dx
election = dx.data.election()

# create a ternary scatter plot by specifying the columns for the three points of the triangle
ternary_scatter_plot = dx.scatter_ternary(election, a="Joly", b="Coderre", c="Bergeron")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.scatter_ternary
```
