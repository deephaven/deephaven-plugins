# OHLC Plot

OHLC (Open-High-Low-Close) plots are a common data visualization tool used in finance to represent the price data of a financial instrument over a specific time frame. Similar to Candlesticks, they display four key prices: the opening price (open), the highest price (high), the lowest price (low), and the closing price (close), typically as vertical bars on a chart, providing insights into price movements and trends.

In OHLC plots, each bar consists of a vertical line with small horizontal lines on both ends. The top of the vertical line represents the high price, the bottom represents the low price, the horizontal line on the left indicates the opening price, and the horizontal line on the right signifies the closing price. Additionally, the color of the bar is often used to indicate whether the closing price was higher (bullish, often green) or lower (bearish, often red) than the opening price, aiding in the quick assessment of price trends and market sentiment. Analyzing the shape, color, and position of these bars helps traders and analysts assess the price movement, trends, and market sentiment within a given time frame.

## What are OHLC plots useful for?

- **Price trend analysis**: OHLC charts provide a clear visual representation of price trends and movements over specific time periods, helping traders and analysts assess market direction.
- **Identifying support and resistance**: They aid in identifying support and resistance levels, key price points that can inform trading decisions and risk management.
- **Quantitative analysis**: OHLC data can be leveraged for quantitative analysis, statistical modeling, and the development of trading strategies, making them valuable in algorithmic and systematic trading.

## Examples

### A basic OHLC plot

Visualize the key summary statistics of a stock price as it evolves. Pass the column name of the instrument to `x`, and pass the `open`, `high`, `low`, and `close` arguments the appropriate column names.

```python order=ohlc_plot,stocks_1min_ohlc,stocks
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

# create a basic candlestick plot - the `open`, `high`, `low`, and `close` arguments must be specified
ohlc_plot = dx.ohlc(
    stocks_1min_ohlc.where("Sym == `DOG`"),
    x="BinnedTimestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
)
```

### Calendar

OHLC plots take a calendar argument. Dates and times are excluded from axes so that they conform to the calendar.

```python order=ohlc_plot_default,ohlc_plot_cal_name,ohlc_plot_cal,dog_prices,stocks_1min_ohlc,stocks
import deephaven.plot.express as dx
import deephaven.agg as agg
from deephaven.calendar import calendar, set_calendar

cal_name = "USNYSE_EXAMPLE"
cal = calendar(cal_name)
set_calendar(cal_name)

stocks = dx.data.stocks(starting_time="2018-06-01T09:27:00 ET")

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

dog_prices = stocks.where("Sym = `DOG`")

# plot with a specific calendar by name
ohlc_plot_cal_name = dx.ohlc(
    stocks_1min_ohlc.where("Sym == `DOG`"),
    x="BinnedTimestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    calendar=cal_name,
)

# plot with a specific calendar object
ohlc_plot_cal = dx.ohlc(
    stocks_1min_ohlc.where("Sym == `DOG`"),
    x="BinnedTimestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
    calendar=cal,
)

# plot with the default calendar
ohlc_plot_default = dx.ohlc(
    stocks_1min_ohlc.where("Sym == `DOG`"),
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
.. dhautofunction:: deephaven.plot.express.ohlc
```
