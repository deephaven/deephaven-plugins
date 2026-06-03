# Docs Feedback Tasks

Captured from user voice feedback. Work top to bottom.

## Data fixtures

- [ ] **Add an `EMA` column to the OHLC tvl example dataset.** The introduction
      example currently computes EMA inline; if `EMA` ships in the default
      dataset, the intro (and other examples) can skip the manual update.

## Area chart

- [ ] **Area chart top/bottom colors.** Today the example uses `orange.800` /
      `orange.600` for top/bottom. Change the bottom color to the literal
      string `"transparent"` so the fill fades cleanly to nothing.

- [ ] **"One area per group with `by`" renders blank.** Root cause: the
      example dataset has only `Timestamp` and `Price` columns, but the call
      uses `by="Sym"` — there's no `Sym` column to partition on.
      **Fix:** extend the example dataset to include a `Sym` column so the
      `by` partitioning actually has something to group on.

- [ ] **Missing `by` column should raise, not silently render blank.**
      Right now passing `by="Sym"` against a table with no `Sym` column
      produces an empty chart with no error. Investigate how deephaven /
      plotly-express handles a non-existent `by` column — does it raise a
      `KeyError`/`DHError` in Python at call time, or silently no-op?
      Match that behavior in tvl: prefer raising in Python early so the
      mistake is obvious instead of producing a blank widget.

## Line chart

- [ ] **"One line per group with `by`" is also broken** in the line-chart
      examples. Likely the same root cause as the area-chart `by` bug above —
      fix together.

## Custom-numeric charts

- [ ] **Custom-numeric x-axis is rendering as a datetime axis.** Every
      custom-numeric example we generated shows the x-axis as time (epoch
      1970 etc.) even though `x` is typed as the custom-numeric type.
      The whole custom-numeric chart family is affected — investigate the
      x-axis type plumbing on the JS side and make sure the numeric axis
      type actually flows through to the chart.

## Bar chart

- [ ] **Per-bar color example uses raw hex codes.** Switch to the semantic
      theme colors `positive` and `negative` instead of hex. **Verify those
      names are valid semantic-color tokens first** — if they're not, pick
      the closest valid semantic names and use those.

## Options chart + Yield curve

- [ ] **X-axis is wrong on both the options chart examples and the yield-curve
      examples.** The yield-curve image shows `1970` for the first tick and
      then `2 seconds, 3 seconds, 5 seconds, 7 seconds` — the bond maturities
      are being rendered as seconds-since-epoch. Numeric x-axis is being
      treated as datetime. Likely the same root cause as the custom-numeric
      issue above; fix together if so.

---

Start order suggested by the user: top of the list down.
