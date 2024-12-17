# Indicator Plot

An indicator plot is a type of plot that highlights a collection of numeric values.

### What are indicator plots useful for?

- **Highlight specific metrics**: Indicator plots are useful when you want to highlight specific numeric metrics in a visually appealing way.
- **Compare metrics to a reference value**: Indicator plots are useful to compare metrics to a reference value, such as a starting value or a target value.
- **Compare metrics to each other**: Indicator plots are useful to compare multiple metrics to each other by highlighting where they fall relative to each other.
- 
## Examples

### A basic indicator plot

Visualize a single numeric value by passing the column name to the `value` argument. The table should contain only one row.

```python
import deephaven.plot.express as dx
from deephaven import agg as agg

my_table = dx.data.stocks()

# subset data and aggregate for DOG prices
dog_avg = my_table.where("Sym = `DOG`").agg_by([agg.avg(cols="Price")])

indicator_plot = dx.indicator(dog_avg, value="Price")
```

### A delta indicator plot

Visualize a single numeric value with a delta to a reference value by passing the reference column name to the `reference` argument.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
from deephaven import agg as agg
my_table = dx.data.stocks()

# subset data and aggregate for DOG prices
dog_agg = my_table.where("Sym = `DOG`").agg_by([agg.avg(cols="Price"), agg.first(cols="StartingPrice = Price")])

indicator_plot = dx.indicator(dog_agg, value="Price", reference="StartingPrice")
```

## Indicator plots from variables

Pass variables into a table to create an indicator plot.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
from deephaven import new_table
from deephaven.column import int_col

my_value = 10
my_reference = 5

my_table = new_table([
    int_col("MyValue", [my_value]),
    int_col("MyReference", [my_reference])
])

indicator_plot = dx.indicator(my_table, value="MyValue", reference="MyReference")
```

# Delta only indicator plot

Visualize only the delta to a reference value by passing `number=False`.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
from deephaven import agg as agg
my_table = dx.data.stocks()

# subset data and aggregate for DOG prices
dog_agg = my_table.where("Sym = `DOG`").agg_by([agg.avg(cols="Price"), agg.first(cols="StartingPrice = Price")])

indicator_plot = dx.indicator(dog_agg, value="Price", reference="StartingPrice", number=False)
```

### An angular indicator plot

Visualize a single numeric value with an angular gauge by passing `gauge="angular"`.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
from deephaven import agg as agg
my_table = dx.data.stocks()

# subset data and aggregate for DOG prices
dog_avg = my_table.where("Sym = `DOG`").agg_by([agg.avg(cols="Price")])

indicator_plot = dx.indicator(dog_avg, value="Price", gauge="angular")
```

### A hidden axis bullet indicator plot

Visualize a single numeric value with a bullet gauge by passing `gauge="bullet"`. Hide the axis by passing `axis=False`.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
from deephaven import agg as agg
my_table = dx.data.stocks()

# subset data and aggregate for DOG prices
dog_avg = my_table.where("Sym = `DOG`").agg_by([agg.avg(cols="Price")])

indicator_plot = dx.indicator(dog_avg, value="Price", gauge="bullet", axis=False)
```

### Prefixes and suffixes

Add a prefix and suffix to the numeric value by passing `prefix` and `suffix`.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
from deephaven import agg as agg
my_table = dx.data.stocks()

# subset data and aggregate for DOG prices
dog_avg = my_table.where("Sym = `DOG`").agg_by([agg.avg(cols="Price")])

indicator_plot = dx.indicator(dog_avg, value="Price", prefix="$", suffix="USD")
```

### Delta Symbols

Modify the symbol before the delta value by passing `increasing_text` and `decreasing_text`.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
from deephaven import agg as agg
my_table = dx.data.stocks()

# subset data and aggregate for DOG prices
dog_avg = my_table.where("Sym = `DOG`").agg_by([agg.avg(cols="Price")])

indicator_plot = dx.indicator(dog_avg, value="Price", increasing_text="Up: ", decreasing_text="Down: ")
```

### Indicator with text

Add text to the indicator by passing the text column name to the `text` argument.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
from deephaven import agg as agg
my_table = dx.data.stocks()

# subset data and aggregate prices, keeping the Sym
dog_avg = my_table.where("Sym = `DOG`").agg_by([agg.avg(cols="Price")])

indicator_plot = dx.indicator(dog_avg, value="Price", text="Sym")
```

### Multiple indicators

Visualize multiple numeric values by passing in a table with multiple rows. By default, a square grid of indicators is created.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# aggregate for average prices by Sym
sym_avg = my_table.agg_by([agg.avg(cols="Price")], by="Sym")

indicator_plot = dx.indicator(sym_avg, value="Price")
```

### Multiple rows

By default, a grid of indicators is created. To create a specific amount of rows with a dynamic number of columns, pass the number of rows to the `rows` argument.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# aggregate for average prices by Sym
sym_avg = my_table.agg_by([agg.avg(cols="Price")], by="Sym")

indicator_plot = dx.indicator(sym_avg, value="Price", rows=2)
```

### Multiple columns

By default, a grid of indicators is created. To create a specific amount of columns with a dynamic number of rows, pass the number of columns to the `columns` argument.

```python order=indicator_plot,my_table
import deephaven.plot.express as dx
my_table = dx.data.stocks()

# aggregate for average prices by Sym
sym_avg = my_table.agg_by([agg.avg(cols="Price")], by="Sym")

indicator_plot = dx.indicator(sym_avg, value="Price", columns=2)
```

### Delta colors

Change the color of the delta value based on whether it is increasing or decreasing by passing `increasing_color_sequence` and `decreasing_color_sequence`.
These colors are applied sequentially to the indicators and looped if there are more indicators than colors.

```python
import deephaven.plot.express as dx
from deephaven import agg as agg

my_table = dx.data.stocks()

# subset data and aggregate for DOG prices
sym_agg = my_table.agg_by(
    [agg.avg(cols="Price"), agg.first(cols="StartingPrice = Price")]
)

indicator_plot = dx.indicator(
    sym_agg,
    value="Price",
    reference="Starting Price",
    increasing_color_sequence=["green", "darkgreen"],
    decreasing_color_sequence=["red", "darkred"],
)
```

### Gauge colors

Change the color of the gauge based on the value by passing `gauge_color_sequence`.
These colors are applied sequentially to the indicators and looped if there are more indicators than colors.

```python
import deephaven.plot.express as dx
from deephaven import agg as agg

my_table = dx.data.stocks()

# subset data and aggregate for DOG prices
sym_agg = my_table.agg_by([agg.avg(cols="Price")])

indicator_plot = dx.indicator(
    sym_agg, value="Price", gauge_color_sequence=["green", "darkgreen"]
)
```

### Plot by

Create groups of styled indicators by passing the grouping categorical column name to the `by` argument.
`increasing_color_map` and `decreasing_color_map` can be used to style the indicators based on the group.

```python
import deephaven.plot.express as dx
from deephaven import agg as agg

my_table = dx.data.stocks()

# subset data and aggregate prices, keeping the Sym
sym_agg = my_table.agg_by(
    [
        agg.avg(cols="Price"),
        agg.first(cols="StartingPrice = Price"),
        agg.last(cols="Sym"),
    ]
)

indicator_plot = dx.indicator(
    sym_agg,
    value="Price",
    reference="StartingPrice",
    by="Sym",
    increasing_color_map={"DOG": "darkgreen"},
    decreasing_color_map={"DOG": "darkred"},
)
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.indicator
```
