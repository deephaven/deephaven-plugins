# DH-21476 (phase): Wire Rollup Rows UI to `model.rollupConfig`

Follow-up to [DH-21476-pivot-builder-config-ui.md](./DH-21476-pivot-builder-config-ui.md).
That phase landed the mock card-based config panel
([PivotConfigSection.tsx](../plugins/pivot-builder/src/js/src/PivotConfigSection.tsx)).
This phase wires only the **Rollup rows** card (plus the two footer
checkboxes) to the host's existing rollup pipeline so the table
actually re-renders as a rollup when the user adds/removes columns.

Pivot columns, Aggregate values, and Add filterable columns remain
mock-only for now.

## TL;DR

- Build a `UIRollupConfig` from the Rollup-rows card state and assign it
  to `model.rollupConfig` (the host's `IrisGridProxyModel` already
  knows how to swap to `table.rollup(...)` — same path the existing
  Rollup Rows sidebar uses).
- Use the already-exported helpers from `@deephaven/iris-grid`:
  `UIRollupConfig`, `AggregationSettings`, `AggregationOperation`,
  `IrisGridUtils.getModelRollupConfig`. No new exports needed.
- Rollup and Pivot are **not** mutually exclusive. Rollup rows is
  wired in this phase; Pivot columns stays mock-only and will be
  composed with Rollup in a later phase.
- Comment out the existing pivot-builder column selectors (Row keys /
  Column keys / Aggregation function / Columns / Apply / Reset) below
  the new cards — they are being replaced by the card UI and the
  duplicate controls are now misleading. Keep the JSX in place behind
  a comment so the wiring is easy to revive while we iterate.
- Replace the Rollup-rows "Add" placeholder picker with a real
  column-name dropdown so the value matches `model.columns`.
- Seed the card from `model.rollupConfig` on mount so the UI reflects
  the persisted/applied state.

## What web-client-ui already exposes (verified)

From `@deephaven/iris-grid`:
- `UIRollupConfig` — `{ columns, showConstituents, showNonAggregatedColumns, includeDescriptions }`
  ([sidebar/RollupRows.tsx](https://github.com/deephaven/web-client-ui/blob/vlad-DH-21476-table-options/packages/iris-grid/src/sidebar/RollupRows.tsx)).
- `IrisGridUtils.getModelRollupConfig(originalColumns, config, aggregationSettings)` →
  `dh.RollupConfig | null`
  ([IrisGridUtils.ts](https://github.com/deephaven/web-client-ui/blob/vlad-DH-21476-table-options/packages/iris-grid/src/IrisGridUtils.ts)).
- `AggregationSettings`, `Aggregation`, `AggregationOperation`,
  `AggregationUtils` — from `sidebar/aggregations`.
- `IrisGridModel.rollupConfig` setter (abstract; implemented by
  `IrisGridProxyModel` → calls `table.rollup(rollupConfig)` and
  `setNextModel`).

**No web-client-ui changes are required for this phase.**

If we later expose the Aggregate-values card we'll likely want a helper
that builds the `AggregationSettings.aggregations` array from our
`AggregateEntry[]`; that can stay plugin-side for now since
`AggregationOperation` enum values + `AggregationUtils` are already
exported.

## Files

### Modified — plugin

- `plugins/pivot-builder/src/js/src/CreatePivotPage.tsx`
  - Seed `mockRollupRows` / `mockIncludeConstituents` /
    `mockNonAggregatedInRollup` from the current
    `model.rollupConfig` (read once on mount via `useState` initializer
    + `IrisGridUtils`-equivalent inverse: we only need the columns and
    the two flags, both available directly on `dh.RollupConfig`).
  - On every change to those three pieces of state, recompute a
    `UIRollupConfig`, convert via `IrisGridUtils.getModelRollupConfig`,
    and assign to `model.rollupConfig` (only when the resulting
    `dh.RollupConfig` differs from the current — deep-equal guard, mirroring
    `IrisGridProxyModel`'s own short-circuit).
  - Empty columns list → assign `null` (revert to flat).
  - Gate writes on `isPivotBuilderIrisGridModel(model)`.
  - Comment out the legacy Row keys / Column keys / aggregation
    function / Columns selectors and Apply/Reset buttons. Wrap the
    JSX in `{/* ... */}` plus a short `TODO(DH-21476)` note so the
    structure is preserved for later removal.

- `plugins/pivot-builder/src/js/src/PivotConfigSection.tsx`
  - Replace the "next placeholder column" generator for Rollup rows
    with a real column picker. Simplest UI:
    - "Add" opens an inline `<Select>` row at the bottom listing all
      `availableColumns` minus already-selected; pick a value → append
      and remove the picker.
    - Cancel button on the picker row.
  - Same treatment is **not** applied to Pivot columns / Filterable
    columns this phase (still placeholder).

### Modified — plugin (optional, defer if scope creeps)

- `plugins/pivot-builder/src/js/src/pivotBuilderModel.ts`
  - Document the rollup/pivot mutex assumption in the file header.
  - No code change needed; the existing proxy delegates `rollupConfig`
    to the underlying `IrisGridProxyModel` for free.

## Rollup ↔ Pivot interaction

The two features are intentionally allowed to coexist in the UI; the
later "compose rollup + pivot" phase will define how they combine on
the model. For this phase only Rollup rows writes to the model, so
there is nothing to coordinate yet. No UI mutex is added.

## Behaviour

1. Open Create Pivot sidebar with a flat table.
   - Card seed: empty Rollup rows (assuming no persisted rollup), both
     footer checkboxes default to `true`.
2. Toggle Rollup rows ON, click Add, pick `Sym` → grid rerenders as
   `table.rollup({ columns: ['Sym'], includeConstituents: true,
   includeDescriptions: true })` plus an empty
   `AggregationSettings` (so the call resolves to
   `{ aggregations: { First: [<non-agg columns>] } }` via
   `getModelRollupConfig` — the host's existing behaviour for
   "rollup with no explicit aggregations").
3. Toggle the "Non-aggregated in rollup rows" checkbox off → grid
   rerenders without the auto-`First` aggregation.
4. Remove the last column → `model.rollupConfig = null` reverts the
   grid.
5. The legacy column-selector block at the bottom of the page is no
   longer rendered (commented out). The previous Pivot Apply path is
   therefore unreachable from the UI this phase; the proxy still
   exposes `pivotConfig` so a follow-up phase can wire it through the
   Pivot columns / Aggregate values cards.
6. Reopening the panel re-seeds the Rollup rows card from
   `model.rollupConfig` (if any).

## Out of scope (still)

- Wiring Pivot columns, Aggregate values, or Add filterable columns to
  any model state.
- Composing rollup + pivot on the same model (later phase).
- Editing an existing aggregate via the pencil button.
- Drag-and-drop reordering for the Rollup rows list.
- Deleting the commented-out legacy selectors. They stay as inert
  reference until Pivot columns / Aggregate values are wired.
- Migrating away from the host's existing Rollups & Aggregations
  sidebar (this card-based UI is purely additive for now).
- Tests.

## Phases & Steps

### Phase 1 — Plumb `model.rollupConfig`

1. Add a `useEffect` in `CreatePivotPage` keyed on
   `[model, rollupRowsOn, mockRollupRows, mockIncludeConstituents,
   mockNonAggregatedInRollup]` that:
   a. Bails if `!isPivotBuilderIrisGridModel(model)`.
   b. Builds a `UIRollupConfig` from state (or `undefined` when the
      card is OFF / empty).
   c. Calls `IrisGridUtils.getModelRollupConfig(model.sourceTable.columns,
      uiConfig, { aggregations: [], showOnTop: false })`.
   d. Compares against `model.rollupConfig` via `fast-deep-equal`; if
      different, assigns. Empty/OFF → assign `null`.
2. Seed the three pieces of state from `model.rollupConfig` on mount
   (read once via `useState` initializer).
3. Comment out the legacy Row keys / Column keys / aggregation
   function / Columns selectors and Apply/Reset buttons in the same
   commit so the UI stops showing two ways to do the same thing.

### Phase 2 — Real column picker for Rollup rows

1. Update `PivotConfigSection.tsx` to expose a per-card "picker mode"
   (controlled prop or local state in `ConfigCard`).
2. Render an inline `<Select>` + cancel button when Add is clicked on
   the Rollup rows card; on selection, call `onRollupRowsChange` with
   the appended column.
3. Leave the placeholder-name behaviour for the other three cards.

### Phase 3 — Verify

1. Refresh the browser (vite watcher should pick this up; if not, the
   pivot-builder bundle has a known watcher flake — one-off
   `npx vite build` in `plugins/pivot-builder/src/js`).
2. Manually confirm the behaviours listed in the Behaviour section.

## Risks / open questions

- **Persistence:** the host's normal rollup persistence runs through
  `IrisGridPanel` state. Our panel goes through the pivot-builder
  middleware; we already persist `pivotConfig` via `usePersistentState`
  but **not** the rollup. Two options, both deferrable past this phase:
  1. Trust the host to round-trip `model.rollupConfig` (it already
     does this for non-pivot panels). Needs verification with the
     pivot-builder middleware in the call chain.
  2. Mirror what we do for `pivotConfig`: add another
     `usePersistentState<UIRollupConfig | null>` in
     `PivotBuilderPanelMiddleware` and hydrate at mount.
  Recommendation: ship Phase 1–3 without persistence and re-evaluate.
- **Aggregations empty list:** `getModelRollupConfig` synthesises a
  `First` aggregation for non-aggregated columns when
  `showNonAggregatedColumns` is true. That matches the host's default
  behaviour but produces an extra column the user didn't explicitly
  ask for. Acceptable for this phase since it matches the existing
  Rollup Rows sidebar.
- **Sort:** `RollupRows` keeps a `sort: 'ASC' | 'DESC'` for its
  ungrouped list. Our card has no equivalent. Not needed — sort only
  affects the picker, not the produced `RollupConfig`.
- **Selector seeding after Apply:** the existing pivot Apply flow is
  commented out this phase, so the inner model only swaps via the
  Rollup rows wiring. Once Pivot columns is wired in a later phase
  we'll need to define how `rollupConfig` and `pivotConfig` compose
  (e.g. apply rollup to the pivot source, or layer them in a fixed
  order) — currently undefined.
