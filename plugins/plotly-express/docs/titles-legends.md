# Titles and Legends

Deephaven Plotly Express provides ways to customize titles and legends with intuitive default behavior.

## Default Title

The names of the x and y axes are set to the column names when passing single column names in.

```python order=line_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# subset data for just DOG transactions
dog_prices = my_table.where("Sym = `DOG`")

# x and y axis titles are set to the column names, Timestamp and Price
line_plot = dx.line(dog_prices, x="Timestamp", y="Price")
```

## Plot by Titles and Legend

When using the `by` argument, the legend is automatically generated.
An entry is created for each unique value in the `by` column.

```python order=line_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# A legend entry is created for each unique value in the Sym column
line_plot = dx.line(my_table, x="Timestamp", y="Price", by="Sym")
```

## Titles and Legend for Multiple Columns

When passing in a list of columns, the axis title for the corresponding axis is set to a new name, `value`.
As with the `by` argument, the legend is automatically generated.

```python order=line_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# subset data for just DOG transactions
dog_prices = my_table.where("Sym = `DOG`")

# A legend entry is created for each unique column name in the y list and the y axis title is set to "value"
line_plot = dx.line(dog_prices, x="Timestamp", y=["Price", "SPet500"])
```

## Title Customization

### Custom Title

Add a title to the plot with the `title` argument.

```python order=line_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# subset data for just DOG transactions
dog_prices = my_table.where("Sym = `DOG`")

# The plot title is set to "Price of DOG"
line_plot = dx.line(dog_prices, x="Timestamp", y="Price", title="Price of DOG")
```

### Custom Axis Titles

Customize the titles of the x and y axes with the `xaxis_titles` and `yaxis_titles` arguments.

```python order=line_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# subset data for just DOG transactions
dog_prices = my_table.where("Sym = `DOG`")

# customize the x and y axis titles with xaxis_titles and yaxis_titles
line_plot = dx.line(dog_prices, x="Timestamp", y="Price", xaxis_titles="Timestamp of Transaction", yaxis_titles="Price of DOG")
```

## Legend Customization

Legends are customizable with [unsafe_update_figure](unsafe-update-figure.md). Generally, legend customization is safe.

### Legend Position

By default, the legend is placed in the top right corner of the plot.
Move the legend around the plot with `x`, `y`, `xanchor`, and `yanchor` arguments to the `update_layout` method.
`xanchor` and `yanchor` set the anchor point of the legend, which determine which part of the legend box is used to position the legend.
`x` and `y` set the position of the anchor point relative to the plot area.
For `x` and `y`, 0 is the left or bottom of the plot area and 1 is the right or top of the plot area.
Negative values or values above 1 for `x` and `y` move the anchor point outside the plot area.
`xanchor` can be set to `"auto"`, `"left"`, `"center"`, or `"right"` and `yanchor` can be set to `"auto"`, `"top"`, `"middle"`, or `"bottom"`.

### Legend Overlay

Overlay the legend by positioning the top left corner of the legend just inside the plot area.

```python order=legend_overlay_plot,tips
import deephaven.plot.express as dx

tips = dx.data.tips()

def update(figure):
    # Update the layout to move the legend to the top left
    # x and y are set to move the top left corner of the legend just inside the plot area
    figure.update_layout(
        legend=dict(yanchor="top", y=0.99, xanchor="left", x=0.01)
    )

legend_overlay_plot = dx.scatter(
    tips, x="TotalBill", y="Tip", color="Day", unsafe_update_figure=update
)
```

### Horizontal Legend

Customize the legend to be horizontal by updating the layout with `orientation="h"`.
Move the legend just outside the bottom of the plot area by setting `y` to a negative value.

```python order=legend_horizontal_plot,tips
import deephaven.plot.express as dx

tips = dx.data.tips()

def update(figure):
    # Update the layout to move the legend to the bottom
    # y is negative to move the legend outside the bottom of the plot area
    # xanchor and x are set to center the legend
    figure.update_layout(
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=-0.3,
            xanchor="center",
            x=0.5)
    )

legend_horizontal_plot = dx.scatter(
    tips, x="TotalBill", y="Tip", color="Day", unsafe_update_figure=update
)
```

### Hide Legend

Hide the legend by updating the layout with `showlegend=False`.

```python order=legend_hidden_plot,tips
import deephaven.plot.express as dx

tips = dx.data.tips()

def update(figure):
    figure.update_layout(
        showlegend=False
    )

legend_hidden_plot = dx.scatter(
    tips, x="TotalBill", y="Tip", color="Day", unsafe_update_figure=update
)
```
