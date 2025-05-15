# Layer plots

To "layer" or "stack" multiple plots on top of each other, use the `layer` function. This is useful if you want to combine multiple plots of different types into a single visualization, such as a [scatter plot](scatter.md) and a [line plot](line.md). This is distinct from [sub-plots](sub-plots.md), which present multiple plots side-by-side. By default, the stacked plot will use the layout (axis labels, axis ranges, and title) from the last plot in the sequence. The `which_layout` parameter can be used to specify which plot's layout should be used.

## Examples

### Layering two plots

Use a [candlestick plot](candlestick.md) and a [line plot](line.md) for two different perspectives on the same data.

```python order=financial_plot,dog_prices,dog_ohlc,stocks
import deephaven.plot.express as dx
import deephaven.agg as agg
stocks = dx.data.stocks()  # import the example stock market data set

# select only DOG prices and compute ohlc
dog_prices = stocks.where("Sym == `DOG`")
dog_ohlc = dog_prices.update_view(
    "BinnedTimestamp = lowerBin(Timestamp, 'PT1m')"
).agg_by(
    [
        agg.first("Open=Price"),
        agg.max_("High=Price"),
        agg.min_("Low=Price"),
        agg.last("Close=Price"),
    ],
    by="BinnedTimestamp",
)

# layer a line plot and a candlestick plot by passing both to layer()
financial_plot = dx.layer(
    dx.line(
        dog_prices, x="Timestamp", y="Price"),
    dx.candlestick(
        dog_ohlc, x="BinnedTimestamp",
        open="Open", high="High", low="Low", close="Close")
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.layer
```
