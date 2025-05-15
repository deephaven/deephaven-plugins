# Ternary Line Plot

Ternary line plots are a data visualization technique that represents data in a triangular coordinate system. They display data as connected line segments within the triangular space, making them useful for visualizing relationships, trends, and compositional data that sum to a constant total. Ternary line plots are particularly valuable when dealing with data involving three mutually exclusive components or proportions.

Ternary line plots are appropriate when the data contain three interrelated mutually exclusive categories whose relationships can be quantified with a continuous variable. Further, ternary line plots are preferable to [ternary scatter plots](scatter-ternary.md) when the explanatory variables are ordered.

## What are ternary line plots useful for?

- **Compositional data representation**: Ternary line plots are suitable for representing compositional data where the total proportion remains constant, allowing for the visualization of how components change relative to one another.
- **Multivariate data analysis**: They are useful in multivariate data analysis to visualize relationships and trends among three variables or components that are interrelated.
- **Optimization studies**: They can be applied in optimization studies to understand how adjustments in the proportions of three components impact the overall composition, aiding in informed decision-making.

## Examples

### A basic ternary line plot

Visualize a ternary dataset by passing column names to each of the `a`, `b`, and `c` arguments.

```python order=ternary_line_plot,election
import deephaven.plot.express as dx
election = dx.data.election()

ternary_line_plot = dx.line_ternary(election, a="Joly", b="Coderre", c="Bergeron")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.line_ternary
```
