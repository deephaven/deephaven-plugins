<!-- coverage-seen-elsewhere:
  crosshair_mode -> styling.md
  watermark_text -> watermark.md
  background_color -> styling.md
  text_color -> styling.md
-->

# Options Chart

An options chart plots a quantity against *strike price* on a numeric horizontal axis, not against time. The renderer is TVL's `createOptionsChart`, which is designed for cross-sectional snapshots indexed by strike: option bid/ask curves, implied-vol smiles, open-interest profiles, and gamma exposure.

`tvl.options_chart` supports three series types: `"line"` (default), `"area"`, and `"histogram"`. They share the same axis behavior; only the rendering changes.

## What are options charts useful for?

- **Option price curves**: Plot CallBid/CallAsk across strikes to see the price structure across the chain.
- **Volatility smiles**: Implied vol vs. strike is the "smile" or "skew" chart this rendering is built for.
- **Open interest / volume profiles**: Histogram mode turns the same chart into a strike-indexed bar chart of open interest or daily volume.
- **Gamma exposure**: Net gamma by strike (positive bars above zero, negative below) reads cleanly as a histogram or signed line.

## Examples

### A basic options curve

`tvl.data.options_chain()` is a 21-strike snapshot with columns `Strike`, `CallBid`, `CallAsk`, `PutBid`, `PutAsk`. Point `strike` and `value` at the right columns; defaults pick `series_type="line"`.

```python order=options_chart,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.options_chain()

options_chart = tvl.options_chart(data, strike="Strike", value="CallBid")
```

A single line traces call bids from the 50 strike to the 150 strike.

### Switch to an area rendering

`series_type="area"` fills the area under the curve. Useful for "stacked" reads of a single quantity (e.g. notional gamma) where the magnitude under each strike matters.

```python order=options_chart,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.options_chain()

options_chart = tvl.options_chart(
    data,
    strike="Strike",
    value="CallBid",
    series_type="area",
    top_color="rgba(214, 39, 40, 0.5)",
    bottom_color="rgba(214, 39, 40, 0.0)",
    line_color="#d62728",
)
```

The filled area fades to transparent at the bottom; the rim is solid red.

### Switch to a histogram rendering

`series_type="histogram"` renders one bar per strike. Pair it with the `color` parameter and a stronger contrast so the bars register clearly.

```python order=options_chart,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.options_chain()

options_chart = tvl.options_chart(
    data,
    strike="Strike",
    value="CallBid",
    series_type="histogram",
    color="#9467bd",
)
```

One purple bar rises at each of the 21 strikes.

### Customize color and width (line mode)

`color` is the line CSS color; `line_width` is the integer pixel width (1-4); `title` is the legend label.

```python order=options_chart,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.options_chain()

options_chart = tvl.options_chart(
    data,
    strike="Strike",
    value="CallBid",
    color="#2ca02c",
    line_width=2,
    title="Call bid curve",
)
```

The line is green, two pixels wide, with a custom legend entry.

### Plot a different value column

The y-axis can be any numeric column. Swap `CallBid` for `PutAsk` (or implied vol, open interest, gamma, whatever your table has) without touching the rest of the call.

```python order=options_chart,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.options_chain()

options_chart = tvl.options_chart(data, strike="Strike", value="PutAsk")
```

The chart now traces the put-ask curve instead of the call-bid curve.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.options_chart
```
