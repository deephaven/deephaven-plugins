# Filter By

To plot a subset of a table based on a column value, use the `filter_by` and `required_filter_by` parameters. These parameters accept column(s) denoting variables to filter on in the dataset. The plot shows only the data that matches the filter criteria. `filter_by` does not require the [input filter](https://deephaven.io/core/docs/how-to-guides/user-interface/filters/#input-filters) or [Linker](https://deephaven.io/core/docs/how-to-guides/user-interface/filters/#linker) to be set on that column, whereas `required_filter_by` does.

Under the hood, the Deephaven query engine performs a `partition_by` table operation on the given filter column. This efficient implementation means that plots with many groups can be filtered and redrawn quickly, even with large datasets.

> [!NOTE]
> `filter_by` works similarly to the `one_click` API, although there are some differences in behavior:
> In the `one_click` API, if filters are provided but not set, then one trace is charted.
> In the `filter_by` API, if filters are provided but not set, then all values within the filter columns are charted on separate traces.
> This provides a consistent experience with `by` behavior on `dx` charts, but may not be optimal if filtering on numeric columns with many unique values.

## Examples

### Filter by a categorical variable

To filter on a single column, provide a column to `filter_by`. The chart is filtered to match the value of the filter variable from the corresponding input filter or link. If the input filter or link is not set, all groups within the column are shown.

```python skip-test
import deephaven.plot.express as dx

stocks = dx.data.stocks()  # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `filter_by`
filtered_line_plot = dx.line(stocks, x="Timestamp", y="Price", filter_by="Sym")
```

### Filter by multiple categorical variables

To filter on multiple columns, provide columns to `filter_by`. The chart is filtered to match the values of the filter variables from the corresponding input filters or links. If the input filters or links are not set, all groups of variables are shown.

```python skip-test
import deephaven.plot.express as dx

stocks = dx.data.stocks()  # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `filter_by`
filtered_line_plot = dx.line(
    stocks, x="Timestamp", y="Price", filter_by=["Sym", "Exchange"]
)
```

### Filter by a required variable

To require a filter on a column, provide a column to `required_filter_by`. The chart is filtered to match the value of the filter variable from the corresponding input filter or link. If the input filter or link is not set, no data is shown.

```python skip-test
import deephaven.plot.express as dx

stocks = dx.data.stocks()  # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `required_filter_by`
filtered_line_plot = dx.line(stocks, x="Timestamp", y="Price", required_filter_by="Sym")
```

### Filter by optional and required variables

To mix optional and required filters, provide columns to both `filter_by` and `required_filter_by`. The chart is filtered to match the values of the filter variables from the corresponding input filters or links. If only the `required_filter_by` input filter or link is not set, no data is shown. If only the `filter_by` input filter or link is not set, all groups within the `filter_by` column are shown.

> [!NOTE]
> Mixing optional and required filters displays overlays to enter filters for all columns. Only the `required_filter_by` filters are actually required and the message is dismissed when all of those are provided.

```python skip-test
import deephaven.plot.express as dx

stocks = dx.data.stocks()  # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `filter_by` and `required_filter_by`
filtered_line_plot = dx.line(
    stocks, x="Timestamp", y="Price", filter_by="Sym", required_filter_by="Exchange"
)
```

### Filter by and plot by

To mix a filter and [plot by](plot-by.md), provide columns to both `filter_by` and `by`. By default, all grouping variables within the columns are shown for `by` and `filter_by`.

```python skip-test
import deephaven.plot.express as dx

stocks = dx.data.stocks()  # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `filter_by`
filtered_line_plot = dx.line(
    stocks, x="Timestamp", y="Price", by="Sym", filter_by="Exchange"
)
```

### `PartitionedTable` filter by

Providing a `PartitionedTable` defaults to a [plot by](plot-by.md) for the key columns on which the table is partitioned. Set `filter_by=True` to make the columns filters instead.

```python skip-test
import deephaven.plot.express as dx

# import and partition on example stocks data set
stocks = dx.data.stocks()
partitioned_stocks = stocks.partition_by(["Sym", "Exchange"])

# specify `x` and `y` columns, and make "Sym" and "Exchange" filters
filtered_line_plot = dx.line(
    partitioned_stocks, x="Timestamp", y="Price", filter_by=True
)
```

### `PartitionedTable` required filter by

Providing a `PartitionedTable` defaults to a [plot by](plot-by.md) for the key columns on which the table is partitioned. Set `required_filter_by=True` to make the columns required filters instead.

```python skip-test
import deephaven.plot.express as dx

# import and partition on example stocks data set
stocks = dx.data.stocks()
partitioned_stocks = stocks.partition_by(["Sym", "Exchange"])

# specify `x` and `y` columns, and make "Sym" and "Exchange" required filters
filtered_line_plot = dx.line(
    partitioned_stocks, x="Timestamp", y="Price", required_filter_by=True
)
```

### `PartitionedTable` filter by and plot by

Providing a `PartitionedTable` defaults to a [plot by](plot-by.md) for the key columns on which the table is partitioned. Set `filter_by` to a subset of the key columns to make those columns filters instead.

```python skip-test
import deephaven.plot.express as dx

# import and partition on example stocks data set
stocks = dx.data.stocks()
partitioned_stocks = stocks.partition_by(["Sym", "Exchange"])

# specify `x` and `y` columns, and make "Sym" a filter, maintaining "Exchange" as a plot by
filtered_line_plot = dx.line(
    partitioned_stocks, x="Timestamp", y="Price", filter_by="Sym"
)
```

### Subplot filter by

`make_subplots` maintains any `filter_by` and `required_filter_by` filter columns originally passed into the subplots.

> [!WARNING]
> Using multiple filters with the same name but different types is not currently supported. Rename columns to ensure they are unique, if necessary.

```python skip-test
import deephaven.plot.express as dx

stocks = dx.data.stocks()  # import the example stocks data set

# specify `x` and `y` columns, as well as additional filter variables with `filter_by`
filtered_sym_line_plot = dx.line(
    stocks,
    x="Timestamp",
    y="Price",
    filter_by="Sym",
)

# specify `x` and `y` columns, as well as additional required filter variables with `required_filter_by`
filtered_exchange_line_plot = dx.line(
    stocks, x="Timestamp", y="Price", by="Sym", required_filter_by="Exchange"
)

# make subplots, maintaining the filters
filtered_plots = dx.make_subplots(
    filtered_sym_line_plot, filtered_exchange_line_plot, rows=2
)
```
