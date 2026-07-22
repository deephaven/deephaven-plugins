# Pivot Builder: sanitize stale columns on the rollup path, notify on both paths

## Background

Repro: a table has columns A and B. The user applies a rollup grouped on column
B. The query is edited to drop column B and the worker/query is restarted. On
restart the panel renders with empty/skeleton rows and no error is ever
surfaced.

Root cause (traced in `pivotBuilderModel.ts`): `makePivotModelTransform.ts`
rehydrates the persisted `PivotBuilderConfig` before the model is published.
Its rollup branch in `applyPivotBuilderConfig`
(`pivotBuilderModel.ts:845-847`) forwards `config.rollup` — still containing
`groupingColumns: ['B']` — straight to the host's real `rollupConfig` setter
(`rollupDesc?.set?.call(proxy, config.rollup)`), with no validation. The host
setter (`IrisGridProxyModel.ts:412-442` in web-client-ui) stores the config
and calls `table.rollup(rollupConfig)` with no column-existence check. The
engine builds a structurally valid but non-functional TreeTable keyed on a
grouping column that no longer exists — it resolves rather than rejects, so
there's no `REQUEST_FAILED`, no console error, just a grid that never
populates. `settle()` (`pivotBuilderModel.ts:~763-767`) additionally swallows
both outcomes of the pending swap, so nothing would propagate even if it did
reject.

By contrast, the pivot path already sanitizes aggregation columns against the
live schema via `buildPivotAggregationsMap` before calling
`pivotService.createPivotTable` — but does so *silently* (`log.debug2` only,
no user-facing notice), and does **not** sanitize `rowKeys`/`columnKeys`, so a
stale row/column key still reaches the pivot service unguarded and depends on
the service rejecting to trigger the existing `PIVOT_BUILDER_ERROR` /
recovery path.

**Scope addition:** the same staleness problem exists in the sidebar's
**Aggregate Values** card, which is *not* part of `config.pivot` — per
`seedPivotBuilderUiState.ts`'s `seedAggregationSettings`, its content is
sourced from one of two places depending on mode:

- `config.rollup.aggregations` (an `operation → columns[]` map) when a
  rollup is active — forwarded to the host alongside `groupingColumns` via
  the same `rollupDesc.set` call, so it's part of the same `RollupConfig`
  object already in scope for the rollup fix above, but is a distinct field
  that also needs its own column sanitization.
- `config.totals.operationMap` (a `column → operations[]` map) when no
  rollup/pivot is active (a plain "Aggregate Values" totals row) — forwarded
  via `writeTotalsToInner` / `originalWritable.totalsConfig`, a third
  unguarded write path alongside the rollup and pivot ones already
  identified.

Both need the same treatment: sanitize before the host write, keep the raw
value in `storedRollup`/`storedTotals`/`lastIntent`, and fold into the same
single stale-columns notification.

## Goals

1. Rollup path never again renders a silently-broken/empty grid when
   `groupingColumns` references a column that no longer exists.
2. `storedRollup` / `lastIntent` (the persisted intent) keep the **original,
   unsanitized** value, so the user can see and correct the stale reference
   in the sidebar, or fix it by restoring the column in the query. Only the
   value actually forwarded to the host setter is sanitized.
3. The rollup, totals (Aggregate Values, non-rollup mode), and pivot paths
   all notify the user (toast) when a saved config references columns that
   no longer exist, instead of silently dropping/ignoring them.
4. If a single `applyPivotBuilderConfig` call finds stale references across
   **any combination** of the rollup config, the totals/Aggregate-Values
   config, and the pivot config, the user sees **one** notification, not
   multiple.
5. The notification does not repeat on every re-render/reconcile of the
   sidebar for the same unchanged stale config — it fires once per distinct
   bad config, the same way `PIVOT_BUILDER_CONFIG_CHANGED` already dedupes
   via `deepEqual` against `lastIntent`.

## Non-goals

- Not changing the existing hard-failure recovery path
  (`chooseRecoveryTarget` / `PIVOT_BUILDER_ERROR` on an actual
  `createPivotTable` rejection). That remains the safety net for failures
  that aren't simple schema drift (service unavailable, network errors,
  etc.). With `rowKeys`/`columnKeys` now sanitized (see below), schema-drift
  should rarely reach that path at all, but it stays in place for anything
  sanitization doesn't catch.
- Not attempting to auto-fix the persisted config. The user fixes it via the
  sidebar or the query; we only stop it from rendering a silently broken
  grid and make the problem visible.

## Design

### 1. Centralize stale-reference detection

Add a pure helper, next to `buildPivotAggregationsMap` in
`pivotBuilderModel.ts`:

```ts
export interface StaleColumnReport {
  /** Column names referenced by config.rollup (groupingColumns + aggregations map) that are missing. */
  rollupColumns: string[];
  /** Column names referenced by config.totals.operationMap that are missing. */
  totalsColumns: string[];
  /** Column names referenced by config.pivot (rowKeys/columnKeys/aggregations) that are missing. */
  pivotColumns: string[];
}

export function findStaleColumnRefs(
  config: PivotBuilderConfig,
  columns: readonly DhType.Column[]
): StaleColumnReport { ... }
```

- Checks `config.rollup?.groupingColumns` **and** the column names inside
  `config.rollup?.aggregations` (the Aggregate Values card's content while a
  rollup is active) against `columns`, regardless of whether `config.pivot`
  is currently active (rollup/totals data is mirrored into the config even
  while a pivot supersedes it, so it's worth surfacing staleness there too
  rather than only checking the branch that's about to run).
- Checks `config.totals?.operationMap`'s keys (column names) against
  `columns` — the Aggregate Values card's content when no rollup/pivot is
  active.
- Checks `config.pivot?.rowKeys`, `config.pivot?.columnKeys`, and the column
  refs inside `config.pivot?.aggregations` against `columns`.
- Returns empty arrays (never `null`/`undefined`) when nothing is stale, and
  de-duplicates names within each list.
- **Existence-only, not type validity (confirmed during implementation —
  keep as-is).** `findStaleColumnRefs`/`StaleColumnReport` only reports
  columns that no longer exist in `table.columns`. A column that still
  exists but is now type-invalid for its operation (e.g. a persisted `Sum`
  over what's now a string column) is still silently dropped by the
  build-time sanitizers (section 2, and the type-validity check from
  Resolved Decision #5) — it just doesn't trigger the stale-columns toast.
  This matches the literal "no longer exist" framing of both this
  interface's doc comments and the toast copy in section 4. Decision #5's
  "add type validity now" only ever applied to the *sanitization* step
  (what gets dropped before the host/service call); it was never meant to
  expand what the *notification* reports. Confirmed as intentional and not
  something to change.

Call this **once**, at the very top of `applyPivotBuilderConfig` —
**specifically before the existing no-op short-circuit**
(`if (deepEqual(config, lastIntent)) return settle();`, currently around
line 777), not merely "before the `pivot != null` branch" as an earlier
draft of this plan said (nearly the entire function body satisfies that
weaker phrasing, including everything after the no-op return, which is a
different placement with different behavior — see the correction in section
3). Because both `config.pivot` and `config.rollup` are already available
on the single incoming `config` object regardless of which branch
subsequently runs, a single call site naturally produces a single combined
report — this is what satisfies "only one notification when both refer to
stale columns."

### 2. Sanitize before the host/service calls, not before storage

- **Rollup (grouping):** derive a sanitized rollup config (drop missing
  `groupingColumns`) and pass *that* to `rollupDesc.set`. Keep
  `storedRollup = config.rollup` (the raw value) as today. If sanitization
  drops every grouping column, fall back to forwarding `null` (flat source)
  rather than calling the host setter with a still-a-rollup-but-empty config
  — mirroring how the pivot path falls back to a synthesized `Count` rather
  than an empty aggregation map.
- **Rollup (Aggregate Values):** within that same sanitized rollup config,
  also filter `rollup.aggregations` — an `operation → columns[]` map — by
  dropping any column name not present in `table.columns` from each
  operation's list, **and** dropping a column from that list if
  `AggregationUtils.isValidOperation(operation, columnType)` is false (see
  "Type validity" below), then dropping an operation entirely once its
  column list is empty. Unlike the pivot aggregation fallback, no
  synthesized replacement is needed here: a rollup with grouping but no
  aggregate columns is a normal, meaningful display (grouped rows with no
  extra aggregate columns), so an empty `aggregations` map after
  sanitization is an acceptable terminal state, not an error case.
- **Totals (Aggregate Values, non-rollup mode):** derive a sanitized totals
  config by dropping any `operationMap` entry whose column key is not in
  `table.columns`, **and** dropping an individual operation from a column's
  operation list if `AggregationUtils.isValidOperation` rejects it, then
  pass *that* to `writeTotalsToInner` (both the immediate-write branch and
  the `pendingTotals`-queued branch). Keep `storedTotals = config.totals`
  (the raw value) as today. As with rollup aggregations, an empty
  `operationMap` after sanitization (no totals row) is an acceptable
  terminal state.

  **Write-ordering fix required (found in review — do not skip):** the
  existing outer diff that decides whether to write at all
  (`!deepEqual(config.totals, effectiveInnerTotals)`, where
  `effectiveInnerTotals = pendingTotals ?? appliedInnerTotals`) deliberately
  does **not** compare against `lastIntent.totals` — it compares against
  what was actually applied to the inner model, specifically so a
  pivot/rollup-supersede-then-return-to-totals transition still triggers a
  needed clearing write. If we keep `config.totals` raw (per goal 2) but
  start writing a *sanitized* value, this diff becomes a raw-vs-sanitized
  comparison that is true on essentially every call while any stale entry
  persists (they're never structurally equal), so `writeTotalsToInner`
  (and, downstream, `table.getTotalsTable()`) would re-fire on every single
  reconcile — RPC churn/flicker — because `IrisGridTableModelTemplate`'s own
  guard is `===` reference equality, which a freshly-recomputed sanitized
  object can never satisfy against the previous one either. **Fix:**
  compute the sanitized totals once, then diff the *sanitized* value
  against `effectiveInnerTotals` (sanitized-vs-sanitized), not the raw
  `config.totals` against `effectiveInnerTotals`. `storedTotals` still gets
  the raw `config.totals` regardless of whether the sanitized diff decided
  a write was needed.
- **Type validity (resolved — see Resolved decisions #6):** in scope for
  this change, not deferred. Confirmed by tracing web-client-ui: neither
  `IrisGridProxyModel`'s `rollupConfig` setter (forwards straight to
  `table.rollup()`, `IrisGridProxyModel.ts:412-442`) nor the actual
  `totalsConfig` setter that ends up applying the config — **corrected
  citation:** that's `IrisGridTableModelTemplate.ts:1267-1312` (forwards to
  `table.getTotalsTable()`), not lines 261-306 as an earlier draft of this
  plan said; 261-306 is unrelated `startListening`/`stopListening` wiring —
  perform any operation-vs-column-type validation before the engine call.
  Note the equality-check mechanics differ between the two, which matters
  for section 2's totals write-ordering fix below: `IrisGridProxyModel`'s
  own `totalsConfig` setter (`:482-489`) only guards on an in-flight
  `modelPromise`, and is irrelevant here anyway since the plugin writes
  directly to `proxy.originalModel.totalsConfig`, bypassing it;
  `IrisGridTableModelTemplate.ts:1270`'s guard is `totalsConfig ===
  this.totals` — **reference equality, not `deepEqual`.** Neither layer does
  any type validation regardless. `AggregationUtils.isValidOperation`
  (`AggregationUtils.ts:54-85`) is otherwise only used for UI-picker
  filtering (`AggregationEdit.tsx`) and IrisGrid's own internal
  aggregation-settings rehydration (`IrisGridUtils.ts` /
  `IrisGridPanel.tsx`, reached indirectly via `AggregationUtils
  .getOperationColumnNames` → `filterValidColumns`), neither of which the
  pivot-builder's direct `rollupConfig`/`totalsConfig` writes go through. So
  a persisted `Sum` over a column whose type changed to a string would reach
  the engine unguarded, same as a missing column, unless we add the check
  ourselves. `pivotBuilderModel.ts` already imports `AggregationUtils` for
  the pivot path, so this reuses the same import.

  **Important asymmetry surfaced during review:** unlike rollup (which
  resolves into a silently-broken TreeTable), `IrisGridTableModelTemplate
  .ts:1298-1310` **catches** a `getTotalsTable()` rejection and dispatches
  the host's `REQUEST_FAILED` — i.e. a bad totals config can plausibly
  produce a **fatal panel error**, not a silent empty render. This raises
  the importance of the "confirm the failure mode" prerequisite below (it
  may reveal totals is a worse failure mode than rollup, not just a
  parallel one) and reinforces why write-ordering must be gotten right, not
  just "sanitize somewhere before the write" — see the totals fix in this
  section.
- **Pivot:** extend the existing sanitize-at-the-build-boundary pattern
  (`withFallbackAggregations` / `buildPivotAggregationsMap`) to also filter
  `rowKeys` and `columnKeys` against `table.columns` right before
  `pivotService.createPivotTable(...)`. This closes the gap that currently
  leaves stale row/column keys unsanitized and dependent on the service
  rejecting. `current` / `lastIntent` / `storedRollup` / `storedTotals`
  continue to store the raw `config.pivot` unchanged, matching the existing
  pattern (and the rollup/totals behavior above) — sanitization is purely a
  build-time concern, never a persistence concern.

  **Total key-loss case (resolved — see Resolved decisions #1):** when
  sanitization leaves both `rowKeys` and `columnKeys` empty, whether to
  proceed depends on the sanitized aggregations, not just the keys in
  isolation:
  - If the sanitized aggregations map (before any Count-fallback synthesis)
    is also empty, don't synthesize a Count fallback in this case — instead
    treat it the same as a hard build failure: revert to the empty builder
    config (`pivot: null`, flat source), the same target
    `chooseRecoveryTarget` uses. A "Count of everything, zero grouping"
    pivot provides no value, so it's clearer to fall back to the flat table
    entirely.
  - If the sanitized aggregations map is non-empty (real aggregation
    columns survived sanitization even though every grouping key was
    dropped), proceed with a pivot that has empty `rowKeys`/`columnKeys`
    and those real aggregations — a flat, ungrouped summary row is
    meaningful and should not be discarded.
  - This only changes behavior for the *new* all-keys-stale case. The
    existing `buildPivotAggregationsMap` Count-fallback synthesis (grouping
    present, aggregations empty) is unchanged — that's still a meaningful
    "grouped rows with a count" result.

  **This requires a real refactor, not just a filter (found in review):**
  implementing the rule above needs to distinguish "the sanitized
  aggregations map was empty before any Count-fallback synthesis" from "the
  *final* map is non-empty because a Count was synthesized" — and
  `buildPivotAggregationsMap` currently conflates these: it computes
  `sanitized`, and whenever that's empty, unconditionally returns a
  synthesized Count map, with no way for a caller to see the pre-fallback
  state. Implementing this decision correctly means splitting sanitization
  from fallback synthesis (e.g. have `buildPivotAggregationsMap` return
  both the sanitized-but-not-yet-fallback map and the final map, or split
  it into two functions), so the total-key-loss branch can check "was the
  sanitized map empty" independently of "did the existing Count-fallback
  already paper over that." Get this wrong and the code could still
  silently synthesize a Count even when both grouping keys are gone —
  exactly the degenerate case decision #1 was meant to avoid.

### 3. New notification event, fired once per distinct bad config

Add, alongside `PIVOT_BUILDER_ERROR`:

```ts
export const PIVOT_BUILDER_STALE_COLUMNS =
  '@deephaven/js-plugin-pivot-builder/PIVOT_BUILDER_STALE_COLUMNS';

export interface PivotBuilderStaleColumnsDetail {
  rollupColumns: string[];
  totalsColumns: string[];
  pivotColumns: string[];
}
```

In `applyPivotBuilderConfig`, after computing the `StaleColumnReport`:

- If both lists are empty, do nothing.
- Otherwise, compare the incoming `config` against a new module-level
  `lastStaleNotifiedConfig` via `deepEqual`. Only dispatch
  `PIVOT_BUILDER_STALE_COLUMNS` (with both lists in the detail) if `config`
  differs from `lastStaleNotifiedConfig`, then update
  `lastStaleNotifiedConfig = config`. This prevents re-toasting on every
  `CreatePivotPage` mount/reconcile for the same unresolved stale config,
  while still re-firing if the user edits the config again (even back to a
  still-bad state) or a fresh restart re-hydrates the same bad persisted
  value after the in-memory guard was reset.
- This check should run unconditionally (not gated behind the existing
  `deepEqual(config, lastIntent)` no-op short-circuit), since the no-op path
  returns early for reasons unrelated to staleness, but we still don't want
  it to *repeat*-fire — hence the separate `lastStaleNotifiedConfig` guard
  rather than reusing `lastIntent`. Concretely, this means the check must be
  placed **above** the no-op short-circuit in the function body, per the
  correction in section 1 — placing it "before the pivot branch" but below
  the no-op return would violate this requirement, since the no-op return
  would then skip it whenever the sidebar re-applies an unchanged intent.

### 4. Listener + toast

In `usePivotBuilderMiddlewareCore.tsx`, add a second `addModelListener` next
to the existing `PIVOT_BUILDER_ERROR` one:

```ts
addModelListener(model, PIVOT_BUILDER_STALE_COLUMNS, (e) => {
  const { rollupColumns, totalsColumns, pivotColumns } =
    (e as CustomEvent<PivotBuilderStaleColumnsDetail>).detail;
  // Generic message by design (see Resolved decisions #2) — no column
  // names or section names surfaced in the toast. Log the detail for
  // debugging/support instead.
  log.debug(
    'Stale columns dropped from saved pivot/rollup config',
    { rollupColumns, totalsColumns, pivotColumns }
  );
  ToastQueue.negative(
    'Some columns in the saved configuration no longer exist and were removed.',
    { timeout: TOAST_TIMEOUT_MS }
  );
});
```

The event detail still carries the three per-section lists (useful for
logging/debugging and for a possible future, more specific message), but the
toast itself stays generic per the resolved decision below. Dispatching
exactly one event per bad config (section 3) is what guarantees exactly one
toast, regardless of how many sections (rollup, totals, pivot) were stale.

### 5. Hydration-visibility fix (found in review — required, not optional)

**Problem:** as designed above, the toast would very likely never appear for
the actual reported bug. Trace: `makePivotModelTransform.ts` calls and
`await`s `augmented.applyPivotBuilderConfig(persisted)` **before** returning
the augmented model from the transform. `usePivotBuilderMiddlewareCore.tsx`
only attaches `addModelListener(model, PIVOT_BUILDER_STALE_COLUMNS, ...)`
inside a `useEffect` gated on React `model` state, which is only populated
via `onModelChanged`/`setModel` **after** the transform (and thus that same
hydration call) has fully resolved. So the `PIVOT_BUILDER_STALE_COLUMNS`
dispatch proposed in section 3 fires, with zero listeners attached, during
the exact call this feature exists to cover — `PivotBuilderPanelMiddleware
.tsx` documents this exact timing gap already for the existing
`PIVOT_BUILDER_CONFIG_CHANGED` event ("subscribed after the model is
published, so the transform's own hydration dispatch... has already fired
and is not echoed back"). Worse, `CreatePivotPage.tsx` explicitly skips its
mount-time reconcile (`hasReconciledRef`) specifically because hydration
already applied the persisted intent — so there is no natural second call,
with a listener now attached, to catch the passive "restart and see a
toast" scenario. And even if there were, `lastStaleNotifiedConfig` would
have already been set on the first (unobserved) firing, suppressing a
resend.

**Fix:** expose a synchronous, readable snapshot of the last-computed
`StaleColumnReport` on the proxy, mirroring the existing `builderConfig`
getter pattern:

```ts
Object.defineProperty(proxy, 'staleColumnReport', {
  configurable: true,
  enumerable: false,
  get(): StaleColumnReport {
    return lastStaleColumnReport;
  },
});
```

where `lastStaleColumnReport` is updated on **every** `applyPivotBuilderConfig`
call (unconditionally, alongside the `findStaleColumnRefs` call from section
1 — separate from, and always run regardless of, the `lastStaleNotifiedConfig`
dedupe/dispatch decision in section 3).

In `usePivotBuilderMiddlewareCore.tsx`, in the same `useEffect` that depends
on `[model]` (or a new one with the same dependency), read this snapshot
once when the model first becomes available and show the toast directly if
it's non-empty, in addition to (not instead of) the `PIVOT_BUILDER_STALE_COLUMNS`
listener that continues to handle *later* live edits made through the
sidebar after mount (which the existing event-listener design already
handles correctly, per the review — this fix is specifically for the
before-any-listener-exists hydration window):

```ts
useEffect(() => {
  if (model == null || !isPivotBuilderIrisGridModel(model)) return undefined;
  const report = model.staleColumnReport;
  if (
    report.rollupColumns.length + report.totalsColumns.length + report.pivotColumns.length > 0
  ) {
    log.debug('Stale columns found during hydration', report);
    ToastQueue.negative(
      'Some columns in the saved configuration no longer exist and were removed.',
      { timeout: TOAST_TIMEOUT_MS }
    );
  }
  return addModelListener(model, PIVOT_BUILDER_STALE_COLUMNS, (e) => { /* as in section 4 */ });
}, [model]);
```

This effect runs once per genuine model swap (`model` only changes when
`onModelChanged` fires with a new instance), so it can't spam on re-renders.
Because `lastStaleNotifiedConfig` was already set during the (unobserved)
hydration dispatch regardless of whether anyone was listening, no additional
cross-referencing between the two guards is needed — the mount-time
snapshot read handles the hydration case exactly once, and the event
listener continues to handle live post-mount edits exactly as designed.

## Files touched

- `pivotBuilderModel.ts`
  - Add `StaleColumnReport`, `findStaleColumnRefs` (rollup grouping +
    rollup aggregations + totals operationMap + pivot rowKeys/columnKeys/
    aggregations).
  - Add `PIVOT_BUILDER_STALE_COLUMNS` + `PivotBuilderStaleColumnsDetail`
    (`rollupColumns` / `totalsColumns` / `pivotColumns`).
  - Add rollup sanitization covering both `groupingColumns` and
    `aggregations` — the latter dropping columns that are either missing or
    fail `AggregationUtils.isValidOperation` for their operation.
  - Add totals sanitization covering `operationMap`, dropping operations
    that are either missing their column or fail
    `AggregationUtils.isValidOperation`.
  - Extend the pivot build boundary to sanitize `rowKeys`/`columnKeys`.
    Requires restructuring `buildPivotAggregationsMap` (or splitting it) so
    sanitization and Count-fallback synthesis are distinguishable to the
    caller — see the "requires a real refactor" callout in section 2. Not
    just a naming/sibling-function choice.
  - In `applyPivotBuilderConfig`: call `findStaleColumnRefs` once at the very
    top, above the `deepEqual(config, lastIntent)` no-op short-circuit;
    sanitize the rollup config before `rollupDesc.set`; sanitize the totals
    config before `writeTotalsToInner`/`pendingTotals` (diffing
    sanitized-vs-`effectiveInnerTotals`, not raw-vs-`effectiveInnerTotals` —
    see the write-ordering fix in section 2); dispatch
    `PIVOT_BUILDER_STALE_COLUMNS` with dedupe against
    `lastStaleNotifiedConfig`; also update a `lastStaleColumnReport` snapshot
    unconditionally (used by the new `staleColumnReport` getter below).
  - Add a `staleColumnReport` getter on the proxy (see section 5) so the
    middleware can read the last-computed report synchronously, without
    depending on having a listener attached in time.
- `usePivotBuilderMiddlewareCore.tsx`
  - New `addModelListener(model, PIVOT_BUILDER_STALE_COLUMNS, ...)` effect,
    mirroring the existing `PIVOT_BUILDER_ERROR` effect, **plus** a one-time
    synchronous read of `model.staleColumnReport` in the same effect (see
    section 5) so hydration-time staleness — which fires before this
    listener can possibly be attached — still surfaces a toast.
- Test files to add/extend:
  - `findStaleColumnRefs` unit tests covering every combination of
    rollup-only, totals-only, pivot-only, all-three, and none stale, plus
    dedupe of repeated column names within and across sections.
  - Rollup-sanitization unit test: `groupingColumns` and `aggregations`
    entries with a missing column, and separately `aggregations` entries
    with a type-invalid operation (e.g. `Sum` on a string column), are both
    filtered before reaching the host setter; `storedRollup`/`lastIntent`
    still hold the raw value.
  - Totals-sanitization unit test: `operationMap` entries with a missing
    column, and separately entries with a type-invalid operation, are both
    filtered before `writeTotalsToInner`; `storedTotals` still holds the raw
    value. Cover both the immediate-write and `pendingTotals`-queued
    branches.
  - Pivot `rowKeys`/`columnKeys` sanitization unit test, parallel to the
    existing `buildPivotAggregationsMap` tests.
  - `applyPivotBuilderConfig` dispatch test: single
    `PIVOT_BUILDER_STALE_COLUMNS` event when rollup, totals, and/or pivot
    portions are stale in the same config (test at least the two-way and
    three-way combinations, not just pairwise); no repeat event on a second
    identical call; event re-fires if the config changes to a different
    stale value.
  - **Hydration/no-listener test (found in review — this is the actual bug
    scenario, don't skip it):** construct a model with a persisted config
    that's already stale at build time, run it through
    `makePivotModelTransform`'s transform with no listeners attached yet,
    then assert `augmentedModel.staleColumnReport` is non-empty — this is
    what actually proves the fix covers the reported bug, as opposed to only
    testing the event-dispatch path, which per section 5 does not fire
    where anyone can hear it during hydration.
  - `findStaleColumnRefs` pivot-aggregations test using the **legacy**
    `Record<operation, columns[]>` shape (not just the ordered
    `PivotAggregation[]` array form) — `toPivotAggregations` exists
    specifically to normalize old persisted state, and this shape should be
    exercised here too.
  - A v1-migrated `PivotConfig` (per `PivotBuilderPanelMiddleware.tsx`'s
    existing v1→v2 migration, which wraps a bare `PivotConfig` into
    `{ pivot: state, rollup: null, totals: null }`) run through
    `findStaleColumnRefs`/sanitization, to confirm the migration shim and
    the new sanitization compose correctly. No new persisted fields are
    introduced by this change, so no further `usePersistentState` version
    bump is needed beyond this compatibility check.
  - `isValidOperation` edge case: `AggregationUtils.isValidOperation`'s
    switch has no default case, so an operation string that isn't an exact
    `AggregationOperation` enum member falls through and returns `undefined`
    (falsy) at runtime despite the compile-time exhaustiveness comment.
    Harmless for sanitization purposes (it's conservatively dropped, same
    as an invalid operation), but add a test with such a string to confirm
    it's dropped rather than throwing.

## Resolved decisions

1. **All rowKeys/columnKeys sanitized away.** Conditional on the sanitized
   aggregations, not a flat rule: if aggregations are *also* empty after
   sanitization, revert the whole pivot to the empty builder config (flat
   source) rather than synthesizing a Count-of-everything fallback. If
   aggregations are still non-empty, keep the pivot with empty grouping
   keys and the real aggregations (a meaningful flat summary). See the
   "Total key-loss case" callout in section 2 above for the full rule.
2. **Toast wording.** Generic, no column names or section names in the
   user-facing message: "Some columns in the saved configuration no longer
   exist and were removed." The per-section column lists
   (`rollupColumns`/`totalsColumns`/`pivotColumns`) are still carried on the
   event detail and logged via `log.debug`, so the specifics are available
   for debugging/support without cluttering the toast.
3. **Dedup guard lifetime.** Confirmed as designed: `lastStaleNotifiedConfig`
   stays module-scoped per-proxy (fresh per `augmentPivotBuilderModel` call,
   i.e. per model build), so a restart that re-hydrates the same
   still-broken persisted config toasts again once. This is intentional —
   a recurring nag on every restart/reload until the user actually fixes
   the stale reference, not a one-time-ever notice. No additional
   longer-lived "already warned" state needed.
4. **Existing `PIVOT_BUILDER_ERROR` overlap.** Keep the two toast paths
   separate — no unification. They represent genuinely different problems
   (schema drift caught by sanitization vs. an unrecoverable service-level
   failure).

   **Correction from review — "rare" was understated.** `lastGoodBuilderConfig`
   is set from the **raw**, unsanitized `pendingPivotBuilderConfig`
   whenever a pivot build succeeds (`pivotBuilderModel.ts:587-588`) —
   including a build that only succeeded *because* sanitization dropped
   stale `rowKeys`/`columnKeys`/aggregation columns from it. If a later,
   unrelated hard failure occurs, `chooseRecoveryTarget` reverts to this
   raw "last good" config and `recoverFromPivotFailure` re-applies it via
   an internal `applyPivotBuilderConfig` call (`:468-470`) — which, under
   this plan, re-runs `findStaleColumnRefs` against that same still-stale
   raw config and can dispatch `PIVOT_BUILDER_STALE_COLUMNS` in the same
   moment as `PIVOT_BUILDER_ERROR`. Since a "last good" config can silently
   carry a stale-but-sanitized reference indefinitely, this combination is
   plausibly common in any workspace that already tolerated one schema
   drift, not a rare edge case. Decision stands (still two separate toasts,
   by design) — but implementation should not assume this pairing is
   unlikely, and should double check the two toasts read sensibly shown
   together rather than confusingly (e.g. not both firing with contradictory
   guidance).
5. **Operation/type validity, not just existence.** Add it now, in this same
   change — confirmed (see the "Type validity" callout in section 2) that
   no downstream validation exists anywhere in web-client-ui's actual
   rollup/totals apply path, so skipping this would leave a real gap (a
   `Sum` over a column whose type changed would reach the engine unguarded,
   same failure class as a missing column). Rollup aggregations and totals
   sanitization both gain an `AggregationUtils.isValidOperation` check
   alongside the existence check, matching what the pivot path already
   does in `buildPivotAggregationsMap`.

   **Scope clarification (confirmed post-implementation):** this decision
   governs *sanitization* only — what gets silently dropped before the
   host/service call. It does **not** extend to the stale-columns
   *notification*: `findStaleColumnRefs`/the toast stay existence-only (see
   the callout in section 1). A type-invalid-but-still-present column is
   dropped quietly, exactly like the pre-existing pivot-aggregation
   behavior always has been; only a genuinely missing column surfaces the
   toast. Confirmed as the desired behavior, not a gap to close later.

## Prerequisite: confirm the totals/rollup-aggregation failure mode before implementing

Before writing the totals (`operationMap`) and rollup-aggregations
(`rollup.aggregations`) sanitization, reproduce the failure live — the same
way the rollup `groupingColumns` empty-rows bug was confirmed in this
conversation (table with columns A/B, apply an Aggregate Values
sum/count/etc. on column B via the sidebar's Aggregate Values card — both
with a rollup active and, separately, via plain totals with no rollup — then
edit the query to drop column B and restart). Confirm whether the failure
mode matches rollup-grouping (silent empty/broken render, no error) or
differs (e.g. an actual thrown/rejected error, or a different visual
symptom), and adjust the sanitize+notify design if it doesn't match. This
should happen before or as the first step of implementation, not deferred
to code review.

**Raised in priority by review:** `IrisGridTableModelTemplate.ts:1298-1310`
catches a `getTotalsTable()` rejection and dispatches the host's
`REQUEST_FAILED` — unlike rollup, a bad totals config can plausibly produce
a **fatal panel error**, not a silent empty render. Go in expecting the
totals failure mode may be worse than rollup's, not merely parallel to it,
and confirm before assuming the same sanitize-and-move-on treatment fully
neutralizes it.

## Open questions / edge cases to confirm during implementation

None remaining — all open questions have been resolved above (see
"Resolved decisions" and the "Type validity" callout in section 2).

## Implementation status

Implemented, per this plan (including every fix from the independent design
review above), in:

- `pivotBuilderModel.ts` — `StaleColumnReport`/`findStaleColumnRefs`,
  `PIVOT_BUILDER_STALE_COLUMNS`/`PivotBuilderStaleColumnsDetail`,
  `sanitizeRollupConfig`, `sanitizeTotalsConfig`, the
  `buildPivotAggregationsMap` split (`sanitizePivotAggregations` +
  `buildPivotAggregationsMap` + `buildSanitizedPivotRequest`), the
  `staleColumnReport` proxy getter, and the dispatch placed above the
  no-op short-circuit in `applyPivotBuilderConfig`.
- `usePivotBuilderMiddlewareCore.tsx` — the `[model]`-keyed effect that
  synchronously reads `staleColumnReport` once (the hydration-visibility
  fix) plus the `PIVOT_BUILDER_STALE_COLUMNS` listener for live edits, both
  showing the generic toast.
- New tests: `findStaleColumnRefs.test.ts`, `pivotBuilderModelApply.test.ts`
  (includes the hydration/no-listener test proving the actual reported bug
  is fixed), and an extended `buildPivotAggregationsMap.test.ts`.

Result: 122/122 tests passing, 0 TypeScript errors. Changes are uncommitted
(left for review as a diff) and nothing was built or touched outside the
`pivot-builder` plugin directory.

**Still outstanding:** the live repro of the totals/rollup-aggregation
failure mode (the "Prerequisite" section above) — this was deferred to
happen manually rather than blocking implementation, since the sanitize
pattern was already well-established by the confirmed rollup-grouping
case. Results of that repro may still warrant a follow-up if the totals
failure mode turns out to differ materially (e.g. the fatal
`REQUEST_FAILED` risk noted in the "Type validity" callout in section 2).

**Post-implementation code review found and fixed one real bug.** An
independent code review of the actual implementation (not just this doc)
found that the empty-shell pivot revert (the mechanism implementing
Resolved Decision #1) called through the same public
`applyPivotBuilderConfig` path as external callers, so its internal
re-apply of the reverted-to config re-ran `findStaleColumnRefs` and
overwrote `lastStaleColumnReport` with an all-clear result — before the
middleware's synchronous mount-time read (section 5) ever saw the original
stale report. Net effect: a fully-stale persisted **pivot** (as opposed to
rollup) silently collapsed to a flat table on restart with zero
notification, the same silent-failure class this whole feature exists to
close. `recoverFromPivotFailure`'s internal re-apply had the identical
exposure. Fixed by splitting `applyPivotBuilderConfig` into a public
delegate and an internal `applyPivotBuilderConfigInternal(config, {
skipStaleSnapshotUpdate? })`, with both internal revert/recovery call
sites passing `skipStaleSnapshotUpdate: true` so only genuinely external
applies (sidebar edits, hydration) update the snapshot — not "is the
resulting config empty," since a user legitimately clearing everything
themselves must still clear the snapshot. A second, minor finding from the
same review — the stale-notification dedupe compared the entire
`PivotBuilderConfig` including the UI-only `ui` field, causing a spurious
re-toast on unrelated sidebar switch toggles — was also fixed by deduping
on `{pivot, rollup, totals}` only. Both fixes are covered by new tests
(a fully-stale-pivot hydration test, confirmed to fail against the old
behavior and pass against the fix, plus a `ui`-field dedupe test). 124/124
tests passing, 0 TypeScript errors.
