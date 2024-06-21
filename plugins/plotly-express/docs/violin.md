# Violin Plot

A violin plot is a data visualization that combines a box plot with a rotated kernel density plot to provide a comprehensive representation of the data distribution. It offers a detailed view of the data's central tendency, spread and density.

#### When are violin plots appropriate?

Violin plots are appropriate when the data contain a continuous variable of interest. If there is an additional categorical variable that the variable of interest depends on, side-by-side violin plots may be appropriate.

#### What are violin plots useful for?

- **Data Distribution Comparison**: Violin plots are effective for visually comparing and contrasting the distribution of multiple datasets or categories, allowing for quick identification of differences in data patterns.
- **Central Tendency and Spread**: Violin plots provide insights into the central tendencies and variability of data, including the median, quartiles, and potential outliers.
- **Multimodal Data**: They are particularly useful when dealing with data that exhibits multiple modes or peaks, as they can reveal these underlying patterns effectively.

## Examples

### A basic violin plot

Visualize the distribution of a continuous variable, for each group in a grouping column.

```python order=sepal_length_distribution,iris
import deephaven.plot.express as dx
iris = dx.data.iris() # import a ticking version of the Iris dataset

# create a basic violin plot, specifying `x` will plot the violins horizontally, while specifying `y` will plot them vertically
sepal_length_distribution = dx.violin(iris, x="sepal_length", by="species")
```

## API Reference
```{eval-rst}
.. autofunction:: deephaven.plot.express.violin
```