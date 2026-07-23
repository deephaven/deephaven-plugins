# Pivot Builder: sanitize stale columns on the rollup path, notify on all paths

## Background

Repro: a table has columns A and B. A rollup is grouped on B, then the query
is edited to drop B and the worker restarts. On restart the panel renders
empty/skeleton rows with no error.

Root cause: `makePivotModelTransform.ts` rehydrates the persisted
`PivotBuilderConfig` before the model is published. The rollup branch in
`applyPivotBuilderConfig` forwards `config.rollup` (still
`groupingColumns: ['B']`) straight to the host's `rollupConfig` setter with no
validation. The host calls `table.rollup(...)` with no column-existence check
and the engine builds a structurally valid but non-functional TreeTable — it
resolves rather than rejects, so there's no `REQUEST_FAILED`, no console
error, just a grid that never populates. `settle()` also swallows both
outcomes of the pending swap.

The pivot path already sanitizes aggregation columns via
`buildPivotAggregationsMap`, but silently (`log.debug2` only) and it does
**not** sanitize `rowKeys`/`columnKeys`.

The same staleness affects the sidebar's **Aggregate Values** card, which is
not part of `config.pivot`. Per `seedPivotBuilderUiState.ts`, its content comes
from one of two places:

- `config.rollup.aggregations` (`operation → columns[]`) when a rollup is
  active — forwarded with `groupingColumns` via the same `rollupDesc.set`.
- `config.totals.operationMap` (`column → operations[]`) when no rollup/pivot
  is active — forwarded via `writeTotalsToInner` /
  `originalWritable.totalsConfig`.

All paths need the same treatment: sanitize before the host/service write,
keep the raw value in `storedRollup`/`storedTotals`/`lastIntent`, and fold
into a single stale-columns notification.

## Goals

1. Rollup path never renders a silently-broken/empty grid when
   `groupingColumns` references a missing column.
2. `storedRollup` / `storedTotals` / `lastIntent` keep the **raw, unsanitized**
   value so the user can see and fix the stale reference. Only the value sent
   to the host setter is sanitized.
3. Rollup, totals (Aggregate Values, non-rollup mode), and pivot paths all
   toast when a saved config references missing columns, instead of silently
   dropping them.
4. A single `applyPivotBuilderConfig` call that finds stale refs across any
   combination of rollup/totals/pivot shows **one** notification.
5. The notification does not repeat on every reconcile of the same unchanged
   bad config — it fires once per distinct bad config (dedupe via `deepEqual`,
   like `PIVOT_BUILDER_CONFIG_CHANGED`).

## Non-goals

- Not changing the existing hard-failure recovery path (`chooseRecoveryTarget`
  / `PIVOT_BUILDER_ERROR`). It remains the safety net for non-schema-drift
  failures (service unavailable, network, etc.).
- Not auto-fixing the persisted config. The user fixes it via the sidebar or
  query; we only stop the silent broken render and make the problem visible.

## Design

### 1. Stale-reference detection

`findStaleColumnRefs(config, columns)` returns a `StaleColumnReport`:

```ts
export interface StaleColumnReport {
  rollupColumns: string[]; // config.rollup groupingColumns + aggregations
  totalsColumns: string[]; // config.totals operationMap keys
  pivotColumns: string[];  // config.pivot rowKeys/columnKeys/aggregations
}
```

- Checks all three sections regardless of which branch will run (rollup/totals
  are mirrored into the config even while a pivot supersedes them).
- Returns empty arrays (never null) and de-dupes names within each list.
- **Existence-only, not type validity.** A column that still exists but is now
  type-invalid for its operation (e.g. `Sum` over a now-string column) is
  silently dropped by the sanitizers (section 2) but does **not** trigger the
  toast. This matches the "no longer exist" toast copy and is intentional.

Called once at the **very top** of `applyPivotBuilderConfig`, above the
`deepEqual(config, lastIntent)` no-op short-circuit. A single call site over
the one incoming `config` naturally yields one combined report (satisfies goal
4).

### 2. Sanitize before the host/service calls, not before storage

- **Rollup (grouping):** drop missing `groupingColumns` and pass the sanitized
  config to `rollupDesc.set`; keep `storedRollup = config.rollup` raw. If every
  grouping column is dropped, forward `null` (flat source) rather than an
  empty-but-still-a-rollup config.
- **Rollup (Aggregate Values):** filter `rollup.aggregations`, dropping columns
  that are missing **or** fail `AggregationUtils.isValidOperation(op, type)`,
  then dropping an operation once its column list is empty. An empty
  aggregations map is an acceptable terminal state (grouped rows, no aggregate
  columns) — no synthesized replacement.
- **Totals (non-rollup mode):** drop `operationMap` entries whose column is
  missing, and drop individual operations that fail `isValidOperation`, then
  pass the sanitized totals to `writeTotalsToInner` (both immediate and
  `pendingTotals`-queued branches); keep `storedTotals = config.totals` raw. An
  empty `operationMap` is acceptable.

  **Write-ordering fix:** the outer diff that decides whether to write compares
  against `effectiveInnerTotals` (`pendingTotals ?? appliedInnerTotals`), not
  `lastIntent.totals`, so supersede-then-return-to-totals still triggers a
  clearing write. If we keep `config.totals` raw but write a sanitized value,
  diffing raw-vs-`effectiveInnerTotals` is true on essentially every call while
  any stale entry persists → RPC churn/flicker (the template's own guard is
  `===` reference equality). **Fix:** diff the *sanitized* value against
  `effectiveInnerTotals` (sanitized-vs-sanitized). `storedTotals` still stores
  raw regardless.
- **Type validity (in scope):** neither `IrisGridProxyModel`'s `rollupConfig`
  setter nor `IrisGridTableModelTemplate`'s `totalsConfig` path
  (`getTotalsTable()`) does any operation/type validation, so we add the
  `AggregationUtils.isValidOperation` check ourselves on rollup aggregations
  and totals, matching the pivot path. Note: the totals path **catches** a
  `getTotalsTable()` rejection and dispatches `REQUEST_FAILED`, so a bad totals
  config can produce a fatal panel error (not a silent empty render) — another
  reason to sanitize it. `pivotBuilderModel.ts` already imports
  `AggregationUtils`.
- **Pivot:** extend the build boundary (`buildPivotAggregationsMap`) to filter
  `rowKeys` and `columnKeys` against `table.columns` right before
  `createPivotTable`. `current`/`lastIntent`/`storedRollup`/`storedTotals`
  continue to store raw `config.pivot`.

  **Total key-loss case:** when sanitization empties both `rowKeys` and
  `columnKeys`:
  - If the sanitized aggregations (before any Count-fallback synthesis) are
    also empty, revert the whole pivot to the empty builder config (flat
    source) — same target as `chooseRecoveryTarget`. A "Count of everything,
    zero grouping" pivot has no value.
  - If the sanitized aggregations are non-empty, keep the pivot with empty keys
    and those aggregations (a meaningful flat summary row).
  - The existing Count-fallback (grouping present, aggregations empty) is
    unchanged.

  This requires splitting sanitization from Count-fallback synthesis so the
  caller can tell "sanitized map was empty before fallback" from "final map is
  non-empty only because a Count was synthesized" — otherwise the degenerate
  all-keys-gone case would still silently synthesize a Count. Implemented as
  `sanitizePivotAggregations` + `buildPivotAggregationsMap` +
  `buildSanitizedPivotRequest`.

### 3. Notification event, once per distinct bad config

```ts
export const PIVOT_BUILDER_STALE_COLUMNS =
  '@deephaven/js-plugin-pivot-builder/PIVOT_BUILDER_STALE_COLUMNS';

export interface PivotBuilderStaleColumnsDetail {
  rollupColumns: string[];
  totalsColumns: string[];
  pivotColumns: string[];
}
```

After computing the report: if all lists are empty, do nothing. Otherwise
`deepEqual`-compare `config` (on `{pivot, rollup, totals}` only — not the
UI-only `ui` field) against a per-proxy `lastStaleNotifiedConfig`; dispatch
only if different, then update it. This runs above the no-op short-circuit
(the no-op path returns early for unrelated reasons but we still don't want a
repeat), using the separate guard rather than `lastIntent`.

### 4. Listener + toast

In `usePivotBuilderMiddlewareCore.tsx`, a listener alongside the existing
`PIVOT_BUILDER_ERROR` one shows a generic toast (`STALE_COLUMNS_MESSAGE`:
"Some columns in the saved configuration no longer exist and were removed.").
The per-section lists ride on the event detail and are `log.debug`-ged for
support, but stay out of the toast. One event per bad config → one toast.

### 5. Hydration-visibility fix (required)

The transform `await`s `applyPivotBuilderConfig(persisted)` **before**
publishing the model, but the listener only attaches in a `useEffect` gated on
React `model` state (set after the transform resolves). So the hydration-time
dispatch — the exact reported bug — fires with no listeners, and
`CreatePivotPage` skips its mount-time reconcile, so there's no natural second
call.

Fix: expose a synchronous `staleColumnReport` getter on the proxy (mirroring
`builderConfig`), updated on **every** `applyPivotBuilderConfig` call
regardless of the dedupe/dispatch decision. The `[model]` effect reads it once
when the model becomes available and toasts if non-empty, in addition to the
`PIVOT_BUILDER_STALE_COLUMNS` listener that covers later live sidebar edits.
The effect runs once per genuine model swap, so it can't spam.

## Files touched

- `pivotBuilderModel.ts`
  - `StaleColumnReport`, `findStaleColumnRefs`.
  - `PIVOT_BUILDER_STALE_COLUMNS` + `PivotBuilderStaleColumnsDetail`.
  - `sanitizeRollupConfig` (groupingColumns + aggregations, existence +
    `isValidOperation`), `sanitizeTotalsConfig` (operationMap, existence +
    `isValidOperation`).
  - Pivot build split: `sanitizePivotAggregations` +
    `buildPivotAggregationsMap` + `buildSanitizedPivotRequest`
    (rowKeys/columnKeys sanitization + total-key-loss rule).
  - `applyPivotBuilderConfig`: split into a public delegate and internal
    `applyPivotBuilderConfigInternal(config, { skipStaleSnapshotUpdate? })`.
    Calls `findStaleColumnRefs` at the top (above the no-op short-circuit);
    sanitizes rollup before `rollupDesc.set` and totals before
    `writeTotalsToInner`/`pendingTotals` (sanitized-vs-`effectiveInnerTotals`
    diff); dispatches with the `lastStaleNotifiedConfig` dedupe; updates
    `lastStaleColumnReport` unconditionally.
  - `staleColumnReport` getter on the proxy.
- `usePivotBuilderMiddlewareCore.tsx`
  - `[model]` effect: one-time synchronous `staleColumnReport` read (hydration
    fix) + `PIVOT_BUILDER_STALE_COLUMNS` listener (live edits), both toasting.
- Tests: `findStaleColumnRefs.test.ts`, `pivotBuilderModelApply.test.ts`
  (incl. the hydration/no-listener test), extended
  `buildPivotAggregationsMap.test.ts`. Coverage includes: all
  rollup/totals/pivot combinations + none; dedupe of repeated names;
  rollup/totals sanitization for missing columns and type-invalid operations
  with raw values preserved (immediate + queued branches); pivot
  rowKeys/columnKeys sanitization; single-event dispatch with no-repeat and
  re-fire-on-change; legacy `Record<op, columns[]>` aggregation shape; v1→v2
  migrated config; and a non-enum operation string (dropped, not thrown).

## Resolved decisions

1. **All keys sanitized away:** conditional on sanitized aggregations — empty →
   revert to flat builder config; non-empty → keep pivot with empty keys and
   the real aggregations. See the total key-loss rule in section 2.
2. **Toast wording:** generic, no column/section names. Specifics ride on the
   event detail and `log.debug` only.
3. **Dedupe lifetime:** `lastStaleNotifiedConfig` is per-proxy (fresh per model
   build), so a restart re-hydrating the same broken config toasts again once —
   an intentional recurring nag until fixed.
4. **`PIVOT_BUILDER_ERROR` overlap:** kept separate (schema drift vs.
   unrecoverable service failure). Note `lastGoodBuilderConfig` is stored raw,
   including a config that only built because sanitization dropped stale refs,
   so a later hard failure + recovery can dispatch both `PIVOT_BUILDER_ERROR`
   and `PIVOT_BUILDER_STALE_COLUMNS` together — verified the two toasts read
   sensibly side by side.
5. **Type validity (sanitization only):** rollup aggregations and totals gain
   an `isValidOperation` check alongside existence. This governs what gets
   dropped, not what the toast reports — `findStaleColumnRefs`/the toast stay
   existence-only (see decision above and section 1).

## Failure-mode confirmation (closed)

The totals and rollup-aggregation failure modes were reproduced live (Aggregate
Values on column B, both with a rollup active and via plain totals, then
dropping B and restarting), confirming the sanitize-and-notify approach is
correct. As anticipated, the totals path can surface a fatal `REQUEST_FAILED`
rather than a silent empty render, so sanitizing before `getTotalsTable()` is
what prevents the panel error. No design changes were needed as a result.

## Open questions

None.

## Implementation status

Implemented per this plan, including all review fixes:

- `pivotBuilderModel.ts` — `StaleColumnReport`/`findStaleColumnRefs`,
  `PIVOT_BUILDER_STALE_COLUMNS`/`PivotBuilderStaleColumnsDetail`,
  `sanitizeRollupConfig`, `sanitizeTotalsConfig`, the pivot build split
  (`sanitizePivotAggregations` + `buildPivotAggregationsMap` +
  `buildSanitizedPivotRequest`), the `staleColumnReport` getter, and the
  dispatch placed above the no-op short-circuit.
- `usePivotBuilderMiddlewareCore.tsx` — the `[model]` effect (synchronous
  `staleColumnReport` read + listener), both showing the generic toast.
- Tests as listed above.

Two bugs found and fixed by post-implementation code review:

1. The empty-shell pivot revert and `recoverFromPivotFailure` re-applied their
   reverted-to config through the public `applyPivotBuilderConfig`, re-running
   `findStaleColumnRefs` and overwriting `lastStaleColumnReport` with an
   all-clear result before the middleware's mount-time read — so a fully-stale
   persisted pivot silently collapsed to a flat table with no toast. Fixed by
   the public/internal split, with internal revert/recovery call sites passing
   `skipStaleSnapshotUpdate: true` (a user legitimately clearing everything
   still clears the snapshot).
2. The dedupe compared the whole config including the UI-only `ui` field,
   causing spurious re-toasts on sidebar switch toggles. Fixed by deduping on
   `{pivot, rollup, totals}` only.

Both fixes have tests. The full pivot-builder JS suite (12 suites, 139 tests as
of the latest run) passes with 0 TypeScript errors.
