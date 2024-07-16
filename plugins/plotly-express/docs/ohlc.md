# OHLC Plot

OHLC (Open-High-Low-Close) plots, are a common data visualization tool used in finance to represent the price data of a financial instrument over a specific time frame. Similar to Candlesticks, they display four key prices: the opening price, the highest price (high), the lowest price (low), and the closing price, typically as vertical bars on a chart, providing insights into price movements and trends.

In OHLC plots, each bar consists of a vertical line with small horizontal lines on both ends. The top of the vertical line represents the high price, the bottom represents the low price, the horizontal line on the left indicates the opening price, and the horizontal line on the right signifies the closing price. Additionally, the color of the bar is often used to indicate whether the closing price was higher (bullish, often green) or lower (bearish, often red) than the opening price, aiding in the quick assessment of price trends and market sentiment. Analyzing the shape, color, and position of these bars helps traders and analysts assess the price movement, trends, and market sentiment within a given time frame.

### What are OHLC plots useful for?

- **Price trend analysis**: OHLC charts provide a clear visual representation of price trends and movements over specific time periods, helping traders and analysts assess market direction.
- **Identifying support and resistance**: They aid in identifying support and resistance levels, key price points that can inform trading decisions and risk management.
- **Quantitative analysis**: OHLC data can be leveraged for quantitative analysis, statistical modeling, and the development of trading strategies, making them valuable in algorithmic and systematic trading.

## Examples

### A basic OHLC plot

Visualize the key summary statistics of a single continuous variable as it evolves. This plot is functionally similar to a candlestick plot, but has a different appearance.

```python order=ohlc_plot,stocks_1min_ohlc,stocks
import deephaven.plot.express as dx
import deephaven.agg as agg
stocks = dx.data.stocks()  # import the example stock market data set

# compute ohlc per symbol for each minute
stocks_1min_ohlc = stocks.update_view(
    "binnedTimestamp = lowerBin(timestamp, 'PT1m')"
).agg_by(
    [
        agg.first("open=price"),
        agg.max_("high=price"),
        agg.min_("low=price"),
        agg.last("close=price"),
    ],
    by=["sym", "binnedTimestamp"],
)

# create a basic candlestick plot - the `open`, `high`, `low`, and `close` arguments must be specified
ohlc_plot = dx.ohlc(
    stocks_1min_ohlc.where("sym == `DOG`"),
    x="binnedTimestamp",
    open="open",
    high="high",
    low="low",
    close="close",
)
```

## API Reference
```{eval-rst}
.. dhautofunction:: deephaven.plot.express.ohlc
```