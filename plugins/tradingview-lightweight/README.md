# deephaven-plugin-tradingview-lightweight

A Deephaven plugin for creating TradingView Lightweight Charts from Python.

## Usage

```python
from deephaven.plot import tradingview_lightweight as tvl

# Simple candlestick chart
chart = tvl.candlestick(
    ohlc_table,
    time="Timestamp",
    open="Open",
    high="High",
    low="Low",
    close="Close",
)

# Multi-series chart
chart = tvl.chart(
    tvl.candlestick_series(
        ohlc_table, time="Timestamp", open="Open", high="High", low="Low", close="Close"
    ),
    tvl.line_series(
        sma_table, time="Timestamp", value="SMA_20", color="#2962FF", title="SMA 20"
    ),
    crosshair_mode="magnet",
    time_visible=True,
)
```
