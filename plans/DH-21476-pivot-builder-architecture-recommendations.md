# PivotBuilder ↔ IrisGrid: Architecture Recommendations

Status: analysis / proposal
Related: `plans/DH-21476-pivot-builder-plugin.md`,
web-client-ui PR #2688 (DH-21476 Configurable TableOptions sidebar),
deephaven-plugins PR #1351 (Example table options plugin)

This doc captures recommendations for (a) re-architecting the in-progress
PivotBuilder plugin and (b) adding better-planned extension points to
IrisGrid with minimal breaking changes. IrisGrid is treated as mostly
legacy (extend, don't rewrite); PivotBuilder is treated as work in
progress that is free to change in any way.

## How the plugin extends IrisGrid today

The plugin reaches IrisGrid through three distinct seams, at very
different quality levels:

| Seam | Mechanism | Quality |
| ---- | --------- | ------- |
| Sidebar entry | `transformTableOptions` prop threaded down the middleware chain (`makeCreatePivotTransform.ts`) | Clean, real extension point (the DH-21476 work) |
| Render / interaction overrides | `model.getRenderer()` / `getMouseHandlers()` / `getMetricCalculator` (`IrisGridModel.ts` L163–179) | Real extension point, mis-used |
| Model transform (rollup / totals / pivot) | `Object.defineProperty` monkey-patching of the host `IrisGridProxyModel` instance (`pivotBuilderModel.ts`) | Workaround — the source of all the complexity |

The first seam is fine. The interesting problems are in seams 2 and 3.

## The core architectural problem

`IrisGridProxyModel` bundles three concerns into one class that has
hardcoded knowledge of every transform that exists (rollup,
selectDistinct, totals):

1. config storage (`rollup`, `selectDistinct`, `totalsConfig`),
2. table-transform logic (`table.rollup(...)`, `table.selectDistinct(...)`),
3. model-swap orchestration (`setNextModel` / `originalModel` / `modelPromise`).

Pivot is a **new transform source** — it builds off
`PivotService.createPivotTable(sourceTable)`, not `table.rollup()`.
Because the proxy has no extension point for "register a new transform,"
the plugin has to fight the existing one:

- It re-defines `rollupConfig` / `totalsConfig` as **store-but-don't-apply**
  setters (`pivotBuilderModel.ts`, the `storedRollup` / `storedTotals`
  block) so the host's own rollup path never fires.
- It re-implements orchestration in `applyPivotBuilderConfig` (ordering,
  diffing against `lastIntent`) on top of the semi-private
  `setNextModel` / `originalModel` / `modelPromise` — all reached via
  `as unknown as { ... }` casts.
- It re-emits synthetic `COLUMNS_CHANGED` purely to advance
  `IrisGridPanel`'s `modelQueue` hydration state machine
  (`IrisGridPanel.tsx`).
- It maintains a `pendingTotals` queue + `COLUMNS_CHANGED` /
  `TABLE_CHANGED` listeners to work around the host's silent mid-swap
  totals drop (`IrisGridProxyModel.ts` L465–471).

Every one of these is a symptom of the same missing abstraction.

## Recommendations for the plugin (no host change needed)

### 1. Move render/interaction overrides onto the inner `IrisGridPivotModel`

Highest-leverage simplification, and it's free. The host proxy's `get`
trap already delegates any property it doesn't own to `this.model`
(`IrisGridProxyModel.ts` L103–126). Today the plugin defines
`getRenderer` / `getMouseHandlers` / `getMetricCalculator` as *own*
properties on the outer proxy with a runtime
`isIrisGridPivotModel(target.model)` check — which re-implements the
delegation the proxy already does.

If `IrisGridPivotModel` exposed these itself, the proxy would
automatically return them in pivot mode and `undefined` in flat mode.
That deletes the entire `pivotOverrides` plumbing, the conditional
getters, and the `PivotOverrides` interface.

Caveat: the pivot renderer / handlers currently come from React hooks
for theme reasons. Inject them into the model at construction, or keep
only the theme on the React side.

### 2. Model the config orchestration as a pure reducer

`applyPivotBuilderConfig` mixes diffing, ordering, host-cache clearing,
and event dispatch. A pure
`reduce(prevIntent, nextIntent) → { swaps[], events[] }` function would
be far easier to test than the current property-descriptor soup.

### 3. Stop guessing at PSP availability with a timeout race

The PSP probe (1500 ms timeout race in
`PivotBuilderPanelMiddleware.tsx`) is fragile — it guesses at field
availability because there's no host API to list worker fields. That's a
real host gap (see #6 below), not something to solve with a timeout.

## Recommendations for IrisGrid extension points (minimal breaking changes)

Ranked by leverage-to-risk.

### 4. Make the inner-model overrides delegate automatically (zero breaking change)

Pairs with plugin rec #1. Document that `getRenderer` /
`getMouseHandlers` / `getMetricCalculator` are read off the *current
inner model* through the proxy, so a transform model can supply them.
This is already how it works — it just needs to be a documented contract
so plugins stop monkey-patching the outer proxy.

### 5. Fix the mid-swap totals drop at the source (small, non-breaking)

Replace the silent `return` in `set totalsConfig`
(`IrisGridProxyModel.ts` L465) with queue-and-flush-on-next-swap logic —
the same logic the plugin already had to write. Then the plugin's
`pendingTotals` / listener machinery disappears, and so does the bug for
any future consumer.

### 6. Promote the transform primitive to a real public API

`setNextModel(promise)` + `originalModel` are the genuine extension point
the plugin needs — but they're effectively private (reached via casts).
Two options, increasing ambition:

- **Low risk:** mark `setNextModel` / `originalModel` / `modelPromise`
  as documented `public` with a stable contract. The plugin keeps
  wrapping but stops casting through `unknown`.
- **Better planned:** introduce a named-transform registry on the proxy,
  e.g. `registerTransform(name, (sourceTable) => Promise<Table>)` and
  `applyTransform(name, config)`. Rollup / selectDistinct become the
  first two built-in registrations; pivot registers a third. This is the
  abstraction whose absence forces all the `rollupConfig` hijacking. It
  generalizes the proxy without breaking existing callers (the
  `rollupConfig` / `totalsConfig` setters can delegate to it).

### 7. Give `IrisGridPanel` a first-class hydration hook

The plugin emits fake `COLUMNS_CHANGED` events solely to advance
`modelQueue` (`IrisGridPanel.tsx`). A model method like
`whenReady(): Promise<void>` (or an explicit `MODEL_READY` event) would
let the panel await transform completion without the synthetic-event
coupling.

### 8. Host API to enumerate worker fields

So plugins can check for `PivotService` without a fetch-and-timeout race
(rec #3).

## Bottom line

- **Plugin:** the sidebar seam is good; the render-override seam should
  move onto `IrisGridPivotModel` (free win, deletes a lot); the
  model-transform seam is fighting the host and should be re-expressed as
  a reducer once the host exposes a transform API.
- **IrisGrid:** the single missing abstraction is *"register a transform
  that produces a new inner model from the source table."* Build that
  (#6) plus the mid-swap totals fix (#5) and the documented inner-model
  delegation (#4), and roughly 70% of the plugin's `pivotBuilderModel.ts`
  complexity evaporates — with no breaking changes to existing IrisGrid
  consumers.
