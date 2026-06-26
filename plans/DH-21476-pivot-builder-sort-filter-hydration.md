# DH-21476 — Sort & Filter hydration across Pivot Builder transitions

## Goal

Sorts and filters applied to the flat (source) grid should, **where possible**:

1. Stay applied after switching to a **pivot** view.
2. Stay applied after switching to a **rollup** view.
3. Stay applied after **removing** the pivot/rollup (returning to the flat grid).
4. Survive a dashboard **reload** (persisted alongside `builderConfig`).

"Where possible" is load-bearing: a filter/sort can only transfer if the column it
references still exists (by name) in the target view. Filters on source columns that
become row/group keys, or that feed value aggregations, can transfer; sorts on a
column that becomes a pivot row/column key can transfer; everything else is dropped
gracefully (this matches IrisGrid's existing missing-column behavior).

---

## Direction (2026-06-12) — drop live-toggle, focus on reload

Decision: **stop pursuing live-toggle transfer (goals 1–3) for now** and focus on
**goal 4 (survive a reload)**, **leaning on the host's existing dehydrate/hydrate**
rather than building a builder-owned source snapshot.

- The live-toggle transfer machinery (`pendingSort`/`pendingFilter`,
  `flushPendingSort`/`flushPendingFilter`, `applicableFilters`, and the sort/filter
  capture in `applyPivotConfig` + the rollup branch) has been **reverted** from
  `pivotBuilderModel.ts` (it was working-tree-only, never committed) and the bundle
  rebuilt. The "Implemented" section below is retained for reference but **no longer
  reflects the code**.
- **Corrected finding (supersedes the "Reload = Lost" cells below):** the pivot
  panel does **not** lose sort/filter merely because they aren't in `builderConfig`.
  `PivotBuilderPanelMiddleware` **chains the standard host `IrisGridPanel`** and does
  **not** override `onPanelStateUpdate`, so the host already dehydrates sort/filter
  into per-panel layout state and rehydrates them on reload via
  `IrisGridPanel.loadPanelState → hydrateIrisGridState`
  ([IrisGridPanel.tsx](../../web-client-ui/packages/dashboard-core-plugins/src/panels/IrisGridPanel.tsx) L1025/L1091).
  So reload restore is **partly free** today; the open question is *how much*
  actually survives, not whether anything is persisted.
- **Keying asymmetry that bounds how much the host can do alone:** sort is
  dehydrated/hydrated by column **name** (robust across a deterministic pivot
  rebuild); quick/advanced filters are dehydrated/hydrated by column **index**
  ([IrisGridUtils.ts](../../web-client-ui/packages/iris-grid/src/IrisGridUtils.ts)
  L379/L1510 dehydrate, L1424 hydrate), which is fragile if the rebuilt model's
  column order differs.
- **Reload ordering:** `makePivotModelTransform` builds the pivot/rollup model from
  the persisted `builderConfig` **before** the host runs `hydrateIrisGridState`, so
  the host hydrates against the already-swapped pivot/rollup model — i.e. host
  hydrate sees the *derived* columns, not the flat source.

### Validate first (gate before any code)

Before writing persistence code, **empirically measure** what the host already
restores on reload, in two scenarios:

1. Apply sort + filter on the **flat** grid → reload → expect both restored
   (stable source model; should Just Work).
2. Apply a pivot/rollup, then sort + filter on the **pivot/rollup** view → reload →
   observe which of sort (by name) and filter (by index) survive against the rebuilt
   model.

The result decides scope: if (2) already restores sort and filter acceptably, the
task is reduced to fixing the filter-by-index fragility (or nothing). Only if it
doesn't do we add a minimal host-leaning persistence step (e.g. persist source-level
sort/filter **by name** in `builderConfig` and apply to the source table inside
`makePivotModelTransform` before the pivot build, then let the host hydrate finish).

### Validation result + root cause (2026-06-12) — FIXED

Manual reload test: **sort *and* filter were lost** when a pivot/rollup was active.
Root cause is a **hydration ordering race**, not absence of persistence:

- `makePivotModelTransform` called `augmented.applyPivotBuilderConfig(persisted)`,
  which starts the **async** pivot/rollup build via the host proxy's
  `setNextModel(promise)` and **returns immediately** with the inner model still the
  **flat** source.
- The host then ran `loadPanelState` → `hydrateIrisGridState` against the **flat**
  columns and pushed the persisted sort/filter onto the flat inner model.
- When the pivot build later resolved, `IrisGridProxyModel.setModel` swapped the inner
  model but does **not** re-apply sort/filter, and the host's `IrisGridModelUpdater`
  `useOnChange` effects don't re-fire (stable proxy ref) → sort/filter dropped on the
  derived view.

**Fix (minimal, no snapshot, leans on host):** `applyPivotBuilderConfig` now returns
`Promise<void>` that resolves once the in-flight inner-model swap settles (reads the
host proxy's `modelPromise`, which is set inside `setNextModel` before its own `.then`
runs `setModel`, so the inner model is already swapped when it resolves; cancellation /
rejection are swallowed). `makePivotModelTransform` **awaits** it before returning the
model, so the host runs `hydrateIrisGridState` against the **derived** model's columns
— sort (by name) and filter (by index) now resolve and apply to the pivot/rollup view.
Sidebar callers fire-and-forget with a no-op `.catch`.

Remaining caveat (unchanged): host filter dehydrate is **index-keyed**
([IrisGridUtils.ts](../../web-client-ui/packages/iris-grid/src/IrisGridUtils.ts)
L379/L1510), so if the rebuilt pivot column order differs from the flat order a filter
could still mis-resolve — but hydration now runs against the correct (derived) model,
matching any host model's robustness.

---

## Current behavior (research findings)

### Host IrisGrid (web-client-ui)

- **Dehydration / hydration** lives in `IrisGridUtils`
  ([packages/iris-grid/src/IrisGridUtils.ts](../../web-client-ui/packages/iris-grid/src/IrisGridUtils.ts)):
  - `dehydrateSort` stores sorts by **column name**; `hydrateSort` / `hydrateDhSort`
    resolve via `getColumnByName` and **drop** sorts whose column is missing
    (return `null`, filtered out).
  - `dehydrateQuickFilters` / `dehydrateAdvancedFilters` store by **column index**;
    hydration resolves via `getColumn(index)` and falls back to `filter: null`
    (silently skipped by `getFiltersFromFilterMap`) when the column is gone.
  - `applyTableSettings(table, tableSettings, timeZone)` is the single choke point
    that pushes hydrated filters + sorts onto a `dh.Table` via `table.applyFilter` /
    `table.applySort`.
- **Missing columns never throw** — design favors graceful degradation + logging.
- **Model swaps do not auto-transfer state.** `IrisGridProxyModel.setModel` /
  `setNextModel` swap the inner model; the host re-applies state only on panel load
  via `hydrateIrisGridState`. The filter-bar UI state (quickFilters/advancedFilters
  Maps keyed by `ModelIndex`) lives in `IrisGrid` component state and is **not**
  re-keyed when the inner model swaps.
- Column lookups everywhere go through `model.getColumnIndexByName(name)`
  ([IrisGrid.tsx](../../web-client-ui/packages/iris-grid/src/IrisGrid.tsx) ~L840, L1923,
  L2671, L3218).

### Pivot Builder (deephaven-plugins)

- `augmentPivotBuilderModel(dh, model, getPspWidget, pivotOverrides)`
  ([plugins/pivot-builder/src/js/src/pivotBuilderModel.ts](../plugins/pivot-builder/src/js/src/pivotBuilderModel.ts))
  wraps the host `IrisGridProxyModel` and captures the **stable** source:
  - `proxy.originalModel` — the pre-pivot flat model, never swapped.
  - `const { table } = proxy.originalModel` — the **source table**, also exposed as
    `proxy.sourceTable`.
- `applyPivotConfig(config)`:
  - `config == null` → `proxy.setNextModel(Promise.resolve(proxy.originalModel))`
    (restore flat model).
  - otherwise builds `pivotService.createPivotTable({ source: table, rowKeys,
    columnKeys, aggregations })` and wraps it in `new IrisGridPivotModel(...)`.
  - **The pivot is built from the source `table` object.** Because
    `dh.Table.applyFilter` mutates the table in place, any filter applied while
    viewing the flat grid (which routed through `originalModel.table.applyFilter`) is
    **already present on `table`** and is therefore inherited by the pivot at build
    time. This is the seam we build on.
- `IrisGridPivotModel`
  ([plugins/pivot/src/js/src/IrisGridPivotModel.ts](../plugins/pivot/src/js/src/IrisGridPivotModel.ts)):
  - `get/set filter` delegates to `pivotTable.filter` / `pivotTable.applyFilter` —
    applies to the **pivot output**, not the source. The coreplus `PivotTable`
    only filters **row/column sources, not value sources**, and `applyFilter`
    takes `dh.FilterCondition[]` that must be built against the pivot's own
    columns (column-object identity matters).
  - `set sort` maps each `SortDescriptor` to a `PivotSort` by resolving the source
    column **name** within the pivot's columns (`hydratePivotSort` →
    `getColumnIndexByName`), then routes to `applyRowSort` / `applyColumnSort`
    (negative index ⇒ column-by sort, else row-by). Sorts whose column is absent
    are warned + skipped.
  - Totals writes are deliberately routed to `originalModel` so they survive swaps.

### How host state reaches the model (confirmed)

- `IrisGridModelUpdater` pushes state onto the **current** model via two
  `useOnChange` effects that both list `model` as a dependency:
  `model.filter = filter` (`[model, filter]`) and `model.sort = [...sorts]`
  (`[model, sorts, reverse]`).
- **CRITICAL: the host's `model` prop is the pivot-builder proxy, which is
  augmented _in place_ and never swapped on a toggle.** `applyPivotConfig`
  only swaps the proxy's _inner_ model via `proxy.setNextModel(...)`; the proxy
  object reference the host holds is stable. `IrisGridProxyModel.setModel` does
  **not** re-apply filter/sort to the new inner model. So on a live toggle
  neither the `model` ref nor the `filter`/`sorts` refs change, and the two
  `useOnChange` effects **do not re-fire** — the host does **not** auto-push
  filter/sort onto the freshly-swapped inner model. (The effects only re-fire
  when the `model` _prop_ reference changes, e.g. a panel reload that builds a
  new proxy.)
- `filter` = `getCachedFilter(customFilters, quickFilters, advancedFilters,
  searchFilter)` — a spread of the `FilterCondition`s stored in the filter Maps
  (built against whatever columns existed when the chip was created).
- `sorts` = `this.state.sorts` (`dh.Sort[]`, each carrying `.column.name`).
- `componentDidUpdate` on `model !== prevProps.model` only re-listens +
  rebuilds the metric calculator; it does **not** clear or re-key
  `quickFilters`/`advancedFilters`/`sorts` state.

### Net of current behavior (corrected)

| State | Flat → Pivot | Flat → Rollup | Pivot/Rollup → Flat | Reload |
|---|---|---|---|---|
| Source-column **filters** | Inherited at build time (source table filtered in place) | Inherited (rollup built from filtered source) | Preserved (originalModel.table keeps filters) | **Lost** (not persisted with builderConfig) |
| **Filters applied while in pivot/rollup view** | n/a | n/a | Previously **lost** (lived on the derived model, not the source). **Now fixed**: captured before the swap and carried onto the next model (`pendingFilter`/`flushPendingFilter`, pivot-build forwards synchronously), surviving columns only | **Lost** (not persisted with builderConfig) |
| **Sorts** | Source table is sorted in place, but the new pivot model starts with empty `_sorts` and the host does **not** re-push (stable proxy) → pivot view was **not** sorted. **Now fixed**: `applyPivotConfig` captures the outgoing model's sort and applies it to the new pivot model (surviving key columns only) | Same gap for group-by columns | `originalModel.table` keeps its pre-pivot sort in place (preserved) | **Lost** (not persisted with builderConfig) |
| Filter-bar **UI chips** | Mis-keyed: stored by ModelIndex; chips don't follow columns across the swap (cosmetic; source filter still applied) | Mis-keyed | OK | n/a |

Key correction vs. an earlier draft: because the proxy is augmented **in place**,
the host does **not** auto-re-push filter/sort on a live toggle. Flat-applied filters
survive flat→pivot functionally via the **seam** (the pivot is built from the
in-place-filtered source table), but neither sorts nor filters applied **while in a
pivot/rollup view** reached the next model on a transition; both are now handled in
`applyPivotConfig` / the rollup branch (see Implemented below). Remaining gaps:
**(a)** filter-bar chip UI coherence while in pivot view (cosmetic — the underlying
source filter is correct), and **(b)** persistence of filters/sorts across reload.

### Implemented (REVERTED 2026-06-12 — kept for reference only)

> The live-toggle transfer below was reverted from `pivotBuilderModel.ts`. It is no
> longer in the code. See "Direction (2026-06-12)" above.

- **Sort transfer on toggle/reconfigure** (`pivotBuilderModel.ts`, `applyPivotConfig`):
  capture `const previousSort = proxy.model.sort` before the swap; after
  `new IrisGridPivotModel(...)`, set `pivotModel.sort = previousSort`. The pivot's
  row/column key columns are available synchronously from the pivot table at
  construction, so sorts on surviving key columns resolve immediately; sorts on
  non-surviving columns (e.g. value sources) are warned + skipped by the pivot's
  `set sort`. Also preserves sort across pivot→pivot reconfigure. Removal
  (`config == null`) needs no action — `originalModel` retains its pre-pivot sort
  in place.
- **Filter transfer on toggle/reconfigure** (`pivotBuilderModel.ts`) — symmetric to
  sort. The seam only covers flat→pivot; a filter applied **while viewing a
  pivot/rollup** lives on that derived model (a pivot's `get filter` returns only
  `pivotTable.filter`, not the inherited source filter), so pivot→rollup,
  pivot→flat and rollup→flat dropped it. Now: capture `previousFilter =
  proxy.model.filter` before each swap; the pivot-build path forwards it
  synchronously (`pivotModel.filter = [...previousFilter]`, try/catch); the
  flat-restore and rollup paths set a `pendingFilter` that `flushPendingFilter`
  re-applies on the next `COLUMNS_CHANGED`/`TABLE_CHANGED` (mirroring
  `pendingSort`). Carry/flush only when non-empty, so a model that merely
  inherited the source filter (its own `filter` empty) never clobbers the in-place
  source filter. Both captures default to `?? []` because an unfiltered coreplus
  source table returns `undefined` from `.filter` (would otherwise crash the build
  with "Cannot read properties of undefined (reading 'length')"). Transfer resolves
  by column **name** via the target's `applyFilter`. **Crucially**, conditions are
  first passed through a shared `applicableFilters(model, conditions)` guard that
  keeps only conditions whose every referenced column resolves by name
  (`model.getColumnIndexByName`) **and** reports `model.isFilterable(index)`. This is
  required because a condition on a **value/aggregation** column (valid in a pivot) is
  rejected by a rollup **asynchronously** ("Invalid filter … may only use
  non-aggregation columns"); the request fails *after* `applyFilter` returns, so a
  try/catch can't protect against it and the grid would otherwise wedge in "Rolling
  back changes". Pre-filtering drops such conditions gracefully (matching IrisGrid's
  missing-column behavior). Verified in-browser: a key-column filter (`K`) transfers
  pivot→rollup while a value-column filter (`I`) is dropped without wedging.

---

## Gaps to close

1. **No explicit snapshot** of the pre-pivot sort/filter intent that the builder owns (needed for durable persistence across reload).
2. **Sorts not reaching the pivot view on a live toggle** — the stable in-place proxy means the host never re-pushes. **Done** in `applyPivotConfig` (see Implemented).
3. **Filter-bar UI chip coherence while in pivot view** (cosmetic): chips are keyed by ModelIndex and don't follow columns across a swap. The underlying source filter is still correctly applied via the seam, so this is display-only.
4. **New filters entered while in pivot view** go to the pivot output, not the source. They are now **carried across transitions** (pivot→rollup→flat) via `pendingFilter`/`flushPendingFilter`, but are still not written back to the source table, so they are not yet persisted across reload (see #5) and a value-source filter that the target view can't express by name is dropped.
5. **Persistence**: filters/sorts aren't stored with `builderConfig`, so reload drops them.

---

## Proposed approach

Treat the **source-table filter/sort intent** as builder-owned state, parallel to
`builderConfig`, and reconcile it on every transition. Keep the host's graceful
missing-column semantics — translate by **column name**, drop what can't map.

### 1. Capture a source filter/sort snapshot on the proxy

Add to the augmented proxy a small, serializable snapshot derived from the source table
columns (by **name**, not index):

```ts
interface SourceViewState {
  filters: { columnName: string; type: 'quick' | 'advanced'; value: ... }[];
  sorts: { columnName: string; direction: 'ASC' | 'DESC'; isAbs: boolean }[];
}
```

- Populate it from the host's current `quickFilters` / `advancedFilters` / `sorts`
  at the moment a pivot/rollup is first applied. The builder already lives in a
  middleware that can read the host model's `filter` / `sort` and the source columns.
- Persist it inside the existing `PivotBuilderConfig` envelope (bump
  `usePersistentState` version, add a migration that defaults `sourceView: null`).
  This is the durable record that survives reload, independent of which columns the
  pivot currently exposes.

### 2. On pivot/rollup build — apply to the source, then build

Before `createPivotTable` (and before host rollup config is set), push the snapshot
onto the **source table** so the derived pivot/rollup inherits it:

- **Filters**: rebuild `FilterCondition`s from the snapshot against
  `proxy.sourceTable.columns` (reuse `IrisGridUtils.applyTableSettings` logic, or a
  trimmed local equivalent) and `table.applyFilter(...)`. Drop entries whose column is
  absent in the source (always present here, since snapshot came from source).
- **Sorts**:
  - For **pivot**: hand the snapshot sorts to `IrisGridPivotModel.sort` — its existing
    `hydratePivotSort` already maps a source-column sort to a row/column `PivotSort`
    when that column survives as a row/column key, and warns+skips otherwise. We just
    need to *feed* it the sorts after the model is built.
  - For **rollup**: apply `table.applySort(...)` for sorts whose column survives as a
    rollup group-by; drop the rest.
- Because the build is async and superseded by `pivotToken`, apply sort/filter inside
  the same token-guarded async block so stale builds don't clobber newer state.

### 3. Keep the host UI coherent across the swap

The functional filtering happens on the source table, but the filter-bar chips and the
sort indicators must reflect the **current** model's columns:

- On swap into pivot/rollup, **re-key** the host's `quickFilters` / `advancedFilters` /
  `sorts` to the new model by column **name** via `model.getColumnIndexByName`,
  dropping any that don't resolve. This mirrors what `hydrateIrisGridState` does on
  load but for a live swap. Implement as an explicit reconcile in the middleware (it
  already listens for `PIVOT_BUILDER_CONFIG_CHANGED` and owns the panel state path),
  or expose a host hook to re-hydrate UI state against the current model on
  `COLUMNS_CHANGED`.
- New filters/sorts the user applies **while in pivot view**:
  - Filters on a pivot **key/group** column → forward to the source table and rebuild
    (so they persist on removal). Filters on value/aggregation columns → keep current
    pivot-level behavior (post-aggregation filter), and do **not** fold into the source
    snapshot.
  - Sorts continue to route through `IrisGridPivotModel.sort` (row/column sorts).
    Persist them into the snapshot keyed by source column name so they restore.

### 4. On removal — restore the snapshot onto originalModel

`applyPivotConfig(null)` already restores `originalModel`. Because filters were applied
to `originalModel.table` in step 2, they remain. To also restore **sorts** (which the
pivot consumed as row/column sorts and never applied to the flat table) and to
guarantee coherence:

- After `setNextModel(Promise.resolve(proxy.originalModel))`, re-apply the snapshot's
  filters + sorts to `originalModel` (filters via `table.applyFilter`, sorts via the
  host `sorts` state / `table.applySort`) and re-key the host UI state back to the flat
  columns.

### 5. Persistence

- Extend `PivotBuilderConfig` with `sourceView: SourceViewState | null` and bump the
  `usePersistentState` version in
  [PivotBuilderPanelMiddleware.tsx](../plugins/pivot-builder/src/js/src/PivotBuilderPanelMiddleware.tsx)
  (and the widget-path middleware) with a migration defaulting it to `null`.
- On reload, `makePivotModelTransform`
  ([makePivotModelTransform.ts](../plugins/pivot-builder/src/js/src/makePivotModelTransform.ts))
  already applies the persisted `builderConfig` synchronously before publishing the
  model. Apply `sourceView` to the source table in the same synchronous pass so the
  rebuilt pivot/rollup inherits it, and seed the host sort/filter UI state from it.
- Stop relying on the host's own dehydrate for filters/sorts while a pivot is active
  (those run against pivot columns and are lossy); the builder snapshot is the source
  of truth for source-column state.

---

## Column-survival rules (the "where possible")

| Source column role in target | Filter transfers? | Sort transfers? |
|---|---|---|
| Becomes a **rollup row key** | Yes (pre-aggregation filter on source) | Yes (group-by sort) |
| Becomes a **pivot row key** | Yes | Yes → row-by `PivotSort` |
| Becomes a **pivot column key** | Yes | Yes → column-by `PivotSort` |
| Feeds a **value aggregation** | Yes (filters source rows before aggregation) | No (no flat value column in output) |
| Not present in target at all | No (dropped, logged) | No (dropped, logged) |

All drops are silent + logged, consistent with `getColumnByName` / `getColumn` today.

---

## Phased implementation

1. **Phase 1 — Snapshot + restore on toggle (no persistence).**
   Capture source filter/sort snapshot on first pivot/rollup apply; apply to source at
   build; restore + re-key UI on removal. Covers requirements 1–3 within a session.
2. **Phase 2 — Sort mapping into pivot row/column sorts.**
   Feed snapshot sorts to `IrisGridPivotModel.sort` and rollup `applySort`; round-trip
   pivot-view sort changes back into the snapshot.
3. **Phase 3 — Persistence.**
   Add `sourceView` to `PivotBuilderConfig`, version bump + migration, hydrate in
   `makePivotModelTransform`. Covers requirement 4.
4. **Phase 4 — Live UI coherence hook.**
   Re-key host `quickFilters`/`advancedFilters`/`sorts` by name on swap
   (`COLUMNS_CHANGED`), either in middleware or via a small host helper.

---

## Risks / open questions

- **Host helper vs. plugin-only.** Re-keying the host filter-bar UI state by name on a
  live swap may need a small, reusable helper in `IrisGridUtils`
  (e.g. `rekeyTableSettingsByName(oldModel, newModel, state)`) in web-client-ui. Decide
  whether to keep this purely in the plugin (reading host state) or add the helper to
  the host. A host helper is cleaner and reusable for any model-swapping plugin.
- **Pivot filter semantics on value columns.** Confirm desired behavior: pre-aggregation
  (filter source) vs. post-aggregation (filter pivot output). Plan assumes source for
  key columns, pivot output for value columns.
- **Does the pivot service track later source-filter mutations**, or only snapshot at
  `createPivotTable`? If it only snapshots, changing a source filter while in pivot view
  must trigger a rebuild (token-guarded), not just `table.applyFilter`.
- **Advanced filter serialization** across views must reuse the host's
  `dehydrateAdvancedFilters` value encoding so persisted snapshots round-trip.
- **Reverse / partition filters / search filters** are out of scope for v1 — enumerate
  whether any must transfer.
```
