# Candlestick Plot

Candlestick plots are a financial data visualization tool commonly used in technical analysis. Similar to an OHLC, they also represent the open, close, high, and low prices of a financial instrument for a specific time period, providing insights into price movements and patterns, and aiding in the identification of trends and potential reversal points in financial markets.

Interpreting a candlestick chart involves understanding the visual representation of price data within a specific time frame. Each candlestick consists of a rectangular "body" representing the price range between the opening and closing prices, with the "wick" or "shadow" lines extending above and below the body indicating the high and low prices during that time period.

In a bullish (upward, typically shown as green) candlestick, the open is typically at the bottom of the body, and the close is at the top, indicating a price increase. In a bearish (downward, typically shown as red) candlestick, the open is at the top of the body, and the close is at the bottom, suggesting a price decrease. One can use these patterns, along with the length of the wicks and the context of adjacent candlesticks, to analyze trends.

#### When are candlestick plots appropriate?

Candlestick plots are generally only appropriate for financial data, due to their specialized requirements.

#### What are candlestick plots useful for?

- **Analyzing Financial Markets**: They are a standard tool in technical analysis for understanding price movements, identifying trends, and potential reversal points in financial markets, such as stocks, forex, and cryptocurrencies.
- **Short to Medium-Term Trading**: Candlestick patterns are well-suited for short to medium-term trading strategies, where timely decisions are based on price patterns and trends over a specific time frame.
- **Visualizing Variation in Price Data**: Candlestick charts offer a visually intuitive way to represent variability in price data, making them valuable for traders and analysts who prefer a visual approach to data analysis.

## Examples

### A basic candlestick plot

Visualize the key summary statistics of a single continuous variable as it evolves.

```python order=candlestick_plot,stocks_1min_ohlc,stocks
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
candlestick_plot = dx.candlestick(
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
.. autofunction:: deephaven.plot.express.candlestick
```