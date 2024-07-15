# Funnel Plot

A funnel plot is a data visualization that represents a process with various stages and allows multiple stacked categories, showing the quantitative values or counts at each stage in a funnel shape. It is a useful tool for tracking the progression or attrition of data through different stages, providing a visual overview of data distribution within the process.

Funnel plots differ from funnel area plots in that they display the absolute count of data points in each category, while funnel area plots display the percentage of data points that belong to each category. Funnel plots also count each data point as belonging to _at least one_ category, so the categories are represented as subsets of each other. On the other hand, funnel area plots also count each data point as belonging to _exactly one_ category, and display the categories as mutually exclusive.

#### When are funnel plots appropriate?

Funnel plots are appropriate when the data contain a categorical variable where the frequencies of each category can be computed, and the categories can be ordered. Additionally, funnel plots assume a particular relationship between levels of the categorical variable, where each category is a proper subset of the previous category. If the data contain an unordered categorical variable, or the categories are better conceptualized as parts of a whole, consider a pie plot instead of a funnel plot.

#### What are funnel plots useful for?

- **Sequential Processes**: Visualizing data within sequential processes, where data typically funnels through various stages.
- **Data Distribution**: When you want to gain insights into the distribution of data at each stage within a process, and you can represent multiple categories as stacked bars for comparative analysis.
- **Efficiency Assessment**: To assess the efficiency and effectiveness of a process, particularly when evaluating the attrition or conversion of elements at each stage.

## Examples

### A basic funnel plot

Visualize the trend in consecutive stages of a categorical variable.

```python order=marketing_trend,marketing
import deephaven.plot.express as dx
marketing = dx.data.marketing()  # import the ticking marketing dataset

# create a basic funnel plot by specifying column names for `x` and `y`
marketing_trend = dx.funnel(marketing, x="Count", y="Stage")
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.funnel
```
