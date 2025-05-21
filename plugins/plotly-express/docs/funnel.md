# Funnel Plot

A funnel plot is a data visualization that represents a process with various stages and allows multiple stacked categories, showing the quantitative values or counts at each stage in a funnel shape. It is a useful tool for tracking the progression or attrition of data through different stages, providing a visual overview of data distribution within the process. The data must be ordered by the response variable, or the "funnel" shape will not be guaranteed.

Funnel plots differ from [funnel area plots](funnel-area.md) in that they display the absolute count of data points in each category, while funnel area plots display the percentage of data points that belong to each category. Funnel plots also count each data point as belonging to _at least one_ category, so the categories are represented as subsets of each other. On the other hand, funnel area plots also count each data point as belonging to _exactly one_ category, and display the categories as mutually exclusive.

Funnel plots are appropriate when the data contain a categorical variable where the frequencies of each category can be computed, and the categories can be ordered. Additionally, funnel plots assume a particular relationship between levels of the categorical variable, where each category is a proper subset of the previous category. If the data contain an unordered categorical variable, or the categories are better conceptualized as parts of a whole, consider a pie plot instead of a funnel plot.

## What are funnel plots useful for?

- **Visualizing sequential data**: Data that are staged or sequential in some way are often visualized with funnel plots, yielding insight on the absolute changes between each stage.
- **Comparing categories**: Funnel plots can be broken down into categories to produce insights into the distribution of data at each stage within a process. Then
- **Evaluating efficiency**: Assessing the efficiency and effectiveness of a process or workflow, particularly when evaluating the attrition or conversion at each stage, is easy with funnel plots.

## Examples

### A basic funnel plot

Visualize the trend in consecutive stages of a categorical variable by passing column names to the `x` and `y` arguments.

```python order=funnel_plot,marketing
import deephaven.plot.express as dx
marketing = dx.data.marketing()

# `Count` is the frequency/value column, and `Stage` is the category column
funnel_plot = dx.funnel(marketing, x="Count", y="Stage")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.funnel
```
