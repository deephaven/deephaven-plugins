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
dog_prices = stocks.where("sym == `DOG`")
dog_ohlc = dog_prices.update_view(
    "binnedTimestamp = lowerBin(timestamp, 'PT1m')"
).agg_by(
    [
        agg.first("open=price"),
        agg.max_("high=price"),
        agg.min_("low=price"),
        agg.last("close=price"),
    ],
    by="binnedTimestamp",
)

# layer a line plot and a candlestick plot by passing both to layer()
financial_plot = dx.layer(
    dx.line(
        dog_prices, x="timestamp", y="price"),
    dx.candlestick(
        dog_ohlc, x="binnedTimestamp",
        open="open", high="high", low="low", close="close")
)
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.layer
```
