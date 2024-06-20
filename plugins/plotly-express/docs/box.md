# Box Plot

A box plot, also known as a box-and-whisker plot, is a data visualization that presents a summary of a dataset's distribution. It displays key statistics such as the median, quartiles, and potential outliers, making it a useful tool for visually representing the central tendency and variability of data.

#### When are box plots appropriate?

Box plots are appropriate for visualizing a single continuous variable.

#### What are box plots are useful for?

- **Visualizing Overall Distribution**: Box plots reveal the distribution of the variable of interest. They are good first-line tools for assessing whether a variable's distribution is symmetric, right-skewed, or left-skewed.
- **Assessing Center and Spread**: A box plot displays the center (median) of a dataset using the middle line, and displays the spread (IQR) using the width of the box.
- **Identifying Potential Outliers**: The dots displayed outside of the fenceposts in a box plot are considered candidates for being outliers. These should be examined closely, and their frequency can help determine whether the data come from a heavy-tailed distribution.

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