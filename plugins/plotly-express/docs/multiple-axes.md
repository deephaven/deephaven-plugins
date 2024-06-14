# Multiple Axes

You can create multiple x or y axes in a single plot in a few different ways, from columns or from paritions, or as layers from multiple plots. Passing multiple columns to the `x` or `y` parameters along with setting a `y_axis_sequence` or `x_axis_sequence` will create multiple axes. Using the `by` parameter along with an axis sequence can also create multiple axes, with one for each unique value in the column. The `layer` function can also be used to create multiple axes.

## Examples
