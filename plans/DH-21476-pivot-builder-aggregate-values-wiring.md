# DH-21476 — Pivot Builder: Aggregate values wiring

Phase 3 follow-up to
[DH-21476-pivot-builder-rollup-rows-wiring.md](./DH-21476-pivot-builder-rollup-rows-wiring.md).
Wires the **Aggregate values** card in `PivotConfigSection` to the
underlying `IrisGridModel` so it works:

1. **standalone** (no rollup, no pivot) → totals row at top/bottom, and
2. **with rollup** (and later, with pivot) → aggregations merged into the
   rollup config.

Pivot composition is deferred to its own phase. This doc explicitly
ignores `pivotConfig` — when both pivot and aggregates are on, the
aggregates card just behaves as if no pivot were present.

## TL;DR

- Card state shape changes from "list of aggregate entries" (one fn +
  many columns each) to the host-native [`AggregationSettings`][1]
  shape (one operation per entry + ordered list). This unlocks reuse of
  `IrisGridUtils.getModelRollupConfig` and the existing operation-map
  builders.
- New sync effect in `CreatePivotPage` keyed on
  `[model, aggregatesOn, aggregationSettings, rollupRowsOn, mockRollupRows, …]`
  decides each render whether to push to `model.totalsConfig` (no
  rollup) or to fold into `model.rollupConfig` (rollup active), then
  clears the other.
- `AggregateRow` UI gains an inline expand that lets the user pick
  operation + columns; "Edit" opens it (no separate modal). Picker
  reuses the `ColumnPicker` introduced in the rollup-rows phase.
- Effect runs guarded by `deepEqual` to avoid resetting the model on
  every render.

## Background — how IrisGrid wires aggregations today

Two model surfaces, both abstract on
[`IrisGridModel`](../../web-client-ui/packages/iris-grid/src/IrisGridModel.ts):

| Property              | Standalone aggregations? | Combined with rollup? |
| --------------------- | ------------------------ | --------------------- |
| `model.totalsConfig`  | yes (totals row)         | **must be cleared**   |
| `model.rollupConfig`  | n/a                      | yes (folded in)       |

`IrisGrid.tsx` composes both in [`getModelTotalsConfig`][2] and
[`getModelRollupConfig`][3], then `IrisGridModelUpdater` assigns them.
Critically: when rollup is on, `getModelTotalsConfig` returns `null` —
i.e. **rollup wins** and the totals row is suppressed.

Source-of-truth state:
[`AggregationSettings`](../../web-client-ui/packages/iris-grid/src/sidebar/aggregations/Aggregations.tsx):

```ts
type Aggregation = {
  operation: AggregationOperation; // "Sum" | "Avg" | "Min" | …
  selected: readonly string[];     // column names
  invert: boolean;                  // when true, selected = excluded
};
type AggregationSettings = {
  aggregations: readonly Aggregation[];
  showOnTop: boolean;
};
```

Two helpers from `IrisGrid` we will need (or re-implement small pieces
of):

- `getOperationMap(columns, aggregations) → { [columnName]: operation[] }`
  builds the per-column op array used by `UITotalsTableConfig`.
- `getOperationOrder(aggregations) → operation[]` preserves user order.

Both currently live as instance methods on `IrisGrid` and aren't
exported. We can either:

1. **Re-implement them inline in the plugin** (≤20 lines each, no
   external deps), or
2. Push for promoting them to `IrisGridUtils` in `web-client-ui` first.

Recommended: option 1 for now, with a `TODO(DH-21476): promote to
IrisGridUtils` comment. The current PR thread is already touching
iris-grid surface — defer the host change to avoid scope creep.

## Phase A — Reshape card state (purely refactor, no behaviour change)

Today's card state per entry is:

```ts
type AggregateEntry = { id; fn: string; columns: string[] };
```

This 1:many shape matches the design mock but **does not match
`Aggregation`**, which is 1:1 (one operation per entry, columns
multi-select). The mock UI groups by operation purely for display.

Change `PivotConfigSection.tsx` so the props are:

```ts
aggregationSettings: AggregationSettings;
onAggregationSettingsChange: (next: AggregationSettings) => void;
aggregatesOn: boolean;
onAggregatesOnChange: (next: boolean) => void;
```

Inside the card we keep rendering one row per `Aggregation` entry,
labelled `${operation} (${selected.join(', ')})`. `Add` opens an
operation picker (reuse `ColumnPicker` with the list of
`AggregationOperation` values minus already-used ones — matches
existing `Aggregations.tsx` UX). `Edit` toggles an inline expand below
the row with two controls:

- operation `<Select>` (limited to ops not already used by other rows)
- column multi-select via repeated `ColumnPicker` add-rows

Drop the old `{ id, fn, columns }` shape. `id` is no longer needed —
`Aggregation` has no id, and `Aggregations.tsx` keys by index.

## Phase B — Wire to model

Add state in `CreatePivotPage.tsx`:

```ts
const [aggregationSettings, setAggregationSettings] =
  useState<AggregationSettings>({ aggregations: [], showOnTop: false });
const [aggregatesOn, setAggregatesOn] = useState(true);
```

Add a new `useEffect` keyed on
`[model, aggregatesOn, aggregationSettings, rollupRowsOn, mockRollupRows,
  mockIncludeConstituents, mockNonAggregatedInRollup]`.

Pseudocode:

```ts
useEffect(() => {
  if (!isPivotBuilderIrisGridModel(model)) return;

  const aggsActive =
    aggregatesOn &&
    aggregationSettings.aggregations.some(
      a => a.selected.length > 0 || a.invert
    );
  const rollupActive = rollupRowsOn && mockRollupRows.length > 0;

  // Rollup wins → fold aggregates into rollupConfig, clear totals.
  if (rollupActive) {
    const uiConfig: UIRollupConfig = { /* same as today */ };
    const merged = IrisGridUtils.getModelRollupConfig(
      model.sourceTable.columns,
      uiConfig,
      aggsActive ? aggregationSettings : { aggregations: [], showOnTop: false }
    );
    if (!deepEqual(merged, model.rollupConfig)) {
      model.rollupConfig = merged;
    }
    if (model.totalsConfig != null) {
      model.totalsConfig = null;
    }
    return;
  }

  // No rollup → push standalone totalsConfig, clear rollupConfig.
  if (model.rollupConfig != null) {
    model.rollupConfig = null;
  }
  if (!aggsActive) {
    if (model.totalsConfig != null) model.totalsConfig = null;
    return;
  }
  const operationMap = buildOperationMap(
    model.sourceTable.columns,
    aggregationSettings.aggregations
  );
  const next: UITotalsTableConfig = {
    operationMap,
    operationOrder: buildOperationOrder(aggregationSettings.aggregations),
    showOnTop: aggregationSettings.showOnTop,
    defaultOperation: AggregationOperation.SKIP,
  };
  if (!deepEqual(next, model.totalsConfig)) {
    model.totalsConfig = next;
  }
}, [/* deps above */]);
```

The **existing** rollup-rows effect from Phase 1 then needs to either be
folded into this combined effect, or deleted (preferred — one effect
owning both `rollupConfig` and `totalsConfig` is easier to reason about
than two effects fighting).

Add small local helpers (≤30 lines total) in a new
`plugins/pivot-builder/src/js/src/aggregationUtils.ts`:

```ts
export function buildOperationMap(
  columns: readonly dh.Column[],
  aggregations: readonly Aggregation[]
): { [columnName: string]: AggregationOperation[] };

export function buildOperationOrder(
  aggregations: readonly Aggregation[]
): AggregationOperation[];
```

Port logic from `IrisGrid.getOperationMap` /
`getOperationOrder`. Both are pure and tiny — re-implementing is faster
than threading them through `IrisGridUtils`.

Note on the `showNonAggregatedColumns` flag: today we hard-code
`true` in the rollup-rows effect. When `aggregateValues` is on and the
user wants a tight rollup (no `First` synthesised columns), they should
flip the existing "Non-aggregated in rollup rows" checkbox. The flag
keeps working unchanged.

## Phase C — Verification

| # | Scenario                       | Expected                                  |
| - | ------------------------------ | ----------------------------------------- |
| 1 | Aggregates ON only             | Totals row appears (top/bottom per `showOnTop`) |
| 2 | Aggregates OFF, rollup ON      | Rollup with auto-`First` (today's behaviour) |
| 3 | Both ON                        | Rollup hierarchy with user-defined aggregations folded in; no totals row |
| 4 | Both OFF                       | Flat source table                         |
| 5 | Aggregates ON → toggle rollup ON | Totals row vanishes, rollup picks up the aggregations |
| 6 | Aggregates ON → flip a row's columns | Totals row recomputes (no re-render storm) |
| 7 | Aggregates row with empty `selected` & `invert=false` | Treated as inactive; no model push |

All exercised via the existing test table from the docker python startup
(`PivotData`) — no new test plumbing required.

## Risks / open questions

- **Operation list to expose.** `SELECTABLE_OPTIONS` in `AggregationUtils`
  is the IrisGrid sidebar's curated list. Reuse it verbatim, or
  define our own subset? Recommended: reuse — keeps parity with
  IrisGrid behaviour (e.g. MEDIAN feature-flag).
- **`Aggregation.invert`**. The mock UI has no invert toggle. Initial
  implementation will hard-code `invert: false`. Revisit if/when we
  add an "All columns" affordance to the column picker.
- **`showOnTop`**. No UI yet. Reuse the existing "showOnTop" checkbox
  pattern from `Aggregations.tsx` — add as a third toggle in the
  bottom-of-section checkbox group, or as a card-header control. TBD,
  defer until Phase B works.
- **Persistence.** Like rollupConfig, `totalsConfig` is currently not
  persisted via the plugin's `usePersistentState`. Same TODO as the
  rollup phase.
- **Pivot composition.** When pivot lands, the effect will need a
  third branch (`pivotActive && aggsActive` → fold into `pivotConfig`).
  Effect structure already handles this cleanly: add another
  early-return at the top.
- **Promoting `buildOperationMap` / `buildOperationOrder`** to
  `IrisGridUtils` should be done before this plugin ships externally.
  File a follow-up DH ticket; not blocking.

## Files touched

- `plugins/pivot-builder/src/js/src/PivotConfigSection.tsx` —
  reshape aggregate state to `AggregationSettings`, swap
  `AggregateRow` to inline expand, reuse `ColumnPicker`.
- `plugins/pivot-builder/src/js/src/CreatePivotPage.tsx` — replace
  Phase 1 rollup-only effect with combined rollup+totals effect; pass
  new props down.
- `plugins/pivot-builder/src/js/src/aggregationUtils.ts` (new) —
  ported `buildOperationMap` / `buildOperationOrder` + the bail
  predicate `isAggregationActive`.

[1]: ../../web-client-ui/packages/iris-grid/src/sidebar/aggregations/Aggregations.tsx
[2]: ../../web-client-ui/packages/iris-grid/src/IrisGrid.tsx#L1491
[3]: ../../web-client-ui/packages/iris-grid/src/IrisGrid.tsx#L1477
