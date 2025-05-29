# Filter By

To plot a subset of a table based on a column value, use the `filter_by` and `required_filter_by` parameters. These parameters accept column(s) denoting variables to filter on in the dataset. The plot shows only the data that matches the filter criteria. `filter_by` does not require the input filter to be set on that column whereas `required_filter_by` does.

Under the hood, the Deephaven query engine performs a `partition_by` table operation on the given filter column. This efficient implementation means that plots with many groups can be filtered and redrawn quickly, even with large datasets.

## Examples

### Filter by a categorical variable

To filter on a single column, provide a column to `filter_by`. The chart is filtered to match the value of the filter variable entered in the corresponding input filter. If the input filter is empty, all groups within the column are shown.

```python
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `filter_by`
filtered_line_plot = dx.line(stocks, x="Timestamp", y="Price", filter_by="Sym")
```

### Filter by multiple categorical variables

To filter on multiple columns, provide columns to `filter_by`. The chart is filtered to match the values of the filter variables entered in the corresponding input filters. If the input filters are empty, all groups of variables are shown.

```python
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `filter_by`
filtered_line_plot = dx.line(stocks, x="Timestamp", y="Price", filter_by=["Sym", "Exchange"])
```

### Filter by a required variable

To require a filter on a column, provide a column to `required_filter_by`. The chart is filtered to match the value of the filter variable entered in the corresponding input filter. If the input filter is empty, no data is shown.

```python
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `required_filter_by`
filtered_line_plot = dx.line(stocks, x="Timestamp", y="Price", required_filter_by="Sym")
```

### Filter by optional and required variables

To mix optional and required filters, provide columns to both `filter_by` and `required_filter_by`. The chart is filtered to match the values of the filter variables entered in the corresponding input filters. If only the `required_filter_by` input filter is empty, no data is shown. If only the `filter_by` input filter is empty, all groups within the `filter_by` column are shown.

> [!NOTE]
> Currently, mixing optional and required filters displays a message that all filters are required. Only the `required_filter_by` filters are actually required and the message is dismissed when all of those are provided.

```python
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `filter_by` and `required_filter_by`
filtered_line_plot = dx.line(stocks, x="Timestamp", y="Price", filter_by="Sym", required_filter_by="Exchange")
```

### Filter by and plot by

To mix a filter and [plot by](plot-by.md), provide columns to both `filter_by` and `by`. By default, all grouping variables within the columns are shown for `by` and `filter_by`.

```python
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `filter_by`
filtered_line_plot = dx.line(stocks, x="Timestamp", y="Price", by="Sym", filter_by="Exchange")
```

### `PartitionedTable` filter by

Providing a `PartitionedTable` defaults to a [plot by](plot-by.md) for the key columns that the table is partitioned on. Set `filter_by=True` to make the columns filters instead.

```python
import deephaven.plot.express as dx

# import and partitioned the example stocks data set
stocks = dx.data.stocks()
partitioned_stocks = stocks.partition_by(["Sym", "Exchange"])

# specify `x` and `y` columns, and make "Sym" and "Exchange" filters
filtered_line_plot = dx.line(partitioned_stocks, x="Timestamp", y="Price", filter_by=True)
```

### `PartitionedTable` required filter by

Providing a `PartitionedTable` defaults to a [plot by](plot-by.md) for the key columns that the table is partitioned on. Set `required_filter_by=True` to make the columns required filters instead.

```python
import deephaven.plot.express as dx

# import and partitioned the example stocks data set
stocks = dx.data.stocks()
partitioned_stocks = stocks.partition_by(["Sym", "Exchange"])

# specify `x` and `y` columns, and make "Sym" and "Exchange" required filters
filtered_line_plot = dx.line(partitioned_stocks, x="Timestamp", y="Price", required_filter_by=True)
```

### `PartitionedTable` filter by and plot by

Providing a `PartitionedTable` defaults to a [plot by](plot-by.md) for the key columns that the table is partitioned on. Set `filter_by` to a subset of the key columns to make those columns filters instead.

```python
import deephaven.plot.express as dx

# import and partitioned the example stocks data set
stocks = dx.data.stocks()
partitioned_stocks = stocks.partition_by(["Sym", "Exchange"])

# specify `x` and `y` columns, and make "Sym" a filter, maintaining "Exchange" as a plot by
filtered_line_plot = dx.line(partitioned_stocks, x="Timestamp", y="Price", filter_by="Sym")
```

### Subplot filter by

`make_subplots` maintains any `filter_by` and `required_filter_by` filter columns originally passed into the subplots.

> [!WARNING]
> Multiple filters with the same name but different types are not currently supported. Rename columns so that they are unique if necessary.

```python
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `filter_by`
filtered_sym_line_plot = dx.line(stocks, x="Timestamp", y="Price", filter_by="Sym", required_filter_by="Exchange")

# specify `x` and `y` columns, as well as additional required filter variables with `required_filter_by`
filtered_exchange_line_plot = dx.line(stocks, x="Timestamp", y="Price", required_filter_by="Exchange")

# make subplots, maintaining the filters
filtered_plots = dx.make_subplots(filtered_sym_line_plot, filtered_exchange_line_plot, num_rows=2)
```
