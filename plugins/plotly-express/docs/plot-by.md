# Plot By

To plot multiple series from a table into a single chart, use the `by` parameter. This parameter accepts a column name or a list of column names denoting other variables of interest in the dataset. The chart will be partitioned by the values in the specified column(s), with one series for each unique value. Other parameters, such as `color`, `symbol`, `size`, `width`, and `line_dash` can also be used to partition the chart.

Under the hood, the Deephaven query engine performs a `partition_by` table operation on the given grouping column to create each series. This efficient implementation means that plots with multiple groups can easily scale to tens of millions or billions of rows with ease.

## Examples

### Scatter plot by a categorical variable

Create a [scatter plot](scatter.md), where the color of each point is determined by a categorical grouping variable.

```python order=pedal_size_by_species,iris
import deephaven.plot.express as dx
iris = dx.data.iris() # import the example iris data set

# specify `x` and `y` columns, as well as additional grouping variable with `by`
pedal_size_by_species = dx.scatter(iris, x="PetalLength", y="PetalWidth", by="Species")
```

Or, use `symbol` to differentiate groups with symbols.

```python order=pedal_size_by_species_sym,iris
import deephaven.plot.express as dx
iris = dx.data.iris() # import the example iris data set

# use different symbols to denote different groups
pedal_size_by_species_sym = dx.scatter(iris, x="PetalLength", y="PetalWidth", symbol="Species")
```

### Scatter plot by a numeric variable

Use a numeric variable with the `size` parameter to change the size of the points based on the value of the numeric variable.

```python order=total_bill_tip_size,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# the `size` column from tips gives the number in the party
total_bill_tip_size = dx.scatter(tips, x="TotalBill", y="Tip", size="Size")
```

If the sizes are too large or small, use the `size_map` argument to map each numeric value to a more appropriate size.

```python order=total_bill_tip_size,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# the `size` column from tips gives the number in the party, map it to different sizes
total_bill_tip_size = dx.scatter(
    tips, x="TotalBill", y="Tip", size="Size",
    size_map={"1": 5, "2": 7, "3": 11, "4": 13, "5": 15, "6": 17}
)
```

### Scatter plot by several categorical variables

Pass two or more column names to the `by` argument to color points based on unique combinations of values.

```python order=total_bill_sex_smoker,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# passing a list to `by` gives unique colors for each combination of values in the given columns
total_bill_sex_smoker = dx.scatter(tips, x="TotalBill", y="Tip", by=["Sex", "Smoker"])
```

Alternatively, use other arguments such as `symbol` or `size` to differentiate groups.

```python order=total_bill_sex_smoker_sym,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# use color to denote sex, and symbol to denote smoking status
total_bill_sex_smoker_sym = dx.scatter(tips, x="TotalBill", y="Tip", by="Sex", symbol="Smoker")
```

### Line plot by a categorical variable

Use a [line plot](line.md) to track the trends of a numeric variable over time, broken into categories using `by`.

```python order=prices_by_sym,stocks
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import ticking Stocks dataset

# use `by` argument to plot prices by stock symbol
prices_by_sym = dx.line(stocks, x="Timestamp", y="Price", by="Sym")
```

In the case of a line plot, `line_dash` can also be used to differentiate lines for different categories.

```python order=prices_by_sym,stocks
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import ticking Stocks dataset

# use `line_dash` argument to change line appearance per stock symbol
prices_by_sym = dx.line(stocks, x="Timestamp", y="Price", line_dash="Sym")
```

### Histogram plot by a categorical variable

Use `by` with [histograms](histogram.md) to visualize the distributions of multiple groups of data. Histograms can be stacked, or overlaid using `barmode="overlay"`.

```python order=life_exp_hist,life_exp_hist_overlaid,recent_gapminder,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import ticking Gapminder dataset

# filter by most recent instance of each country
recent_gapminder = gapminder.last_by("Country")

# create histogram of life expectancy distribution for each continent
life_exp_hist = dx.histogram(recent_gapminder, x="LifeExp", by="Continent")

# overlay histograms for easier visualization
life_exp_hist_overlaid = dx.histogram(recent_gapminder, x="LifeExp", by="Continent", barmode="overlay")
```

### Box plot by a categorical variable

Use `by` with [box plots](box.md) to visualize the distributions of multiple groups of data. Unlike histograms, using the `by` argument with box plots stacks them vertically.

```python order=life_exp_box,recent_gapminder,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import ticking Gapminder dataset

# filter by most recent instance of each country
recent_gapminder = gapminder.last_by("Country")

# box plot gives 5-number summary and potential outliers
life_exp_box = dx.box(recent_gapminder, x="LifeExp", by="Continent")
```

### Violin plot by a categorical variable

Use `by` with [violin plots](violin.md) to visualize the distributions of multiple groups of data. The `by` argument for a violin plot behaves similarly to a box plot.

```python order=life_exp_violin,recent_gapminder,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import ticking Gapminder dataset

# filter by most recent instance of each country
recent_gapminder = gapminder.last_by("Country")

# the violins may be too thin to be useful
life_exp_violin = dx.violin(recent_gapminder, x="LifeExp", by="Continent")
```
