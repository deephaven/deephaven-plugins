# Titles and Legends

Deephaven Plotly Express provides ways to customize titles and legends with intuitive default behavior.

## Default Titles

The names of the x and y axes are set to the column names when passing single column names in.

```python order=line_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# subset data for just DOG transactions
dog_prices = my_table.where("Sym = `DOG`")

# x and y axis titles are set to the column names, Timestamp and Price
line_plot = dx.line(dog_prices, x="Timestamp", y="Price")
```

### Plot by Titles and Legend

When using the `by` argument, the legend is automatically generated. 
An entry is created for each unique value in the `by` column. 

```python order=line_plot,mytable
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# A legend entry is created for each unique value in the Sym column
line_plot = dx.line(my_table, x="Timestamp", y="Price", by="Sym")
```

### Titles and Legend for Multiple Columns

When passing in a list of columns, the axis title for the corresponding axis is set to a new name, `value`.
As with the `by` argument, the legend is automatically generated.

```python order=line_plot,mytable
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# subset data for just DOG transactions
dog_prices = my_table.where("Sym = `DOG`")

# A legend entry is created for each unique column name in the y list and the y axis title is set to "value"
line_plot = dx.line(dog_prices, x="Timestamp", y=["Price", "SPet500"])
```

### Custom Title

Add a title to the plot with the `title` argument. 

```python order=line_plot,mytable
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# subset data for just DOG transactions
dog_prices = my_table.where("Sym = `DOG`")

# The plot title is set to "Price of DOG"
line_plot = dx.line(dog_prices, x="Timestamp", y="Price", title="Price of DOG")
```

### Custom Axis Titles 

Customize the titles of the x and y axes with the `xaxis_titles` and `yaxis_titles` arguments. 

```python order=line_plot,mytable
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# subset data for just DOG transactions
dog_prices = my_table.where("Sym = `DOG`")

# customize the x and y axis titles with xaxis_titles and yaxis_titles
line_plot = dx.line(dog_prices, x="Timestamp", y="Price", xaxis_titles="Timestamp of Transaction", yaxis_titles="Price of DOG")
```