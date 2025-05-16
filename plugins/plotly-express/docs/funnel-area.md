# Funnel Area Plot

A funnel area plot is a data visualization that is typically used to represent data where values progressively decrease or "funnel" through stages or categories. It takes the form of a series of horizontally aligned trapezoids or polygons, with each stage's area proportional to the quantity it represents, making it a useful tool for visualizing the attrition or progression of data through a sequential process. The data must be ordered by the response variable, or the "funnel" shape will not be guaranteed.

Funnel area plots differ from [funnel plots](funnel.md) in that they display the percentage of data points that belong to each category, while funnel plots display the absolute count of data points in each category. Funnel area plots also count each data point as belonging to _exactly one_ category and display the categories as mutually exclusive. On the other hand, funnel plots count each data point as belonging to _at least one_ category, so the categories are represented as subsets of each other rather than mutually exclusive.

Funnel area plots are appropriate when the data contain a categorical variable where the frequencies of each category can be computed, and the categories can be ordered. Additionally, funnel plots assume a particular relationship between levels of the categorical variable, where each category is a proper subset of the previous category. If the data contain an unordered categorical variable, or the categories are better conceptualized as parts of a whole, consider a pie plot instead of a funnel area plot.

## What are funnel area plots useful for?

- **Visualizing sequential data**: Data that are staged or sequential in some way are often visualized with funnel area plots, yielding insight on the rate of change from one stage to the next.
- **Analyzing data progression**: Funnel area plots may be used for analyzing attrition, conversion rates, or transitions between stages.
- **Evaluating efficiency**: Assessing the efficiency and effectiveness of a process or workflow is easy with funnel area plots.

## Examples

### A basic funnel plot

Visualize the trend in consecutive stages of a categorical variable by passing column names to the `names` and `values` arguments.

```python order=funnel_area_plot,marketing
import deephaven.plot.express as dx
marketing = dx.data.marketing()

# `Count` is the frequency/value column, and `Stage` is the category column
funnel_area_plot = dx.funnel_area(marketing, names="Stage", values="Count")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.funnel_area
```
