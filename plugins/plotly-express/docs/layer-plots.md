# Layer plots

To "layer" or "stack" multiple plots on top of each other, use the `layer` function. This is useful if you want to combine multiple plots of different types into a single plot, such as a scatter plot and a line plot. By default, last plot given will be used for the layout. The `which_layout` parameter can be used to specify which plot's layout should be used. The `specs` parameter can be used to specify the domains of each plot.

## Examples

### Layering two plots

Use a candlestick plot and a line plot for two different perspectives on the same data.

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
