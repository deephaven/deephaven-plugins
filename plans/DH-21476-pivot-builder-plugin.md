# DH-21476: pivot-builder plugin (spike)

## TL;DR

New JS-only `WidgetMiddlewarePlugin` at `plugins/pivot-builder/`, modeled on
[`table-options-example`](../plugins/table-options-example/). It owns a new
proxy model `PivotBuilderIrisGridModel` (JS-`Proxy` pattern from
[`IrisGridProxyModel`](https://github.com/deephaven/web-client-ui/blob/main/packages/iris-grid/src/IrisGridProxyModel.ts))
whose inner model is either the original `IrisGridTableModel` or an
`IrisGridPivotModel`. A `pivotConfig` getter/setter mirrors `rollupConfig`;
the setter calls `coreplus.pivot.PivotService.createPivotTable(...)` (API
copied from the local `grid-toolbar` plugin
[`usePivotToggle.ts`](https://github.com/deephaven/deephaven-plugins/blob/pivot-builder-plugin/plugins/grid-toolbar/src/js/src/usePivotToggle.ts))
and `setNextModel(promise)` to swap.

The middleware replaces the default `Component` rendering: it fetches the
source `Table`, constructs `PivotBuilderIrisGridModel`, and renders
`<IrisGrid model={pivotBuilderModel}/>` wrapped in an
`IrisGridTableOptionsContext.Provider`. A custom "Create Pivot" Table Options
menu item (`configPage: CreatePivotPage`) receives that model via
`IrisGridTableOptionsPageProps` and calls `model.pivotConfig = defaultConfig`
on click; `pivotConfig = null` reverts.

Defaults derived inside the setter from `originalTable.columns`:

- `rowKeys`: first non-numeric column (or first column if all numeric)
- `columnKeys`: second non-numeric column if available, else `[]`
- `aggregations`: `{ Sum: [<all numeric col names>] }` if any numeric, else
  `{ Count: [] }`

Scope: `supportedTypes: ['Table']` only. Spike-quality — no styling polish,
no Python package, no tests.

## Phases & Steps

### Phase 1 — Scaffold the plugin package (no deps on others)

1. Create `plugins/pivot-builder/` with `LICENSE` and a minimal `README.md`.
2. Create `plugins/pivot-builder/src/js/package.json` cloned from
   [`table-options-example/src/js/package.json`](../plugins/table-options-example/src/js/package.json).
   Rename to `@deephaven/js-plugin-pivot-builder`. Add deps:
   - `@deephaven/components`, `@deephaven/iris-grid`,
     `@deephaven/jsapi-bootstrap`, `@deephaven/jsapi-types`,
     `@deephaven/log`, `@deephaven/plugin`
   - peerDeps: `react`, `@deephaven-enterprise/jsapi-coreplus-types`,
     `@deephaven/js-plugin-pivot` (for `IrisGridPivotModel`, `isCorePlusDh`)
3. Create `plugins/pivot-builder/src/js/vite.config.ts` and `tsconfig.json`
   cloned from `table-options-example`, with externals updated for the new
   deps.
4. Create `plugins/pivot-builder/src/js/.gitignore` for `dist/` and
   `node_modules/`.

### Phase 2 — Core model class (parallel with Phase 1 once scaffold exists)

5. Create `plugins/pivot-builder/src/js/src/PivotBuilderIrisGridModel.ts`:
   - `class PivotBuilderIrisGridModel extends IrisGridModel` using the same
     JS `Proxy` constructor trick as `IrisGridProxyModel` (lines 80–120) to
     forward unimplemented props to the current inner model.
   - State: `originalModel`, `model` (current), `originalTable`,
     `pspWidget`, `dh`, `pivot: PivotConfig | null`, `modelPromise`.
   - Constructor `(dh, originalTable, pspWidget, formatter?)`. Build inner
     via `new IrisGridTableModel(dh, originalTable, formatter)`; call
     `startListeningInner(inner)`.
   - `get/set pivotConfig`: mirror `IrisGridProxyModel.set rollupConfig`
     (lines 400–420). Deep-equal short-circuit, `setNextModel(promise)`. On
     `null` swap back to `originalModel`. On non-null: fetch
     `PivotService.getInstance(pspWidget)`, call
     `service.createPivotTable({ source: originalTable, rowKeys,
     columnKeys, aggregations })`, then
     `new IrisGridPivotModel(dh, pivotTable)`.
   - `setNextModel(promise)`: cancel prior, await, swap listeners
     (`stopListeningInner(old)` / `startListeningInner(new)`), dispatch
     `EVENT.COLUMNS_CHANGED` and `EVENT.UPDATED`.
   - `startListeningInner`/`stopListeningInner`: forward all
     `IrisGridModel.EVENT.*` from inner to self via `handleModelEvent` (copy
     pattern from `IrisGridPivotModel.removeListeners` and
     `IrisGridProxyModel` addListeners).
   - `close()`: close current inner model + pivot table if active.
   - Static helper `makeDefaultPivotConfig(columns)` per TL;DR.

### Phase 3 — Middleware & sidebar item (depends on Phase 2)

6. `createPivotItemType.ts`: `export const CREATE_PIVOT_ITEM_TYPE =
   'plugin:pivot-builder:create-pivot'`.
7. `CreatePivotPage.tsx`:
   - Imports `IrisGridTableOptionsPageProps` from `@deephaven/iris-grid`.
   - Narrows `model` to `PivotBuilderIrisGridModel`; renders Back + a
     primary "Create Pivot" button. Click:
     `model.pivotConfig = PivotBuilderIrisGridModel.makeDefaultPivotConfig(model.columns)`.
     Show "Reset" when `model.pivotConfig != null` that sets
     `pivotConfig = null`.
   - Defensive `instanceof` check; render note if model isn't the expected
     type.
8. `useComposedTableOptionsExtension.ts`: mirror
   `table-options-example/.../useComposedTableOptionsExtension.ts`. Append
   the `CREATE_PIVOT_ITEM`; do not filter built-ins.
9. `PivotBuilderWidget.tsx`:
   - `useApi()` for `dh`, `useObjectFetch<dh.Widget>` keyed off
     `props.metadata` with `{ ...metadata, type: 'PivotService', name:
     'psp' }` (same probe pattern as `usePivotToggle.ts` lines 70–112).
   - `props.fetch()` resolves the source `Table`. Use
     `useEffect`+state to build `PivotBuilderIrisGridModel(dh, table,
     pspWidget)` once.
   - Render
     `<IrisGridTableOptionsContext.Provider value={extension}>
       <IrisGrid model={pivotBuilderModel} ...minimalProps/>
     </IrisGridTableOptionsContext.Provider>`
     with `<LoadingOverlay/>` while loading.
10. `PivotBuilderMiddleware.tsx`: `WidgetMiddlewareComponentProps` →
    ignore `Component`, render `<PivotBuilderWidget {...props}/>`.
11. `PivotBuilderPanelMiddleware.tsx`: spike stub — forward to default
    `Component` wrapped only in `IrisGridTableOptionsContext.Provider`
    (model in panel path is not `PivotBuilderIrisGridModel`, so the menu
    item is non-functional there). Documented in README.
12. `PivotBuilderPlugin.ts`: `WidgetMiddlewarePlugin`, `name:
    '@deephaven/js-plugin-pivot-builder'`, `type:
    PluginType.MIDDLEWARE_PLUGIN`, `supportedTypes: ['Table']`,
    `component: PivotBuilderMiddleware`, `panelComponent:
    PivotBuilderPanelMiddleware`.
13. `index.ts`: default export `PivotBuilderPlugin`; named exports for
    `PivotBuilderIrisGridModel`, `PivotConfig`, item type.

### Phase 4 — Wire into monorepo

14. Confirm `plugins/pivot-builder/src/js` is picked up by root lerna
    workspaces (existing glob is `plugins/*/src/js`).
15. `npm install` at repo root.
16. `cd plugins/pivot-builder/src/js && npx vite build`.

## Relevant files

- [`grid-toolbar/src/js/src/usePivotToggle.ts`](https://github.com/deephaven/deephaven-plugins/blob/pivot-builder-plugin/plugins/grid-toolbar/src/js/src/usePivotToggle.ts)
  — source-of-truth for `PivotService.getInstance(pspWidget)` +
  `createPivotTable({source, rowKeys, columnKeys, aggregations})`. Also for
  the `psp` widget probe pattern.
- [`grid-toolbar/src/js/src/PivotBuilderDialog.tsx`](https://github.com/deephaven/deephaven-plugins/blob/pivot-builder-plugin/plugins/grid-toolbar/src/js/src/PivotBuilderDialog.tsx)
  — `PivotConfig` shape (`rowKeys`, `columnKeys`, `aggregations:
  Record<string,string[]>`) and `NUMERIC_TYPES` set.
- [`plugins/table-options-example/src/js/`](../plugins/table-options-example/src/js/)
  — full scaffold template (package.json, vite.config.ts,
  plugin/middleware/extension/page files).
- [`plugins/pivot/src/js/src/IrisGridPivotModel.ts`](../plugins/pivot/src/js/src/IrisGridPivotModel.ts)
  — exported via `@deephaven/js-plugin-pivot`; constructor `(dh,
  pivotTable)`.
- [`plugins/pivot/src/js/src/PivotUtils.ts`](../plugins/pivot/src/js/src/PivotUtils.ts)
  — `isCorePlusDh(dh)` helper.
- [`IrisGridProxyModel.ts`](https://github.com/deephaven/web-client-ui/blob/main/packages/iris-grid/src/IrisGridProxyModel.ts)
  lines 80–120 (Proxy constructor) and 400–420 (`set rollupConfig` +
  `setNextModel`).
- [`IrisGridModel.ts`](https://github.com/deephaven/web-client-ui/blob/main/packages/iris-grid/src/IrisGridModel.ts)
  — base class + `EVENT` enum.
- [`IrisGridTableOptionsContext.tsx`](https://github.com/deephaven/web-client-ui/blob/vlad-DH-21476-table-options/packages/iris-grid/src/sidebar/IrisGridTableOptionsContext.tsx)
  and `CommonTypes.tsx` lines 50–80 (`IrisGridTableOptionsPageProps`,
  `OptionItem.configPage`).

## Verification

1. `cd plugins/pivot-builder/src/js && npx vite build` succeeds with no TS
   errors.
2. With the deephaven-plugins dev proxy + web-client-ui + a DHE Core+ worker
   running, open a flat table widget on a query that also exports a
   `PivotService` named `psp`:
   - Grid renders normally (via `PivotBuilderIrisGridModel` wrapping
     `IrisGridTableModel`).
   - Table Options sidebar shows "Create Pivot" at the bottom of the menu.
   - Clicking "Create Pivot" opens `CreatePivotPage` with a "Create Pivot"
     button.
   - Clicking the button: grid swaps to pivot view; browser console shows
     `Creating pivot with config:`.
   - "Reset" restores the original flat table.
3. Negative: same widget on a worker with no `psp` variable. Page still
   renders; clicking surfaces the error in console; flat table still works.
4. Lint clean: `npm run test:lint -- --selectProjects eslint
   --testPathPattern plugins/pivot-builder`.

## Decisions

- JS-only plugin (matches `table-options-example`); no Python package, no
  `register.py`, no tox.
- Panel path (`panelComponent`) keeps default `IrisGridPanel`; menu item is
  non-functional there. Documented in README. Spike acceptable.
- Defaults baked into a static helper on the model — no UI for
  configuration in this spike.
- `pivotConfig = null` reverts to the original model.
- Re-export `IrisGridPivotModel` + `isCorePlusDh` via
  `@deephaven/js-plugin-pivot` peer dep (same as `grid-toolbar`).

## Further considerations

1. **`psp` widget discovery**: hardcoded name `'psp'` (matches
   `usePivotToggle`). If the worker exports `PivotService` under a different
   name, the spike fails. Option A: keep hardcoded. Option B: scan all
   variables for `type === 'PivotService'`. **Recommend A**.
2. **Panel path support**: A — keep stub (current). B — replicate widget
   rendering inside an `IrisGridPanel` clone. C — swap model post-hoc by
   replacing `IrisGridPanel.makeModel`. **Recommend A**.
3. **`originalTable` lifecycle**: keep the original `IrisGridTableModel`
   alive while pivot is active so revert is instant; close both on
   `PivotBuilderIrisGridModel.close()`. **Recommend** this.
