# Pivot Builder: stale-column handling

## Background

Repro: a rollup/pivot/aggregation is configured, then the query is edited to
drop referenced columns and restarts. Originally the persisted config was
forwarded to the host/service unvalidated, rendering a silently-broken grid
(rollup), a degenerate pivot, or a fatal `REQUEST_FAILED` (totals).

A `PivotBuilderConfig` persists both raw card state (`config.ui`) and the
derived result (`config.pivot`/`rollup`/`totals`, derived by the sidebar at
edit time against the then-live schema). Trusting the persisted derived value
at hydration broke in both directions: columns *dropped* (stale references
forwarded) and columns *restored* (stale derivation replayed — e.g. a
First-only rollup kept applying after the aggregation column came back).

## Behavior contract

Columns missing from the live schema behave as if they were never added —
per entry, per section, whether some or all are missing:

- A section (Rollup rows / Pivot columns / Aggregate values) whose entries are
  ALL missing acts as toggled off; mode selection falls through (pivot →
  rollup → totals → flat).
- Partial staleness keeps the section active; only live entries take effect.
- Restoring columns re-enables them, symmetrically.
- Raw config is never auto-fixed: `builderConfig`/persistence keep the raw
  values so the sidebar shows stale entries (struck through) for the user to
  fix.

## Design

### Single derivation path

`resolveEffectiveBuilderConfig(ui, columns, {pivotAvailable, rollupAvailable})`
(`resolveEffectiveBuilderConfig.ts`) is the one mode-selection/derivation
function, extracted from the sidebar's reconcile and shared by:

- `CreatePivotPage` (reconcile on card edits), and
- `applyPivotBuilderConfigInternal` (hydration and every apply), whenever the
  config carries `ui`.

A card is active only if at least one listed column is live (`hasLiveColumn`;
`invert: true` aggregations stay active regardless). Gates:
`pivotActive = globalOn && pivotAvailable && rollupAvailable && pivotColumnsOn
&& hasLiveColumn(pivotColumns)`; analogous for rollup/aggs. Three-way branch:
pivot (raw ui lists; sanitized at the build choke point) → rollup
(`getModelRollupConfig`) → totals (`getModelTotalsConfig`).

The persisted derived `pivot`/`rollup`/`totals` are consulted only for legacy
configs without `ui`. On that legacy path the older salvage guards remain:
`pivotKeysAllStale` / `pivotColumnKeysAllStale` / `fallbackRollupFromPivot`
(a `fallbackTotals` salvage existed briefly but was subsumed by the derivation
and removed).

`pivotAvailable` is resolved by callers (the model can't probe PSP): the
sidebar passes its probe status; `makePivotModelTransform` probes when the
*ui derivation* implies a pivot (legacy: `persisted.pivot != null`), fatal on
failure as before, and passes the result. Internal revert calls reuse the last
passed value. `rollupAvailable` is read live from the host proxy.

### Sanitize at the write boundary, store raw

- `sanitizeRollupConfig` / `sanitizeTotalsConfig` /
  `buildSanitizedPivotRequest` drop missing columns (and type-invalid
  aggregation operations) right before the host/service write.
- `storedRollup`/`storedTotals`/`lastIntent`/`current` keep the RAW values.
- One write site per host property, diffed against the last APPLIED value:
  `appliedRollup` (either channel — derived rollup or legacy fallback),
  `appliedInnerTotals` (+`pendingTotals` mid-swap queue), `current` for pivot.
  Raw-vs-raw diffs are wrong here (derived values change without the raw
  fields changing, and vice versa).

### Stale-reference notification

`findStaleColumnRefs(config, columns)` → `StaleColumnReport`
(`{rollupColumns, totalsColumns, pivotColumns}`; existence-only, deduped) runs
on every apply above the no-op short-circuit. Dispatches
`PIVOT_BUILDER_STALE_COLUMNS` once per distinct bad config (dedupe on
`{pivot, rollup, totals}` only, not `ui`; per-proxy, so a restart re-notifies
once).

**No toast.** The sidebar strikethrough styling
(`pivot-column-name--stale`: line-through + disabled color, driven by the
same live-schema check) is the user-facing signal; the middleware `log.warn`s
the per-section column lists for support. The `PIVOT_BUILDER_ERROR`
build-failure toast is separate and unchanged.

Hydration visibility: the hydration-time dispatch fires before any listener
attaches, so the proxy exposes a synchronous `staleColumnReport` getter
(updated every apply; internal reverts pass `skipStaleSnapshotUpdate` to
preserve the original report). The middleware reads it once per model swap and
listens for later live edits.

## Non-goals

- The hard-failure recovery path (`chooseRecoveryTarget` /
  `PIVOT_BUILDER_ERROR`) is unchanged — still the safety net for
  non-schema-drift failures.
- No auto-fixing/rewriting of persisted config; derivation is apply-time only.

## Files

- `resolveEffectiveBuilderConfig.ts` — shared derivation (new).
- `pivotBuilderModel.ts` — detection/report/event, sanitizers, pivot build
  split, ui-driven derivation in `applyPivotBuilderConfigInternal`, unified
  `appliedRollup` write, legacy guards, `staleColumnReport` getter,
  `pivotAvailable` option.
- `makePivotModelTransform.ts` — derivation-driven PSP probe, threads
  `pivotAvailable`.
- `CreatePivotPage.tsx` — delegates reconcile derivation to the shared
  function; live-column gating for mode selection and the PSP-loading guard.
- `usePivotBuilderMiddlewareCore.tsx` — `log.warn` (no toast) on both
  notification sources.
- Strikethrough: `rowParts.tsx` / `ColumnRow.tsx` / `aggregateRows.tsx` /
  `PivotConfigSection.tsx` / `PivotBuilder.scss`.
- Tests: `findStaleColumnRefs.test.ts`, `pivotBuilderModelApply.test.ts`
  (sanitization, salvage/legacy paths, ui-driven re-derivation incl. the live
  repro both PSP-available and not, transform probe trigger, hydration
  visibility), `buildPivotAggregationsMap.test.ts`, `CreatePivotPage.test.tsx`
  (mode-selection gating), row-component tests.

## Resolved decisions

1. All pivot keys stale → equivalent to section off (legacy guards; on the
   modern path the derivation prevents it structurally).
2. Notification is log-only (`log.warn`, per-section details); strikethrough
   is the UI signal. An earlier generic toast was implemented, then removed by
   request.
3. Dedupe lifetime per-proxy: same broken config re-notifies once per restart.
4. Staleness detection is existence-only; type-validity is a sanitizer concern
   and doesn't notify.
5. Persisted derived fields stay written by the sidebar (backward
   compatibility) but are not trusted at apply time when `ui` is present.

## Implementation status

Implemented, reviewed (multiple independent review rounds; each fix
mutation-tested), and verified live against the repro dashboard. Notable bugs
found and fixed along the way: revert paths clobbering the stale snapshot or
persisted intent; dedupe re-firing on ui-only toggles; a fully-stale rollup
silently dropping a valid aggregation; a synthesized `First` passthrough
resurrecting as a phantom totals row; a toggled-off Aggregate card salvaging
anyway; all-stale pivot keys firing degenerate keyless/0-column-key pivot
RPCs; two independent rollup writers able to clobber each other (unified);
and the stale-derivation-replayed-after-columns-restored bug that motivated
the shared-derivation refactor.

Suite: 13 suites / 160 tests passing, `tsc` and prettier clean.
