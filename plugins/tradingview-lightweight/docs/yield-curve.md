<!-- coverage-seen-elsewhere:
  crosshair_mode -> styling.md
  watermark_text -> watermark.md
  background_color -> styling.md
  text_color -> styling.md
-->

# Yield Curve Chart

A yield-curve chart plots yield against maturity (in months) rather than against time. It uses TVL's `createYieldCurveChart` renderer, which puts a numeric maturity axis on the horizontal, so the x-coordinates are *durations*, not timestamps. Use it when the x-axis is "how far out" rather than "when".

The chart supports two series shapes: `"line"` (default) and `"area"`. Other series types are rejected at construction time, so passing `"histogram"` or anything else raises a `ValueError`.

## What are yield-curve charts useful for?

- **Treasury / sovereign curves**: The canonical use. Render the on-the-run curve and watch its shape evolve from a normal upward slope to inversion.
- **Swap and forward curves**: Any term structure indexed by maturity rather than time fits naturally on this chart.
- **Volatility term structure**: Implied vol by tenor reads the same way as yield by tenor.
- **Cross-section snapshots**: Anything indexed by "horizon" (forward returns, expected payout) where comparing across maturities matters more than time evolution.

## Examples

### A basic yield curve

`tvl.data.yields()` is an 11-tenor snapshot with columns `Tenor` and `Yield`. `Tenor` is the maturity **in months** (3, 6, 12, 24, ... 480), the unit LWC's yield-curve axis expects. Pass `maturity="Tenor"` and `value="Yield"`, and set `start_time_range=480` so the initial viewport actually contains the long-end tenors (the LWC default is 120 months, which would clip everything past 10y to the right margin).

```python order=yield_curve,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.yields()

yield_curve = tvl.yield_curve(
    data,
    maturity="Tenor",
    value="Yield",
    start_time_range=480,
)
```

A single line traces the data from the short end (3m) to the long end (40y). The x-axis tick formatter renders the tenor values as `Xm` / `Xy` durations.

### Switch to an area rendering

`series_type="area"` swaps the line for a filled area. Pair it with `top_color`/`bottom_color` for a custom gradient, or leave the colors at their defaults.

```python order=yield_curve,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.yields()

yield_curve = tvl.yield_curve(
    data,
    maturity="Tenor",
    value="Yield",
    series_type="area",
    top_color="rgba(31, 119, 180, 0.45)",
    bottom_color="rgba(31, 119, 180, 0.0)",
    line_color="#1f77b4",
    start_time_range=480,
)
```

The gradient fades down to transparent so the area looks like a "rising tide" shape. Color kwargs accept a Deephaven theme color (e.g. `"positive"`, `"accent-300"`), a hex code, a named CSS color, or an `rgb()`/`rgba()` string. Theme colors adapt automatically when the user switches themes.

### Customize color and width (line mode)

In line mode, `color` is the line CSS color and `line_width` is the integer pixel width (1-4, default 3). `title` is the legend label.

```python order=yield_curve,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.yields()

yield_curve = tvl.yield_curve(
    data,
    maturity="Tenor",
    value="Yield",
    color="#d62728",
    line_width=1,
    title="UST par yield",
    start_time_range=480,
)
```

The line is now red, one pixel wide, with a custom legend entry.

### Tune the maturity axis

Three integer parameters control the maturity axis. They are all expressed in *months*, regardless of how your `maturity` column is labeled.

- `base_resolution`: the number of months represented by one base unit on the axis. Increase it to widen tick spacing on long-dated curves.
- `minimum_time_range`: the smallest axis span the chart will ever zoom to (in months). Stops zoom from going below this.
- `start_time_range`: the initial visible span in months.

```python order=yield_curve,data
import deephaven.plot.tradingview_lightweight as tvl
data = tvl.data.yields()

yield_curve = tvl.yield_curve(
    data,
    maturity="Tenor",
    value="Yield",
    base_resolution=12,
    minimum_time_range=24,
    start_time_range=480,
)
```

The chart opens showing 40 years of curve and won't zoom in past a 2-year window.

## API Reference

```{eval-rst}
.. dhautofunction:: deephaven.plot.tradingview_lightweight.yield_curve
```
