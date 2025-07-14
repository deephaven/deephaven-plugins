# Candlestick Plot

Candlestick plots are a financial data visualization tool commonly used in technical analysis. Similar to an OHLC, they also represent the open, close, high, and low prices of a financial instrument for a specific time period, providing insights into price movements and patterns, and aiding in the identification of trends and potential reversal points in financial markets.

Interpreting a candlestick chart involves understanding the visual representation of price data within a specific time frame. Each candlestick consists of a rectangular "body" representing the price range between the opening and closing prices, with the "wick" or "shadow" lines extending above and below the body indicating the high and low prices during that time period.

In a bullish (upward, typically shown as green) candlestick, the open is typically at the bottom of the body, and the close is at the top, indicating a price increase. In a bearish (downward, typically shown as red) candlestick, the open is at the top of the body, and the close is at the bottom, suggesting a price decrease. One can use these patterns, along with the length of the wicks and the context of adjacent candlesticks, to analyze trends.

## What are candlestick plots useful for?

- **Analyzing financial markets**: Candlestick plots are a standard tool in technical analysis for understanding price movements, identifying trends, and potential reversal points in financial instruments, such as stocks, forex, and cryptocurrencies.
- **Short to medium-term trading**: Candlestick patterns are well-suited for short to medium-term trading strategies, where timely decisions are based on price patterns and trends over a specific time frame.
- **Visualizing variation in price data**: Candlestick plots offer a visually intuitive way to represent variability in price data, making them valuable for traders and analysts who prefer a visual approach to data analysis.

## Examples

### A basic candlestick plot

Visualize the key summary statistics of a stock price as it evolves. Specify the column name of the instrument with `x`, and pass the `open`, `high`, `low`, and `close` arguments the appropriate column names.

```python order=candlestick_plot,stocks_1min_ohlc,stocks
import deephaven.plot.express as dx
import deephaven.agg as agg
stocks = dx.data.stocks()

# compute ohlc per symbol for each minute
stocks_1min_ohlc = stocks.update_view(
    "BinnedTimestamp = lowerBin(Timestamp, 'PT1m')"
).agg_by(
    [
        agg.first("Open=Price"),
        agg.max_("High=Price"),
        agg.min_("Low=Price"),
        agg.last("Close=Price"),
    ],
    by=["Sym", "BinnedTimestamp"],
)

candlestick_plot = dx.candlestick(
    stocks_1min_ohlc.where("Sym == `DOG`"),
    x="BinnedTimestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
)
```

### Calendar

Candlestick plots take a calendar argument. Dates and times are excluded from axes so that they conform to the calendar.

```python order=candlestick_plot_default,candlestick_plot_cal_name,candlestick_plot_cal,dog_prices,stocks_1min_dog,stocks
import deephaven.plot.express as dx
import deephaven.agg as agg
from deephaven.calendar import calendar, set_calendar

cal_name = "USNYSE_EXAMPLE"
cal = calendar(cal_name)
set_calendar(cal_name)

stocks = dx.data.stocks(starting_time="2018-06-01T09:27:00 ET")

# compute ohlc per symbol for each minute for dog
stocks_1min_dog = (
    stocks.update_view("BinnedTimestamp = lowerBin(Timestamp, 'PT1m')")
    .agg_by(
        [
            agg.first("Open=Price"),
            agg.max_("High=Price"),
            agg.min_("Low=Price"),
            agg.last("Close=Price"),
        ],
        by=["Sym", "BinnedTimestamp"],
    )
    .where("Sym == `DOG`")
)

dog_prices = stocks.where("Sym = `DOG`")

# plot with a specific calendar by name
candlestick_plot_cal_name = dx.candlestick(
    stocks_1min_dog,
    x="BinnedTimestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    calendar=cal_name,
)

# plot with a specific calendar object
candlestick_plot_cal = dx.candlestick(
    stocks_1min_dog,
    x="BinnedTimestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    calendar=cal,
)

# plot with the default calendar
candlestick_plot_default = dx.candlestick(
    stocks_1min_dog,
    x="BinnedTimestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    calendar=True,
)
```

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.express.candlestick
```
