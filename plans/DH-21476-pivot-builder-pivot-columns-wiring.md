# DH-21476 — Pivot Builder: Pivot columns wiring

Phase 4 follow-up to
[DH-21476-pivot-builder-aggregate-values-wiring.md](./DH-21476-pivot-builder-aggregate-values-wiring.md).
Wires the **Pivot columns** card in `PivotConfigSection` so that turning
it on (with at least one selected column) creates a pivot table via
`model.pivotConfig` — composing with the existing Rollup-rows and
Aggregate-values cards.

## TL;DR

- **Pivot wins.** When the Pivot card is on AND `pivotColumns.length > 0`,
  build a `PivotConfig` and assign `model.pivotConfig = next`. The proxy
  swaps its inner model to an `IrisGridPivotModel` via
  `setNextModel(PivotService.createPivotTable(...))`. Otherwise behave
  exactly as today (rollup-vs-totals).
- **Rollup-rows feed pivot rowKeys.** When pivot is active the row-source
  for the pivot is `mockRollupRows` (the Rollup rows card selections),
  regardless of the Rollup rows card's on/off switch. The Rollup card UI
  still toggles whether a *rollup* would otherwise apply; when pivot is
  active that toggle is moot.
- **Aggregate values feed pivot aggregations.** Convert
  `AggregationSettings.aggregations` (`{ operation, selected }[]`) into
  the pivot service's `Record<string, string[]>` shape. Entries with
  empty `selected` are skipped. `invert` is ignored (no semantic in
  pivot service).
- When pivot is active, **clear** `model.rollupConfig` and
  `model.totalsConfig` — they would race the inner-model swap otherwise.
- Replace the Pivot card's mock `Add` handler with a real
  `ColumnPicker` (same component already used by Rollup rows).
- One combined effect in `CreatePivotPage` continues to own
  `pivotConfig` / `rollupConfig` / `totalsConfig`. No new effects.

## What's already in place

- `pivotBuilderModel.ts` exposes `PivotBuilderProxyModel` with a
  `pivotConfig: PivotConfig | null` setter that swaps the inner model
  (mirrors `rollupConfig`). Same path the Toolbar's existing
  `usePivotToggle` uses.
  ```ts
  interface PivotConfig {
    rowKeys: string[];
    columnKeys: string[];
    aggregations: Record<string, string[]>; // e.g. { Sum: ['price'] }
  }
  ```
- `PivotConfigSection` already owns `pivotColumns: string[]` +
  `pivotColumnsOn: boolean`, with a placeholder
  `handleAddPivotColumn` that only logs.
- `CreatePivotPage` already builds `columns` from `model.sourceTable`
  and holds `mockRollupRows`, `mockPivotColumns`, `aggregationSettings`,
  etc. The combined rollup/totals effect lives there.

## Activation rules

| Pivot toggle | `pivotColumns` | `mockRollupRows` | Result |
| --- | --- | --- | --- |
| off | * | * | Today's rollup/totals behaviour |
| on | empty | * | Today's rollup/totals behaviour (pivot inactive) |
| on | ≥1 | empty | Today's rollup/totals behaviour, **disable** the Pivot card's Add button-row with a hint *"Add at least one Rollup row"* — pivot needs row keys |
| on | ≥1 | ≥1 | **Pivot active.** Clear rollup+totals, set `model.pivotConfig` |

The "row keys come from the Rollup rows card" coupling is intentional
(matches the user request). The Rollup-rows on/off toggle has no effect
when pivot is active.

## Phase A — UI: real picker for Pivot columns

Edits to `PivotConfigSection.tsx`:

1. Add a local `pivotPickerOpen` state, mirroring `rollupPickerOpen`.
2. Replace `handleAddPivotColumn` with one that opens the picker.
3. Pass a `<ColumnPicker available={availableColumns}
   excluded={pivotColumns} onPick={...} onClose={...} />` to the
   `ConfigCard`'s `picker` prop (already supported).
4. Optional polish: pass `addDisabled` when the picker should be
   suppressed because rollup rows are empty (see "Activation rules").

No new types. No host changes.

## Phase B — Wire to `model.pivotConfig`

Edits to `CreatePivotPage.tsx`:

1. Add a tiny helper, inline (≤15 lines):
   ```ts
   function aggregationsToPivot(
     settings: AggregationSettings
   ): Record<string, string[]> {
     const out: Record<string, string[]> = {};
     for (const agg of settings.aggregations) {
       if (agg.selected.length === 0) continue;
       const op = String(agg.operation);
       out[op] = [...(out[op] ?? []), ...agg.selected];
     }
     return out;
   }
   ```
   Pivot service tolerates a missing aggregations entry only weakly;
   default to `{ Count: [] }` when `out` is empty (same fallback as
   `makeDefaultPivotConfig`).
2. Extend the combined effect's branching:
   ```ts
   const pivotActive =
     mockPivotColumnsOn &&
     mockPivotColumns.length > 0 &&
     mockRollupRows.length > 0;

   if (pivotActive) {
     const next: PivotConfig = {
       rowKeys: mockRollupRows,
       columnKeys: mockPivotColumns,
       aggregations:
         Object.keys(aggregationsToPivot(effectiveAggregationSettings))
           .length === 0
           ? { Count: [] }
           : aggregationsToPivot(effectiveAggregationSettings),
     };
     if (!deepEqual(next, model.pivotConfig)) {
       model.pivotConfig = next;
     }
     if (model.rollupConfig != null) model.rollupConfig = null;
     if (model.totalsConfig != null) model.totalsConfig = null;
     return;
   }

   // Pivot inactive — clear any prior pivot before falling through to
   // the existing rollup/totals logic.
   if (model.pivotConfig != null) {
     model.pivotConfig = null;
   }
   // ...existing rollupActive / standalone-totals branches unchanged
   ```
3. Add the new deps to the effect's dep array:
   `mockPivotColumnsOn, mockPivotColumns`.

Keep all assignments behind `deepEqual` guards to avoid re-creating the
pivot on unrelated re-renders (each `pivotConfig` write triggers a full
`PivotService.createPivotTable` round-trip).

## Phase C — Verification scenarios

| # | Setup | Expected |
| --- | --- | --- |
| 1 | Pivot off, Rollup on (cols), Agg off | Rollup, no totals (today) |
| 2 | Pivot off, Rollup off, Agg on (cols) | Source table + totals row (today) |
| 3 | Pivot off, Rollup on, Agg on | Rollup with folded aggs, no totals (today) |
| 4 | Pivot on, no pivot cols, Rollup on | Behaves as #1 (Pivot inactive) |
| 5 | Pivot on (cols), Rollup empty | Pivot inactive; Add button hint visible |
| 6 | Pivot on (cols), Rollup on (cols), Agg empty | Pivot table with `{Count:[]}` agg, no rollup, no totals row |
| 7 | Pivot on (cols), Rollup on (cols), Agg on (cols) | Pivot table with selected aggs, no rollup, no totals row |
| 8 | From #7 → toggle Pivot off | Falls back to rollup+aggs (scenario #3) without re-mounting the panel |
| 9 | From #7 → remove last Pivot col | Pivot inactive → behaves as #3 |
| 10 | From #7 → remove last Rollup row | Pivot inactive (no row keys) → behaves as #2 |
| 11 | Rapidly add/remove Pivot cols | No render storm (`deepEqual` guard); inner pivot is recreated at most once per debounce frame |

## Open questions / non-goals

- **Aggregation merging when same op repeats.** Current host
  `AggregationSettings` allows only one entry per `operation` (the
  picker excludes already-used ops). The helper above still merges
  defensively — cheap insurance, no behaviour change.
- **`showOnTop` ignored.** Pivot has no totals row, so
  `aggregationSettings.showOnTop` only affects the standalone-totals
  branch.
- **`invert` ignored.** Same reason — pivot service has no equivalent.
- **Seeding from existing `model.pivotConfig`.** Out of scope; the
  panel always starts with `mockPivotColumns = []` and lets the user
  build up. Can be added later by reading `model.pivotConfig?.columnKeys`
  in the initial `useState`.
- **Promote pivot-config helpers to a shared util.** Defer until a
  second consumer exists.
- **Pivot column picker placement vs viewport.** Reuse the existing
  flip-above logic from `AggregatePicker` if the bottom card's popover
  needs it — not expected with the smaller `ColumnPicker`.

## Files

### Modified — plugin

- `plugins/pivot-builder/src/js/src/PivotConfigSection.tsx`
  - Add `pivotPickerOpen` state + real `handleAddPivotColumn`.
  - Pass a `ColumnPicker` to the Pivot `ConfigCard`'s `picker` prop.
- `plugins/pivot-builder/src/js/src/CreatePivotPage.tsx`
  - Add `aggregationsToPivot` helper.
  - Extend the combined effect with a `pivotActive` branch and add
    `mockPivotColumns`, `mockPivotColumnsOn` to the dep array.
  - On `pivotActive == false`, ensure `model.pivotConfig` is cleared
    before re-applying rollup/totals.

### Not modified

- `pivotBuilderModel.ts` — already exposes `pivotConfig` + `sourceTable`.
- `web-client-ui/packages/iris-grid/**` — no host changes needed.
