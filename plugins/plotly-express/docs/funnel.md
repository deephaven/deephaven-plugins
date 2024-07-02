# Funnel Plot

A funnel plot is a data visualization that represents a process with various stages and allows multiple stacked categories, showing the quantitative values or counts at each stage in a funnel shape. It is a useful tool for tracking the progression or attrition of data through different stages, providing a visual overview of data distribution within the process. A funnel area plot, on the other hand, is another visualization that represents data progressing through stages, but it uses filled polygons to depict the proportional quantity of data at each stage, making it a valuable tool for comparing the relative size of categories within a process but can only represent one category.

#### When are funnel plots appropriate?

Funnel plots are appropriate when the data contain a categorical variable where the frequencies of each category can be computed, and the categories can be ordered. Additionally, funnel plots assume a particular relationship between levels of the categorical variable, where each category is a proper subset of the previous category. If the data contain an unordered categorical variable, or the categories are better conceptualized as parts of a whole, consider a pie plot instead of a funnel plot.

#### What are funnel plots useful for?

- **Sequential Processes**: Funnel plots are suitable for visualizing data within sequential processes, where data typically funnels through various stages.
- **Data Distribution**: When you want to gain insights into the distribution of data at each stage within a process, and you can represent multiple categories as stacked bars for comparative analysis.
- **Efficiency Assessment**: To assess the efficiency and effectiveness of a process, particularly when evaluating the attrition or conversion of elements at each stage.

## Examples

### A basic funnel plot

Visualize the trend in consecutive stages of a categorical variable.

```python
import deephaven.plot.express as dx

marketing = dx.data.marketing()  # import the ticking marketing dataset

# create a basic funnel plot by specifying column names for `x` and `y`
marketing_trend = dx.funnel(marketing_table, x="Count", y="Stage")
```

## API Reference
```{eval-rst}
.. autofunction:: deephaven.plot.express.funnel
```
