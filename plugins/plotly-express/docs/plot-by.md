# Plot By

To plot multiple series from a table into a single chart, use the `by` parameter. This parameter accepts a column name or a list of column names denoting other variables of interest in the dataset. The chart will be partitioned by the values in the specified column(s), with one series for each unique value. Other parameters, such as `color` (for which `by` is an alias), `symbol`, `size`, `width`, and `line_dash` can also be used to partition the chart.

## Examples

### Scatter plot by a categorical variable

Create a scatter plot, where the color of each point is determined by a categorical grouping variable.

```python order=pedal_size_by_species,iris
import deephaven.plot.express as dx
iris = dx.data.iris() # import the example iris data set

# specify `x` and `y` columns, as well as additional grouping variable with `by`
pedal_size_by_species = dx.scatter(iris, x="petal_length", y="petal_width", by="species")
```

Or, use `symbol` to differentiate groups with symbols.

```python order=pedal_size_by_species_sym,iris
import deephaven.plot.express as dx
iris = dx.data.iris() # import the example iris data set

# use different symbols to denote different groups
pedal_size_by_species_sym = dx.scatter(iris, x="petal_length", y="petal_width", symbol="species")
```

### Scatter plot by a numeric variable

Use a numeric variable with the `size` parameter to change the size of the points based on the value of the numeric variable.

```python order=total_bill_tip_size,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# the `size` column from tips gives the number in the party
total_bill_tip_size = dx.scatter(tips, x="total_bill", y="tip", size="size")
```

If the sizes are too large or small, use the `size_map` argument to map each numeric value to a more appropriate size.

```python order=total_bill_tip_size,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# the `size` column from tips gives the number in the party, map it to different sizes
total_bill_tip_size = dx.scatter(
    tips, x="total_bill", y="tip", size="size",
    size_map={"1": 5, "2": 7, "3": 11, "4": 13, "5": 15, "6": 17}
)
```

### Scatter plot by several categorical variables

Pass two or more column names to the `by` argument to color points based on unique combinations of values.

```python order=total_bill_sex_smoker,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# passing a list to `by` gives unique colors for each combination of values in the given columns
total_bill_sex_smoker = dx.scatter(tips, x="total_bill", y="tip", by=["sex", "smoker"])
```

Alternatively, use other arguments such as `symbol` or `size` to differentiate groups.

```python order=total_bill_sex_smoker_sym,tips
import deephaven.plot.express as dx
tips = dx.data.tips() # import a ticking version of the Tips dataset

# use color to denote sex, and symbol to denote smoking status
total_bill_sex_smoker_sym = dx.scatter(tips, x="total_bill", y="tip", by="sex", symbol="smoker")
```

### Line plot by a categorical variable

Use a line plot to track the trends of a numeric variable over time, broken up by categories using `by`.

```python order=prices_by_sym,stocks
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import ticking Stocks dataset

# use `by` argument to plot prices by stock symbol
prices_by_sym = dx.line(stocks, x="timestamp", y="price", by="sym")
```

In the case of a line plot, `line_dash` can also be used to differentiate lines for different categories.

```python order=prices_by_sym_dash,stocks
import deephaven.plot.express as dx
stocks = dx.data.stocks() # import ticking Stocks dataset

# use `line_dash` argument to change line appearance per stock symbol
prices_by_sym = dx.line(stocks, x="timestamp", y="price", line_dash="sym")
```

### Distributional plots per category

Compare the distributions of a single variable over multiple categories using `by`. All distributional plots support `by`, and all yield different perspectives on the data.

#### Histogram

Histograms provide visualizations of univariate distributions, but can get clunky with several categories.

```python order=life_exp_hist,life_exp_hist_overlaid,recent_gapminder,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import ticking Gapminder dataset

# filter by most recent instance of each country
recent_gapminder = gapminder.last_by("country")

# create histogram of life expectancy distribution for each continent
life_exp_hist = dx.histogram(recent_gapminder, x="lifeExp", by="continent")

# overlay histograms for easier visualization
life_exp_hist_overlaid = dx.histogram(recent_gapminder, x="lifeExp", by="continent", barmode="overlay")
```

#### Box plot

Box plots are cleaner visualizations for distributions of multiple categories, and offer potential outlier detection.

```python order=life_exp_box,recent_gapminder,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import ticking Gapminder dataset

# filter by most recent instance of each country
recent_gapminder = gapminder.last_by("country")

# box plot gives 5-number summary and potential outliers
life_exp_box = dx.box(recent_gapminder, x="lifeExp", by="continent")
```

#### Violin plot

Violin plots offer clarity on multimodal data, but can lose clarity with roughly uniform distributions.

```python order=life_exp_violin,recent_gapminder,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import ticking Gapminder dataset

# filter by most recent instance of each country
recent_gapminder = gapminder.last_by("country")

# the violins may be too thin to be useful
life_exp_violin = dx.violin(recent_gapminder, x="lifeExp", by="continent")
```
<!--- TODO: Add strip plot when https://github.com/deephaven/deephaven-plugins/issues/548 is closed -->

#### Violin + Box + Strip plot

Combining a violin plot, a box plot, and a strip plot might yield the most insight on the distributions of each category.

```python order=life_exp_all,recent_gapminder,gapminder
import deephaven.plot.express as dx
gapminder = dx.data.gapminder() # import ticking Gapminder dataset

# filter by most recent instance of each country
recent_gapminder = gapminder.last_by("country")

# set `box=True` to get a box plot inside of the violins, and `points=all` to show strip plots
life_exp_all = dx.violin(recent_gapminder, y="lifeExp", by="continent", box=True, points="all")
```