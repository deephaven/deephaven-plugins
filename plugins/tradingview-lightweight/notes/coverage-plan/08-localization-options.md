# Implementation Plan: LocalizationOptionsBase Coverage

**Section:** 8 — LocalizationOptionsBase
**Status before this plan:** ⚠️ partial (only `priceFormatter` as named preset)
**Target status:** ✅ full coverage of feasible items; N/A items documented

---

## 1. Current State

The `localization` block of `LocalizationOptionsBase` is currently 1/5 covered.

### What exists

**Python side (`chart.py`, `options.py`):**

- `price_formatter: Optional[PriceFormatter] = None` is a parameter of `chart()`.
- `PriceFormatter` is a `Literal` type alias defined in `options.py`:
  ```python
  PriceFormatter = Literal[
      "currency_usd",
      "currency_eur",
      "currency_gbp",
      "currency_jpy",
      "percent",
      "compact",
      "scientific",
  ]
  ```
- Serialization (line ~493 of `chart.py`):
  ```python
  if price_formatter is not None:
      chart_options["localization"] = {"priceFormatterName": price_formatter}
  ```
- The JSON key is `priceFormatterName` — a non-standard sentinel key, **not** the TVL spec key `priceFormatter`, because a Python string cannot be sent as a JS function reference.

**JS side (`TradingViewChartRenderer.ts`):**

- A `PRICE_FORMATTERS` registry maps each named preset to an `(price: number) => string` closure.
- `resolveLocalization()` strips `priceFormatterName` and replaces it with the real `priceFormatter` function before passing options to `createChart()` / `applyOptions()`.
- The `localization` block is then spread together with a fixed `timeFormatter` (crosshair time display):
  ```ts
  localization: {
    timeFormatter: crosshairTimeFormatter,
    ...(chartOpts.localization as Record<string, unknown>),
  },
  ```

### What is missing

| TVL Property | Python Param | Status |
|---|---|:---:|
| `locale` | — | ❌ |
| `priceFormatter` | `price_formatter` (preset only) | ⚠️ |
| `tickmarksPriceFormatter` | — | ❌ |
| `percentageFormatter` | — | ❌ |
| `tickmarksPercentageFormatter` | — | ❌ |

---

## 2. Feasibility Analysis

### 2.1 `locale` — string pass-through

**Feasible: yes.** TVL's `locale` is a plain BCP-47 language tag string (e.g. `"en-US"`, `"de-DE"`, `"ja-JP"`). The browser applies it to its built-in date/number formatters. No JS function needed.

The Python layer just passes the value through unchanged. The JS side places it in the `localization` object that is merged into chart options.

### 2.2 `priceFormatter` — named preset approach (status quo)

**Approach: extend the existing preset registry.** The Python side sends `"priceFormatterName": "<preset>"` and the JS resolves it. This is clean and already battle-tested.

No JS callback mechanism is possible from Python (there is no live Python/JS bridge for arbitrary callables). The existing pattern of a server-side preset registry is the correct long-term approach.

**Extending:** new presets can be added to `PRICE_FORMATTERS` in `TradingViewChartRenderer.ts` and to the `PriceFormatter` Literal in `options.py`. No structural changes needed.

### 2.3 `tickmarksPriceFormatter` — named preset approach

**Feasible: yes, same pattern as `priceFormatter`.**

`tickmarksPriceFormatterFn` has the same signature as `PriceFormatterFn`:
```ts
type TickmarksPriceFormatterFn = (price: number) => string;
```
So the existing `PRICE_FORMATTERS` registry can be reused. The Python side sends a `tickmarksPriceFormatterName` sentinel key; the JS resolves it to the function using the same lookup table.

### 2.4 `percentageFormatter` — named preset approach

**Feasible: yes, same pattern.**

`PercentageFormatterFn` signature:
```ts
type PercentageFormatterFn = (percentage: number) => string;
```
Same shape as `PriceFormatterFn`, so the existing registry can serve double-duty. However, percentage values are semantically different (they represent `0–100` or `0.0–1.0` depending on context). A separate `PERCENTAGE_FORMATTERS` registry is cleaner and avoids confusion. See section 4.3.

### 2.5 `tickmarksPercentageFormatter` — named preset approach

**Feasible: yes, same pattern as `percentageFormatter`.** Python sends `tickmarksPercentageFormatterName`; JS resolves from `PERCENTAGE_FORMATTERS`.

### 2.6 JS callback from arbitrary Python — not feasible

There is no Deephaven IPC channel that can round-trip a live callable between the Python process and the browser. Even if serialized (e.g. as a lambda expression string), executing arbitrary code in the browser would be a security concern. The named-preset approach is the correct architecture for this plugin.

---

## 3. Parameter Design

### 3.1 New Python type aliases (`options.py`)

Add alongside the existing `PriceFormatter` Literal:

```text
# Preset names shared by price formatters, tickmarks-price formatters,
# and (optionally) percentage formatters that happen to share the same
# display logic as a price formatter.
TickmarksPriceFormatter = Literal[
    "currency_usd",
    "currency_eur",
    "currency_gbp",
    "currency_jpy",
    "percent",
    "compact",
    "scientific",
]

PercentageFormatter = Literal[
    "percent",  # "42.50%"
    "percent_1dp",  # "42.5%"
    "percent_0dp",  # "43%"
    "decimal",  # "0.4250" (raw ratio)
]

TickmarksPercentageFormatter = Literal[
    "percent",
    "percent_1dp",
    "percent_0dp",
    "decimal",
]
```

**Rationale:** `TickmarksPriceFormatter` shares its presets with `PriceFormatter` because both format price values. `PercentageFormatter` and `TickmarksPercentageFormatter` share their own preset set because percentage values have different display conventions.

Note: `PriceFormatter` and `TickmarksPriceFormatter` happen to be the same set of strings; they are separate type aliases for documentation clarity (IDEs will show the correct name in hover hints).

### 3.2 New `chart()` parameters (`chart.py`)

Add these four parameters to the `chart()` function signature in the `# Localization` section, immediately after `price_formatter`:

```text
# Localization
price_formatter: Optional[PriceFormatter] = (None,)
locale: Optional[str] = (None,)
tickmarks_price_formatter: Optional[TickmarksPriceFormatter] = (None,)
percentage_formatter: Optional[PercentageFormatter] = (None,)
tickmarks_percentage_formatter: Optional[TickmarksPercentageFormatter] = (None,)
```

**Naming convention:** follows the existing `snake_case` convention used by all other parameters. The JS camelCase equivalents are `locale`, `tickmarksPriceFormatter`, `percentageFormatter`, `tickmarksPercentageFormatter`.

### 3.3 JSON sentinel key names

All formatter parameters are non-standard sentinel keys (ending in `Name`) to distinguish them from the JS callable properties:

| Python param | Serialized JSON key |
|---|---|
| `price_formatter` | `localization.priceFormatterName` |
| `tickmarks_price_formatter` | `localization.tickmarksPriceFormatterName` |
| `percentage_formatter` | `localization.percentageFormatterName` |
| `tickmarks_percentage_formatter` | `localization.tickmarksPercentageFormatterName` |
| `locale` | `localization.locale` (passed through directly) |

The `locale` key requires no sentinel treatment — it is a plain string that TVL can use natively.

---

## 4. Serialization Logic (`chart.py`)

### 4.1 Imports

Add the new type aliases to the import from `.options`:

```text
from .options import (
    ChartType,
    CrosshairMode,
    LineStyle,
    LineType,
    PriceScaleMode,
    PriceFormatter,
    TickmarksPriceFormatter,  # NEW
    PercentageFormatter,  # NEW
    TickmarksPercentageFormatter,  # NEW
    CHART_TYPE_MAP,
    CROSSHAIR_MODE_MAP,
    LINE_STYLE_MAP,
    PRICE_SCALE_MODE_MAP,
)
```

### 4.2 Localization block replacement

Replace the current localization block (lines ~492–494):

```text
# Before (current):
if price_formatter is not None:
    chart_options["localization"] = {"priceFormatterName": price_formatter}
```

```text
# After:
loc: dict = {}
if price_formatter is not None:
    loc["priceFormatterName"] = price_formatter
if locale is not None:
    loc["locale"] = locale
if tickmarks_price_formatter is not None:
    loc["tickmarksPriceFormatterName"] = tickmarks_price_formatter
if percentage_formatter is not None:
    loc["percentageFormatterName"] = percentage_formatter
if tickmarks_percentage_formatter is not None:
    loc["tickmarksPercentageFormatterName"] = tickmarks_percentage_formatter
if loc:
    chart_options["localization"] = loc
```

This preserves the existing semantics: the `localization` key is absent when nothing is set. Multiple localization options can now coexist in the same dict.

---

## 5. JS Resolver Changes (`TradingViewChartRenderer.ts`)

### 5.1 New `PERCENTAGE_FORMATTERS` registry

Add after the existing `PRICE_FORMATTERS` block:

```ts
/**
 * Registry of predefined percentage formatters. Referenced by name
 * via `localization.percentageFormatterName` and
 * `localization.tickmarksPercentageFormatterName`.
 *
 * TVL passes the raw percentage value (e.g. 42.5 for 42.5%).
 */
const PERCENTAGE_FORMATTERS: Record<string, (percentage: number) => string> = {
  percent: (pct: number) => `${pct.toFixed(2)}%`,
  percent_1dp: (pct: number) => `${pct.toFixed(1)}%`,
  percent_0dp: (pct: number) => `${Math.round(pct)}%`,
  decimal: (pct: number) => (pct / 100).toFixed(4),
};
```

### 5.2 Extended `resolveLocalization()` function

Replace the existing `resolveLocalization()` with a version that handles all four formatter sentinel keys:

```ts
/**
 * Resolve named formatter sentinels into real JS functions.
 *
 * The Python API cannot send callable values, so it sends sentinel string
 * keys ending in "Name" (e.g. `priceFormatterName`). This function strips
 * those keys and replaces them with the actual function references that
 * TradingView Lightweight Charts expects.
 *
 * `locale` is a plain string pass-through — no transformation needed.
 */
function resolveLocalization(
  opts: Record<string, unknown>
): Record<string, unknown> {
  const { localization: locRaw, ...rest } = opts;
  if (locRaw == null) return opts;

  const loc = locRaw as Record<string, unknown>;
  const {
    priceFormatterName,
    tickmarksPriceFormatterName,
    percentageFormatterName,
    tickmarksPercentageFormatterName,
    ...locRest
  } = loc;

  const resolved: Record<string, unknown> = { ...locRest };

  if (
    typeof priceFormatterName === 'string' &&
    PRICE_FORMATTERS[priceFormatterName]
  ) {
    resolved.priceFormatter = PRICE_FORMATTERS[priceFormatterName];
  } else if (priceFormatterName != null) {
    // Unknown preset: preserve sentinel so callers can detect misconfiguration
    resolved.priceFormatterName = priceFormatterName;
  }

  if (
    typeof tickmarksPriceFormatterName === 'string' &&
    PRICE_FORMATTERS[tickmarksPriceFormatterName]
  ) {
    resolved.tickmarksPriceFormatter =
      PRICE_FORMATTERS[tickmarksPriceFormatterName];
  } else if (tickmarksPriceFormatterName != null) {
    resolved.tickmarksPriceFormatterName = tickmarksPriceFormatterName;
  }

  if (
    typeof percentageFormatterName === 'string' &&
    PERCENTAGE_FORMATTERS[percentageFormatterName]
  ) {
    resolved.percentageFormatter = PERCENTAGE_FORMATTERS[percentageFormatterName];
  } else if (percentageFormatterName != null) {
    resolved.percentageFormatterName = percentageFormatterName;
  }

  if (
    typeof tickmarksPercentageFormatterName === 'string' &&
    PERCENTAGE_FORMATTERS[tickmarksPercentageFormatterName]
  ) {
    resolved.tickmarksPercentageFormatter =
      PERCENTAGE_FORMATTERS[tickmarksPercentageFormatterName];
  } else if (tickmarksPercentageFormatterName != null) {
    resolved.tickmarksPercentageFormatterName = tickmarksPercentageFormatterName;
  }

  return { ...rest, localization: resolved };
}
```

**Important:** the `locale` key in `locRest` is carried through unchanged via the spread, so it passes directly to TVL.

No other changes to the renderer constructor or `applyOptions()` are needed — they both already call `resolveLocalization()`.

---

## 6. Files to Change

| File | Change |
|---|---|
| `src/deephaven/plot/tradingview_lightweight/options.py` | Add `TickmarksPriceFormatter`, `PercentageFormatter`, `TickmarksPercentageFormatter` Literals |
| `src/deephaven/plot/tradingview_lightweight/chart.py` | Add 4 new params; replace localization block; update imports |
| `src/js/src/TradingViewChartRenderer.ts` | Add `PERCENTAGE_FORMATTERS`; rewrite `resolveLocalization()` |
| `test/deephaven/plot/tradingview_lightweight/test_chart.py` | Add Python unit tests (see section 7) |
| `src/js/src/__tests__/TradingViewChartRenderer.test.ts` | Add JS unit tests (see section 8) |

No changes needed to:
- `TradingViewChart.tsx` — options flow through unchanged
- `TradingViewTypes.ts` — no new type surface
- `TradingViewChartModel.ts` — model is data-only, not options-aware
- Convenience functions (`line()`, `candlestick()`, etc.) — these are thin wrappers; localization options are chart-level, not series-level. There is no plan to thread localization through the convenience functions since they already forward to `chart()` via `**chart_kwargs`. If needed in the future, callers can use `chart()` directly.

---

## 7. Python Unit Tests (`test_chart.py`)

Add a new `TestLocalizationOptions` test class (or extend `TestChartFunction`). All tests follow the pattern: construct a `chart()`, inspect `c.chart_options["localization"]`.

### 7.1 `locale` tests

```text
def test_locale_string(self):
    """locale is passed through as-is into localization.locale."""
    s = line_series(self.table)
    c = chart(s, locale="de-DE")
    loc = c.chart_options["localization"]
    self.assertEqual(loc["locale"], "de-DE")


def test_locale_not_set_by_default(self):
    s = line_series(self.table)
    c = chart(s)
    self.assertNotIn("localization", c.chart_options)


def test_locale_various_tags(self):
    """Spot-check that any BCP-47 tag is accepted (no validation)."""
    for tag in ["en-US", "ja-JP", "zh-CN", "fr-FR", "ar-SA"]:
        s = line_series(self.table)
        c = chart(s, locale=tag)
        self.assertEqual(c.chart_options["localization"]["locale"], tag)
```

### 7.2 `tickmarks_price_formatter` tests

```text
def test_tickmarks_price_formatter(self):
    s = line_series(self.table)
    c = chart(s, tickmarks_price_formatter="currency_usd")
    loc = c.chart_options["localization"]
    self.assertEqual(loc["tickmarksPriceFormatterName"], "currency_usd")


def test_tickmarks_price_formatter_not_set_by_default(self):
    s = line_series(self.table)
    c = chart(s)
    self.assertNotIn("localization", c.chart_options)


def test_all_tickmarks_price_formatter_presets(self):
    presets = [
        "currency_usd",
        "currency_eur",
        "currency_gbp",
        "currency_jpy",
        "percent",
        "compact",
        "scientific",
    ]
    s = line_series(self.table)
    for preset in presets:
        c = chart(s, tickmarks_price_formatter=preset)
        self.assertEqual(
            c.chart_options["localization"]["tickmarksPriceFormatterName"],
            preset,
        )
```

### 7.3 `percentage_formatter` tests

```text
def test_percentage_formatter(self):
    s = line_series(self.table)
    c = chart(s, percentage_formatter="percent")
    loc = c.chart_options["localization"]
    self.assertEqual(loc["percentageFormatterName"], "percent")


def test_all_percentage_formatter_presets(self):
    presets = ["percent", "percent_1dp", "percent_0dp", "decimal"]
    s = line_series(self.table)
    for preset in presets:
        c = chart(s, percentage_formatter=preset)
        self.assertEqual(
            c.chart_options["localization"]["percentageFormatterName"],
            preset,
        )
```

### 7.4 `tickmarks_percentage_formatter` tests

```text
def test_tickmarks_percentage_formatter(self):
    s = line_series(self.table)
    c = chart(s, tickmarks_percentage_formatter="percent_1dp")
    loc = c.chart_options["localization"]
    self.assertEqual(loc["tickmarksPercentageFormatterName"], "percent_1dp")
```

### 7.5 Combined localization tests

```text
def test_locale_with_price_formatter(self):
    """locale and price_formatter can coexist in the same localization dict."""
    s = line_series(self.table)
    c = chart(s, locale="en-GB", price_formatter="currency_gbp")
    loc = c.chart_options["localization"]
    self.assertEqual(loc["locale"], "en-GB")
    self.assertEqual(loc["priceFormatterName"], "currency_gbp")


def test_all_localization_options_combined(self):
    """All five localization options together produce a single dict."""
    s = line_series(self.table)
    c = chart(
        s,
        locale="de-DE",
        price_formatter="currency_eur",
        tickmarks_price_formatter="compact",
        percentage_formatter="percent_1dp",
        tickmarks_percentage_formatter="percent_0dp",
    )
    loc = c.chart_options["localization"]
    self.assertEqual(loc["locale"], "de-DE")
    self.assertEqual(loc["priceFormatterName"], "currency_eur")
    self.assertEqual(loc["tickmarksPriceFormatterName"], "compact")
    self.assertEqual(loc["percentageFormatterName"], "percent_1dp")
    self.assertEqual(loc["tickmarksPercentageFormatterName"], "percent_0dp")


def test_localization_absent_when_nothing_set(self):
    """localization key must not appear when no localization param is given."""
    s = line_series(self.table)
    c = chart(s)
    self.assertNotIn("localization", c.chart_options)
```

### 7.6 Regression test: existing `price_formatter` still works

This test already exists (`test_price_formatter` and `test_price_formatter_not_set_by_default`). Confirm they still pass after refactoring the serialization block.

---

## 8. JS Unit Tests (`TradingViewChartRenderer.test.ts`)

Add a new `describe` block `'localization — extended options'` inside the existing `describe('TradingViewChartRenderer')`.

### 8.1 `locale` pass-through

```ts
describe('locale pass-through', () => {
  it('should pass locale string directly to createChart', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { locale: 'de-DE' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    expect(opts.localization.locale).toBe('de-DE');
  });

  it('should preserve locale when priceFormatterName is also set', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { locale: 'en-GB', priceFormatterName: 'currency_gbp' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    expect(opts.localization.locale).toBe('en-GB');
    expect(typeof opts.localization.priceFormatter).toBe('function');
    expect(opts.localization.priceFormatterName).toBeUndefined();
  });
});
```

### 8.2 `tickmarksPriceFormatterName` resolution

```ts
describe('tickmarksPriceFormatter resolution', () => {
  it('should resolve tickmarksPriceFormatterName to a function', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { tickmarksPriceFormatterName: 'compact' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    expect(typeof opts.localization.tickmarksPriceFormatter).toBe('function');
    expect(opts.localization.tickmarksPriceFormatterName).toBeUndefined();
  });

  it('compact tickmarksPriceFormatter formats values correctly', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { tickmarksPriceFormatterName: 'compact' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    const fmt = opts.localization.tickmarksPriceFormatter;
    expect(fmt(1500)).toBe('1.5K');
    expect(fmt(2500000)).toBe('2.5M');
  });

  it('should resolve all price formatter presets for tickmarksPriceFormatter', () => {
    const presets = [
      'currency_usd', 'currency_eur', 'currency_gbp', 'currency_jpy',
      'percent', 'compact', 'scientific',
    ];
    presets.forEach(preset => {
      jest.clearAllMocks();
      const container = document.createElement('div');
      new TradingViewChartRenderer(container, {
        localization: { tickmarksPriceFormatterName: preset },
      } as never);
      const opts = createChart.mock.calls[0][1];
      expect(typeof opts.localization.tickmarksPriceFormatter).toBe(
        'function',
        `preset ${preset} should resolve`
      );
    });
  });

  it('should preserve unknown preset as sentinel', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { tickmarksPriceFormatterName: 'nonexistent' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    expect(opts.localization.tickmarksPriceFormatterName).toBe('nonexistent');
    expect(opts.localization.tickmarksPriceFormatter).toBeUndefined();
  });
});
```

### 8.3 `percentageFormatterName` resolution

```ts
describe('percentageFormatter resolution', () => {
  it('should resolve percentageFormatterName to a function', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { percentageFormatterName: 'percent' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    expect(typeof opts.localization.percentageFormatter).toBe('function');
    expect(opts.localization.percentageFormatterName).toBeUndefined();
  });

  it('percent formatter formats to 2dp with % sign', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { percentageFormatterName: 'percent' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    const fmt = opts.localization.percentageFormatter;
    expect(fmt(42.5)).toBe('42.50%');
    expect(fmt(100)).toBe('100.00%');
    expect(fmt(0)).toBe('0.00%');
  });

  it('percent_1dp formatter formats to 1dp', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { percentageFormatterName: 'percent_1dp' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    const fmt = opts.localization.percentageFormatter;
    expect(fmt(42.55)).toBe('42.6%');
  });

  it('percent_0dp formatter rounds to integer', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { percentageFormatterName: 'percent_0dp' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    const fmt = opts.localization.percentageFormatter;
    expect(fmt(42.6)).toBe('43%');
  });

  it('decimal formatter expresses percentage as ratio', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { percentageFormatterName: 'decimal' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    const fmt = opts.localization.percentageFormatter;
    expect(fmt(42.5)).toBe('0.4250');
  });
});
```

### 8.4 `tickmarksPercentageFormatterName` resolution

```ts
describe('tickmarksPercentageFormatter resolution', () => {
  it('should resolve tickmarksPercentageFormatterName to a function', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { tickmarksPercentageFormatterName: 'percent_1dp' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    expect(typeof opts.localization.tickmarksPercentageFormatter).toBe('function');
    expect(opts.localization.tickmarksPercentageFormatterName).toBeUndefined();
  });

  it('should preserve unknown preset as sentinel', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: { tickmarksPercentageFormatterName: 'bogus' },
    } as never);

    const opts = createChart.mock.calls[0][1];
    expect(opts.localization.tickmarksPercentageFormatterName).toBe('bogus');
    expect(opts.localization.tickmarksPercentageFormatter).toBeUndefined();
  });
});
```

### 8.5 All options combined

```ts
describe('all localization options combined', () => {
  it('should resolve all formatters and preserve locale in one pass', () => {
    const container = document.createElement('div');
    new TradingViewChartRenderer(container, {
      localization: {
        locale: 'de-DE',
        priceFormatterName: 'currency_eur',
        tickmarksPriceFormatterName: 'compact',
        percentageFormatterName: 'percent_1dp',
        tickmarksPercentageFormatterName: 'percent_0dp',
      },
    } as never);

    const opts = createChart.mock.calls[0][1];
    const loc = opts.localization;
    expect(loc.locale).toBe('de-DE');
    expect(typeof loc.priceFormatter).toBe('function');
    expect(typeof loc.tickmarksPriceFormatter).toBe('function');
    expect(typeof loc.percentageFormatter).toBe('function');
    expect(typeof loc.tickmarksPercentageFormatter).toBe('function');
    // Sentinels must be stripped
    expect(loc.priceFormatterName).toBeUndefined();
    expect(loc.tickmarksPriceFormatterName).toBeUndefined();
    expect(loc.percentageFormatterName).toBeUndefined();
    expect(loc.tickmarksPercentageFormatterName).toBeUndefined();
    // timeFormatter must still be present (set by renderer constructor)
    expect(typeof loc.timeFormatter).toBe('function');
  });

  it('should resolve all formatters via applyOptions too', () => {
    const renderer = createRenderer();
    renderer.applyOptions({
      localization: {
        locale: 'ja-JP',
        percentageFormatterName: 'percent',
      },
    } as never);

    const appliedOpts = mockChart.applyOptions.mock.calls[0][0];
    expect(appliedOpts.localization.locale).toBe('ja-JP');
    expect(typeof appliedOpts.localization.percentageFormatter).toBe('function');
  });
});
```

---

## 9. Complete Usage Examples

### 9.1 Locale only

```text
import deephaven.plot.tradingview_lightweight as tvl

c = tvl.chart(
    tvl.line_series(table),
    locale="de-DE",
)
```

Result: dates on the time axis are formatted using German locale conventions. TVL's built-in date formatter consumes `locale` directly.

### 9.2 Price formatter with locale

```text
c = tvl.chart(
    tvl.candlestick_series(table),
    locale="en-GB",
    price_formatter="currency_gbp",
)
```

Result: price axis and crosshair label show `£1,234.56`; date format uses British English.

### 9.3 Different formatters for axis labels vs. crosshair label

TVL uses `priceFormatter` for the crosshair price label and `tickmarksPriceFormatter` for the tick marks on the price scale axis. To show compact notation on axis ticks but full currency on the crosshair:

```text
c = tvl.chart(
    tvl.line_series(table),
    price_formatter="currency_usd",  # crosshair: "$1,234.56"
    tickmarks_price_formatter="compact",  # axis ticks: "1.2K"
)
```

### 9.4 Percentage chart

When `right_price_scale_mode="percentage"` is set, TVL shows percentage values. Custom formatters control their display:

```text
c = tvl.chart(
    tvl.line_series(table),
    right_price_scale_mode="percentage",
    percentage_formatter="percent_1dp",  # crosshair: "42.5%"
    tickmarks_percentage_formatter="percent_0dp",  # axis ticks: "43%"
)
```

### 9.5 Full localization

```text
c = tvl.chart(
    tvl.candlestick_series(table),
    locale="ja-JP",
    price_formatter="currency_jpy",
    tickmarks_price_formatter="compact",
    percentage_formatter="percent",
    tickmarks_percentage_formatter="percent_0dp",
)
```

---

## 10. Implementation Order

1. **`options.py`** — add `TickmarksPriceFormatter`, `PercentageFormatter`, `TickmarksPercentageFormatter` Literals. No logic changes.
2. **`chart.py`** — update imports; add 4 new parameters; replace localization serialization block with the multi-key version.
3. **`TradingViewChartRenderer.ts`** — add `PERCENTAGE_FORMATTERS`; rewrite `resolveLocalization()` to handle all four sentinels. The constructor and `applyOptions()` are unchanged.
4. **`test_chart.py`** — add Python tests from section 7.
5. **`TradingViewChartRenderer.test.ts`** — add JS tests from section 8.
6. Run `$PY -m pytest test/ -v` and `cd src/js && npx jest --verbose` and `npx tsc --noEmit` to confirm all pass.

---

## 11. Edge Cases and Constraints

- **`locale` validation:** Python does not validate the BCP-47 tag. Invalid tags will silently fall back to `navigator.language` in the browser. This is consistent with TVL's own behavior and acceptable for a configuration layer.
- **Preset case-sensitivity:** All preset names are lowercase with underscores. The `PriceFormatter` Literal enforces this at type-check time; the `PRICE_FORMATTERS` / `PERCENTAGE_FORMATTERS` registries use the same keys. A typo at runtime (e.g. from `**kwargs`) would produce a key not in the registry; `resolveLocalization()` preserves the sentinel key unchanged (so a warning can be logged by the developer inspecting chart options).
- **`timeFormatter` always present:** The renderer constructor always sets `localization.timeFormatter = crosshairTimeFormatter`. This is spread *before* the user's `localization` object, so if the user somehow passes a `timeFormatter` in their options it would be overridden (the user options spread comes last). This is intentional and must not change.
- **No change to `deepMerge` behavior:** `deepMerge` in `TradingViewChart.tsx` merges theme options with user options. The `localization` sub-object is a plain object (no functions at merge time — all functions are added by `resolveLocalization()` inside the renderer, after the merge). This ordering is correct and requires no change.
- **Percentage formatter value convention:** TVL passes the percentage value as a raw percentage (e.g. `42.5` means 42.5%), not a ratio. The `decimal` preset divides by 100 accordingly. Document this in code comments.
- **`applyOptions` path:** `resolveLocalization()` is called from both the constructor and `applyOptions()`, so all four formatters work equally well when chart options are updated after construction (e.g. on theme change).

---

## 12. Not in Scope

- **JS-side callable formatters from Python:** no mechanism exists to transport a Python callable to the browser. This is a fundamental architectural constraint.
- **Custom locale-aware formatters:** a user wanting `"fr-FR"` currency formatting currently needs to use a preset that hardcodes the locale (like `currency_eur`). Adding more locale-parameterized presets (e.g. `"currency_eur_fr"`) is a future extension not covered here.
- **`createChartEx` / custom horizontal scale behavior:** unrelated to localization.
- **`TickMarkType`-aware price formatters:** the `tickmarksPriceFormatter` receives only `(price: number) => string`, not `(price, tickMarkType) => string`. No `TickMarkType` discrimination is needed.
