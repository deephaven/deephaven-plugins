<!-- coverage-seen-elsewhere:
  price_format on series -> candlestick.md, line.md, area.md
  watermark_text -> watermark.md
-->

# Price Formats

Price formatters control how numeric values appear on price-axis tick labels, crosshair labels, and last-value labels. TVL ships five typed surfaces — `PriceFormat` (per-series), and four chart-level named-preset enums (`PriceFormatter`, `TickmarksPriceFormatter`, `PercentageFormatter`, `TickmarksPercentageFormatter`) — that cover the common currency, percent, volume, and scientific notation cases without writing a JavaScript formatter.

Reach for `PriceFormat` when you need precision-level control on one series; reach for the chart-level named presets when you want every label across the chart to share a single format.

## What are price formats useful for?

- **Matching market conventions**: USD equities want two decimals, JPY pairs want zero, FX wants four — pick the right preset and the crosshair label looks like the venue you trade on.
- **Volume formatting**: Render volume axes as `1.2M` instead of `1,234,567` by using `type="volume"` on the histogram series.
- **Percent overlays**: A percentage-mode price scale needs a percent formatter; pair it with `scale_mode="percentage"` for relative-return overlays.
- **Tick density and label width**: A compact formatter (`"compact"`) keeps long-number axes from pushing the plot area narrow.

## Examples

### Set per-series price format with `PriceFormat`

`PriceFormat` is a `TypedDict` you build inline and pass to the `price_format=` parameter of any series factory. `type` selects the kind (`"price"`, `"volume"`, `"percent"`), `precision` is the number of decimal places, and `minMove` is the smallest representable step (note the camelCase — it's a passthrough to the JS layer).

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(
        values,
        timestamp="Timestamp",
        value="Value",
        price_format={"type": "price", "precision": 4, "minMove": 0.0001},
    ),
)
```

Use this when your data is denominated in a unit that doesn't match the chart-level locale or formatter.

### Format volume with `PriceFormat`

For volume axes (and any large-number axis), `type="volume"` tells lightweight-charts to render large values in a human-readable form. Combine it with the histogram chart for the canonical price + volume pane stack.

```python order=chart,volume
import deephaven.plot.tradingview_lightweight as tvl

volume = tvl.data.volume()

chart = tvl.chart(
    tvl.histogram(
        volume,
        timestamp="Timestamp",
        value="Volume",
        price_format={"type": "volume", "precision": 0},
    ),
)
```

Set `precision=0` for whole-share volume; use `precision=2` if you're plotting dollar volume.

### Format a percent series with `PriceFormat`

`type="percent"` renders raw percentage values (e.g. `42.5` as `42.5%`) on the price axis. Use this for return overlays where the underlying series already holds percentages.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
returns = values.update_view(["Value = (Value - 100.0) / 100.0 * 100.0"])

chart = tvl.chart(
    tvl.line(
        returns,
        timestamp="Timestamp",
        value="Value",
        price_format={"type": "percent", "precision": 2},
    ),
)
```

If you actually want the price scale to be in percent mode (not just the labels), pair this with `scale_mode="percentage"` on the series — see [price-scale](price-scale.md).

### Pick a named price formatter for crosshair labels

`PriceFormatter` is the chart-level named preset for the crosshair price label and last-value label. Set `price_formatter="currency_usd"` and every numeric label gets the `$1,234.56` shape. Pair it with `locale="en-US"` to lock down thousands separators and decimal punctuation.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    price_formatter="currency_usd",
    locale="en-US",
)
```

The `PriceFormatter` enum values are `"currency_usd"`, `"currency_eur"`, `"currency_gbp"`, `"currency_jpy"`, `"percent"`, `"compact"`, and `"scientific"`.

### Switch between USD, EUR, GBP, and JPY presets

The `PriceFormatter` and `TickmarksPriceFormatter` aliases both accept the same four currency presets plus `"percent"`, `"compact"`, and `"scientific"`. Pick whichever matches your data and locale.

```python order=usd,eur,gbp,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

usd = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    price_formatter="currency_usd",
    tickmarks_price_formatter="currency_usd",
    locale="en-US",
)
eur = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    price_formatter="currency_eur",
    tickmarks_price_formatter="currency_eur",
    locale="de-DE",
)
gbp = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    price_formatter="currency_gbp",
    tickmarks_price_formatter="currency_gbp",
    locale="en-GB",
)
```

Each currency preset wraps numbers in the right symbol; the `locale` kwarg controls the thousands separator and decimal mark.

### Use the JPY currency preset

`"currency_jpy"` is the only preset that defaults to zero decimal places, matching how yen pairs are conventionally quoted. Pair it with `locale="ja-JP"` for fully-localized thousands separators.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value"),
    price_formatter="currency_jpy",
    locale="ja-JP",
)
```

If you need a different decimal count, drop down to `PriceFormat` and set `precision` explicitly.

### Use the compact preset for high-volume axes

`"compact"` renders 1234 as `1.23K`, 12,345,678 as `12.35M`, etc. — useful for axes that span many orders of magnitude.

```python order=chart,volume
import deephaven.plot.tradingview_lightweight as tvl

volume = tvl.data.volume()
big_volume = volume.update_view(["Volume = Volume * 1_000_000"])

chart = tvl.chart(
    tvl.histogram(big_volume, timestamp="Timestamp", value="Volume"),
    price_formatter="compact",
)
```

This is the simplest answer to "I want my axis to show K/M/B suffixes."

### Scientific notation for wide-range axes

`"scientific"` renders values as `1.23e+5`. Reach for it when the axis spans many orders of magnitude (latency in nanoseconds vs seconds, etc.) and you want exponents instead of compact suffixes.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
scientific_values = values.update_view(["Value = Value * 1e-9"])

chart = tvl.chart(
    tvl.line(scientific_values, timestamp="Timestamp", value="Value"),
    price_formatter="scientific",
)
```

### Format axis tick labels separately

`TickmarksPriceFormatter` controls the *tick label* on the price axis, while `PriceFormatter` controls the *crosshair* label. The enum values are identical but the two parameters are independent — you can render `$1,234.56` on the crosshair while showing a compact `1.2K` on the axis ticks.

```python order=chart,volume
import deephaven.plot.tradingview_lightweight as tvl

volume = tvl.data.volume().update_view(["Volume = Volume * 1_000_000"])

chart = tvl.chart(
    tvl.histogram(volume, timestamp="Timestamp", value="Volume"),
    price_formatter="currency_usd",
    tickmarks_price_formatter="compact",
)
```

This split keeps detailed values in the crosshair without blowing out the axis width.

### Format percentages with `PercentageFormatter`

`PercentageFormatter` is the named-preset enum for the crosshair *percentage* label, used when a price scale is in percentage mode. Its four values trade precision for compactness: `"percent"` shows two decimals, `"percent_1dp"` one, `"percent_0dp"` zero, and `"decimal"` falls back to the raw ratio.

```python order=chart,decimal,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", scale_mode="percentage"),
    percentage_formatter="percent_1dp",
)

# Use the raw-ratio fall-back when your audience reads `0.42` instead of `42%`.
decimal = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", scale_mode="percentage"),
    percentage_formatter="decimal",
    tickmarks_percentage_formatter="decimal",
)
```

Switch to `"percent_0dp"` for a tighter dashboard layout or to `"decimal"` if your audience reads raw ratios.

### Format percentage tick marks

`TickmarksPercentageFormatter` mirrors `PercentageFormatter` but controls the axis ticks themselves. Use it together with a percentage price scale to render ticks like `42%` while the crosshair shows `42.5%`.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()

chart = tvl.chart(
    tvl.line(values, timestamp="Timestamp", value="Value", scale_mode="percentage"),
    percentage_formatter="percent",
    tickmarks_percentage_formatter="percent_0dp",
)
```

The four `TickmarksPercentageFormatter` values match `PercentageFormatter`: `"percent"`, `"percent_1dp"`, `"percent_0dp"`, `"decimal"`.

### Custom precision for tiny-tick instruments

For instruments quoted in tiny increments (FX 4-pip, low-priced crypto), build a `PriceFormat` with the right `precision` and `minMove` rather than reaching for a preset. The chart formatter respects the precision exactly.

```python order=chart,values
import deephaven.plot.tradingview_lightweight as tvl

values = tvl.data.values()
fx = values.update_view(["Value = Value * 0.0001"])

chart = tvl.chart(
    tvl.line(
        fx,
        timestamp="Timestamp",
        value="Value",
        price_format={"type": "price", "precision": 5, "minMove": 0.00001},
    ),
)
```

The JS API supports a `'custom'` `type` for arbitrary formatter callbacks — that's not available from Python, since it requires a JavaScript function. Stick with the built-in `"price"`, `"volume"`, and `"percent"` types or use the chart-level named presets.

## API Reference

For the full `tvl.chart` signature, see the [Chart container](chart.md#api-reference) page.
