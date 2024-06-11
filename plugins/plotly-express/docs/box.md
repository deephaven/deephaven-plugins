# Box Plot

A box plot, also known as a box-and-whisker plot, is a data visualization that presents a summary of a dataset's distribution. It displays key statistics such as the median, quartiles, and potential outliers, making it a useful tool for visually representing the central tendency and variability of data.

Box plots are useful for:

1. **Visualizing Spread and Center**: Box plots provide a clear representation of the spread and central tendency of data, making it easy to understand the distribution's characteristics.
2. **Identification of Outliers**: They are effective in identifying outliers within a dataset, helping to pinpoint data points that deviate significantly from the norm.
3. **Comparative Analysis**: Box plots allow for easy visual comparison of multiple datasets or categories, making them useful for assessing variations and trends in data.
4. **Robustness**: Box plots are robust to extreme values and data skewness, providing a reliable means of visualizing data distributions even in the presence of outliers or non-normal data.

## Examples

### A basic box plot

Visualize the distribution of a single continuous variable using a box plot. Singular points lying outside the "fences" are candidates for being outliers.

```python order=total_bill_plot,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# create a basic box plot by specifying the variable of interest with `y`
total_bill_plot = dx.box(tips, y="total_bill")
```

### Distributions for multiple groups

Box plots are useful making comparisons between the distributions of two or more groups of data. Use the `by` argument to specify a grouping column.

```python order=total_bill_smoke,total_bill_sex,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# Ex 1. Total bill distribution by smoker / non-smoker
total_bill_smoke = dx.box(tips, y="total_bill", by="smoker")

# Ex 2. Total bill distribution by male / female
total_bill_sex = dx.box(tips, y="total_bill", by="sex")
```