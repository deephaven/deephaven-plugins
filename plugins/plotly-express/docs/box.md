# Box Plot

A box plot, also known as a box-and-whisker plot, is a data visualization that presents a summary of a dataset's distribution. It displays key statistics such as the median, quartiles, and potential outliers, making it a useful tool for visually representing the central tendency and variability of data. To learn more about the mathematics involved in creating box plots, check out [this article](https://asq.org/quality-resources/box-whisker-plot).

Box plots are appropriate when the data have a continuous variable of interest. If there is an additional categorical variable that the variable of interest depends on, side-by-side box plots may be appropriate using the `by` argument.

## What are box plots useful for?

- **Visualizing overall distribution**: Box plots reveal the distribution of the variable of interest. They are good first-line tools for assessing whether a variable's distribution is symmetric, right-skewed, or left-skewed.
- **Assessing center and spread**: A box plot displays the center (median) of a dataset using the middle line, and displays the spread (IQR) using the width of the box.
- **Identifying potential outliers**: The dots displayed in a box plot are considered candidates for being outliers. These should be examined closely, and their frequency can help determine whether the data come from a heavy-tailed distribution.

## Examples

### A basic box plot

Visualize the distribution of a single variable by passing the column name to `x` or `y`.

```python order=box_plot_x,box_plot_y,tips
import deephaven.plot.express as dx
tips = dx.data.tips()

# control the plot orientation using `x` or `y`
box_plot_x = dx.box(tips, x="TotalBill")
box_plot_y = dx.box(tips, y="TotalBill")
```

### Distributions for multiple groups

Box plots are useful for comparing the distributions of two or more groups of data. Pass the name of the grouping column(s) to the `by` argument.

```python order=box_plot_group_1,box_plot_group_2,tips
import deephaven.plot.express as dx
tips = dx.data.tips()

# total bill distribution by Smoker / non-Smoker
box_plot_group_1 = dx.box(tips, y="TotalBill", by="Smoker")

# total bill distribution by male / female
box_plot_group_2 = dx.box(tips, y="TotalBill", by="Sex")
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.box
```
