# Funnel Area Plot

A funnel area plot is a data visualization that is typically used to represent data where values progressively decrease or "funnel" through stages or categories. It takes the form of a series of horizontally aligned trapezoids or polygons, with each stage's area proportional to the quantity it represents, making it a useful tool for visualizing the attrition or progression of data through a sequential process.

Funnel area plots differ from funnel plots in that they display the percentage of data points that belong to each category, while funnel plots display the absolute count of data points in each category. Funnel area plots also count each data point as belonging to _exactly one_ category and display the categories as mutually exclusive. On the other hand, funnel plots count each data point as belonging to _at least one_ category, so the categories are represented as subsets of each other rather than mutually exclusive.

#### When are funnel area plots appropriate?

Funnel area plots are appropriate when the data contain a categorical variable where the frequencies of each category can be computed, and the categories can be ordered. Additionally, funnel plots assume a particular relationship between levels of the categorical variable, where each category is a proper subset of the previous category. If the data contain an unordered categorical variable, or the categories are better conceptualized as parts of a whole, consider a pie plot instead of a funnel area plot.

#### What are funnel area plots useful for?

- **Sequential Data**: When visualizing data that follows a sequential or staged progression.
- **Progression Analysis**: For analyzing attrition, conversion rates, or transitions between stages.
- **Efficiency Evaluation**: To assess the efficiency and effectiveness of a process or workflow.

## Examples

### A basic funnel plot

Visualize the trend in consecutive stages of a categorical variable.

```python order=marking_trend_percentage,marketing
import deephaven.plot.express as dx
marketing = dx.data.marketing()  # import the ticking marketing dataset

# create a basic funnel plot by specifying column names for `names` and `values`
marketing_trend_percentage = dx.funnel_area(marketing, names="Stage", values="Count")
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.funnel_area
```