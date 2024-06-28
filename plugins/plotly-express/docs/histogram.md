# Histogram Plot

A histogram plot is a data visualization technique commonly used in statistics and data analysis to visualize the distribution of a single continuous variable. It consists of a series of contiguous, non-overlapping bars that provide a visual summary of the frequency or density of data points within predefined intervals or "bins." The number of bins significantly impacts the visualization. Currently, this number currently must be set manually.

#### When are histograms appropriate?

Histograms are appropriate when the data contain a continuous variable of interest. If there is an additional categorical variable that the variable of interest depends on, layered histograms may be appropriate.

#### What are histograms useful for?

- **Data Distribution Analysis**: Histograms are a valuable tool to gain insights into the distribution of a dataset, making it easier to understand the central tendencies, spread, and skewness of the data.
- **Identifying Outliers**: Histograms help in detecting outliers or anomalies in a dataset by highlighting data points that fall outside the typical distribution.
- **Density Estimation**: Histograms can serve as the basis for density estimation methods, helping to model and understand underlying data distributions, which is crucial in statistical analysis and machine learning.

## Examples

### A basic histogram

Visualize the distribution of a single continuous variable.

```python order=setosa_sep_length,setosa,iris
import deephaven.plot.express as dx
iris = dx.data.iris() # import a ticking version of the Iris dataset

# subset to get specific species
setosa = iris.where("species == `setosa`")

# create a basic histogram by specifying the variable of interest
setosa_sep_length = dx.histogram(setosa, x="sepal_length")
```

### Distributions of several groups

Histograms can also be used to compare the distributional properties of different groups of data, though they may be a little harder to read than box plots or violin plots.

```python order=sep_length_multi,sep_length_multi_overlay,iris
import deephaven.plot.express as dx
iris = dx.data.iris() # import a ticking version of the Iris dataset

# Ex 1. Each bin is stacked side-by-side for each group
sep_length_multi = dx.histogram(iris, x="sepal_length", by="species")

# Ex 2. Each bin is overlaid with the others
sep_length_multi_overlay = dx.histogram(iris, x="sepal_length", by="species", barmode="overlay")
```

## API Reference
```{eval-rst}
.. autofunction:: deephaven.plot.express.histogram
```