import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  IrisGridModel,
  IrisGridUtils,
  type AggregationSettings,
  type IrisGridTableOptionsPageProps,
  type UITotalsTableConfig,
} from '@deephaven/iris-grid';
import { GLOBAL_SHORTCUTS } from '@deephaven/components';
import { useUndoRedo } from '@deephaven/react-hooks';
import {
  isPivotBuilderIrisGridModel,
  type PivotConfig,
  type PivotBuilderUiState,
} from './pivotBuilderModel';
import {
  EMPTY_AGGREGATION_SETTINGS,
  aggregationsToPivot,
  seedPivotBuilderUiState,
} from './seedPivotBuilderUiState';
import { PivotConfigSection } from './PivotConfigSection';
import { usePivotServiceStatus } from './PivotServiceContext';

/**
 * Sidebar `configPage` for the Create Pivot menu item.
 *
 * Renders the card-based config panel. The Rollup rows, Aggregate values,
 * and Pivot columns cards drive the model via `applyPivotBuilderConfig`;
 * the Filterable columns card is still a placeholder (not yet wired to the
 * model) — see
 * `plans/DH-21476-pivot-builder-rollup-rows-wiring.md` and
 * `plans/DH-21476-pivot-builder-aggregate-values-wiring.md`.
 */
export function CreatePivotPage({
  model,
  viewState,
}: IrisGridTableOptionsPageProps): JSX.Element {
  const isProxy = isPivotBuilderIrisGridModel(model);
  const pivotServiceStatus = usePivotServiceStatus();
  const pivotAvailable = pivotServiceStatus === 'ready';

  // Ask the middleware to re-probe PSP on mount. Covers the common case where
  // the user runs a script that publishes the PivotService on an already-
  // running worker, then opens this page — the model hasn't rebuilt, so the
  // exclusive in `IrisGridProxyModel`). When false, both the Rollup rows and
  // Pivot columns cards are disabled (a rollup/pivot write would silently
  // no-op); the Aggregate values card stays enabled and falls back to a
  // standalone totals row. `isRollupAvailable` is not an event-bearing
  // property — it flips when the inner model swaps (e.g. toggling Select
  // Distinct), which dispatches COLUMNS_CHANGED / SCHEMA_CHANGED — so we
  // re-read it on those events to keep the disabled state live.
  const [rollupAvailable, setRollupAvailable] = useState(
    () => model.isRollupAvailable
  );
  useEffect(() => {
    const sync = (): void => setRollupAvailable(model.isRollupAvailable);
    sync();
    model.addEventListener(IrisGridModel.EVENT.COLUMNS_CHANGED, sync);
    model.addEventListener(IrisGridModel.EVENT.SCHEMA_CHANGED, sync);
    return () => {
      model.removeEventListener(IrisGridModel.EVENT.COLUMNS_CHANGED, sync);
      model.removeEventListener(IrisGridModel.EVENT.SCHEMA_CHANGED, sync);
    };
  }, [model]);

  // Always source columns from the original (pre-pivot) table so the
  // selectors don't shift to pivot output columns after Apply.
  const columns = isProxy ? model.sourceTable.columns : model.columns;
  // `model.sourceTable.columns` (and `IrisGridModel.columns`) is a JS API
  // getter that can hand back a fresh array on every access. Keying the
  // memos below on the raw array would change `allColumnNames` /
  // `columnTypes` identity every render, re-firing the reconcile effect
  // below — which dispatches `PIVOT_BUILDER_CONFIG_CHANGED`, which calls
  // `setPersistedConfig` upstream, which re-renders us — an infinite loop
  // that thrashes the whole sidebar (including the host's back button).
  // Derive a stable signature from the column names+types instead.
  const columnsKey = columns
    .map((c: { name: string; type: string }) => `${c.name}\u0000${c.type}`)
    .join('\u0001');
  const allColumnNames = useMemo(
    () => columns.map((c: { name: string }) => c.name),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [columnsKey]
  );
  const columnTypes = useMemo(() => {
    const map: Record<string, string> = {};
    columns.forEach((c: { name: string; type: string }) => {
      map[c.name] = c.type;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnsKey]);

  // Seed all four configurable cards from the proxy's last applied
  // intent (`builderConfig`) so reopening the Create Pivot page never
  // sends a stripped config through `applyPivotBuilderConfig`. The proxy
  // is the single source of truth for the user's intent — pivot's
  // rowKeys/aggregations are NOT recoverable from `model.rollupConfig` /
  // `model.totalsConfig` (those reflect the inner-model state, which
  // pivot supersedes). `showNonAggregatedColumns` is UI-only (not
  // faithfully recoverable from a `dh.RollupConfig`) so it defaults to
  // `true`.
  const intent = isProxy ? model.builderConfig : null;
  const pivotIntent = intent?.pivot ?? null;
  const rollupIntent = intent?.rollup ?? model.rollupConfig ?? null;
  const totalsIntent = intent?.totals ?? model.totalsConfig ?? null;
  // Persisted UI/card state (switch positions + contents). When present it
  // is the authoritative seed source — it restores cards exactly as the
  // user left them, including toggled-off cards whose contents are dropped
  // from the derived model config. Absent on legacy configs, in which case
  // we fall back to deriving seed state from the model config below.
  const uiIntent: PivotBuilderUiState | null = intent?.ui ?? null;

  // Consolidate all card state into a single immutable `PivotBuilderUiState`
  // snapshot so the cards get a transient, non-persistent undo/redo stack
  // (mirrors the Organize Columns sidebar). The stack lives only as long as
  // this page is mounted — closing the Create Pivot page unmounts it and the
  // history is discarded. The seed is computed once (lazy initializer) from
  // the proxy's last applied intent, preserving the original per-field
  // priority chains (uiIntent → pivotIntent/rollupIntent fallbacks).
  const [initialUiState] = useState<PivotBuilderUiState>(() =>
    seedPivotBuilderUiState({
      uiIntent,
      pivotIntent,
      rollupIntent,
      totalsIntent,
    })
  );

  const { state, set, undo, redo, canUndo, canRedo } =
    useUndoRedo<PivotBuilderUiState>(initialUiState);

  // Mirror the current snapshot into a ref so the per-field change handlers
  // can build the next snapshot without depending on `state` (keeps their
  // identities stable). `useUndoRedo.set` compares by reference, so each
  // handler must spread into a fresh object for the change to register as a
  // new undo step.
  const stateRef = useRef(state);
  stateRef.current = state;

  const update = useCallback(
    (patch: Partial<PivotBuilderUiState>) => {
      // Advance the ref synchronously so several `update` calls fired in the
      // same tick (e.g. the "Clear all" menu action clearing rollup rows,
      // pivot columns, and aggregations) compose instead of each rebuilding
      // from the pre-render snapshot and overwriting the previous clears.
      const next = { ...stateRef.current, ...patch };
      stateRef.current = next;
      set(next);
    },
    [set]
  );

  const {
    globalOn,
    rollupRowsOn,
    rollupRows,
    includeConstituents,
    nonAggregatedInRollup,
    aggregatesOn,
    aggregations: aggregationSettings,
    pivotColumnsOn,
    pivotColumns,
    filterableOn: placeholderFilterableOn,
    filterableColumns: placeholderFilterable,
  } = state;

  const setGlobalOn = useCallback(
    (next: boolean) => update({ globalOn: next }),
    [update]
  );

  const setRollupRows = useCallback(
    (next: string[]) => update({ rollupRows: next }),
    [update]
  );
  const setRollupRowsOn = useCallback(
    (next: boolean) => update({ rollupRowsOn: next }),
    [update]
  );
  const setIncludeConstituents = useCallback(
    (next: boolean) => update({ includeConstituents: next }),
    [update]
  );
  const setNonAggregatedInRollup = useCallback(
    (next: boolean) => update({ nonAggregatedInRollup: next }),
    [update]
  );
  const setAggregationSettings = useCallback(
    (next: AggregationSettings) => update({ aggregations: next }),
    [update]
  );
  const setAggregatesOn = useCallback(
    (next: boolean) => update({ aggregatesOn: next }),
    [update]
  );
  const setPivotColumns = useCallback(
    (next: string[]) => update({ pivotColumns: next }),
    [update]
  );
  const setPivotColumnsOn = useCallback(
    (next: boolean) => update({ pivotColumnsOn: next }),
    [update]
  );
  const setPlaceholderFilterable = useCallback(
    (next: string[]) => update({ filterableColumns: next }),
    [update]
  );
  const setPlaceholderFilterableOn = useCallback(
    (next: boolean) => update({ filterableOn: next }),
    [update]
  );

  // Clear every card in a single `update` so the global "Clear all" menu
  // action records exactly one undo step (rather than one per field).
  const clearAll = useCallback(() => {
    update({
      rollupRows: [],
      pivotColumns: [],
      aggregations: {
        ...stateRef.current.aggregations,
        aggregations: [],
      },
    });
  }, [update]);

  // Skip the mount reconcile: the model transform has already applied any
  // persisted intent, so on first render the cards are seeded to match the
  // model's current config and there are no user changes to write. Writing
  // it back would dispatch `PIVOT_BUILDER_CONFIG_CHANGED`, persist identical
  // state, and re-render the host one frame into the sidebar slide-in —
  // tearing the animation and (with equivalent-by-key Stack children)
  // remounting this page, re-running this effect → loop. Only persist once
  // the user actually changes a card.
  const hasReconciledRef = useRef(false);

  // Reconcile pivot/rollup/totals on every relevant state change. The
  // proxy owns ordering, diffing against last intent, and the mid-swap
  // queue for `totalsConfig` — see `applyPivotBuilderConfig`. Direct
  // writes to `model.rollupConfig` / `model.totalsConfig` are silently
  // dropped by the proxy (the host `IrisGridModelUpdater` writes those
  // on every render and the pivot-builder sidebar replaces those host
  // surfaces).
  useEffect(() => {
    if (!isPivotBuilderIrisGridModel(model)) return;

    if (!hasReconciledRef.current) {
      hasReconciledRef.current = true;
      return;
    }

    // Global toggle gates all three sections: when off, the reconcile
    // computes pivot/rollup/totals as if every card were toggled off,
    // which clears the modification from the model without disturbing
    // the per-card switch states or card contents.
    const rollupActive =
      globalOn && rollupAvailable && rollupRowsOn && rollupRows.length > 0;
    const aggsActive =
      globalOn &&
      aggregatesOn &&
      aggregationSettings.aggregations.some(
        a => a.selected.length > 0 || a.invert
      );

    const effectiveAggregationSettings = aggsActive
      ? aggregationSettings
      : EMPTY_AGGREGATION_SETTINGS;

    // Pivot is valid with empty rowKeys (PSP collapses to a single
    // row). It is NOT valid with an empty aggregations map, but that
    // `Count` fallback is synthesized quietly at the `createPivotTable`
    // call (see pivotBuilderModel) so it never leaks into the persisted
    // intent or the Aggregate values card. Also gate on PSP being
    // available on this worker; otherwise createPivotTable hangs and
    // the proxy times out after 10s.
    const pivotActive =
      globalOn &&
      pivotAvailable &&
      rollupAvailable &&
      pivotColumnsOn &&
      pivotColumns.length > 0;

    let pivot: PivotConfig | null = null;
    let rollup: ReturnType<typeof IrisGridUtils.getModelRollupConfig> | null =
      null;
    let totals: UITotalsTableConfig | null = null;

    if (pivotActive) {
      // Rollup rows become the pivot's row keys, but only when the rollup
      // card is active; disabling the rollup card while pivot is on must
      // collapse the pivot to a single row (otherwise the config is
      // unchanged and the table doesn't react).
      const rowKeys = rollupActive ? rollupRows : [];
      pivot = {
        rowKeys,
        columnKeys: pivotColumns,
        aggregations: aggregationsToPivot(effectiveAggregationSettings),
      };
    } else if (rollupActive) {
      // Rollup folds aggregations into its config; standalone totals row
      // is suppressed.
      rollup = IrisGridUtils.getModelRollupConfig(
        model.sourceTable.columns,
        {
          columns: rollupRows,
          showConstituents: includeConstituents,
          showNonAggregatedColumns: nonAggregatedInRollup,
          includeDescriptions: true as const,
        },
        effectiveAggregationSettings
      );
    } else {
      // No pivot, no rollup — aggregations become a standalone totals row.
      totals = IrisGridUtils.getModelTotalsConfig(
        model.sourceTable.columns,
        undefined,
        effectiveAggregationSettings
      );
    }

    // Fire-and-forget: the returned promise only settles after the async
    // inner-model swap; the sidebar doesn't await it (the reload transform
    // does). The no-op catch keeps no-floating-promises happy (settle never
    // rejects).
    model
      .applyPivotBuilderConfig({
        pivot,
        rollup,
        totals,
        // Persist the full card UI state (switch positions + contents) so the
        // sidebar restores exactly what the user left — the derived
        // pivot/rollup/totals above collapse "card off" and "card on but
        // empty" into the same value and so can't recover the switches (or a
        // toggled-off card's contents) on their own.
        ui: {
          globalOn,
          rollupRowsOn,
          rollupRows,
          includeConstituents,
          nonAggregatedInRollup,
          aggregatesOn,
          aggregations: aggregationSettings,
          pivotColumnsOn,
          pivotColumns,
          filterableOn: placeholderFilterableOn,
          filterableColumns: placeholderFilterable,
        },
      })
      .catch(() => {
        // settle() never rejects; no-op catch satisfies no-floating-promises.
      });
    // All reconcile inputs are fields of `state`; depend on the snapshot
    // identity rather than listing each field individually.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, state, pivotAvailable, rollupAvailable]);

  // Transient undo/redo keyboard shortcuts, scoped to this panel via a normal
  // React `onKeyDown` (so they never fire for sibling pivot-builder panels and
  // don't fight the host's global handlers). The handler only receives events
  // when focus is within our subtree, so we also restore focus to the
  // container when a control is unmounted from under the user (e.g. clicking
  // "Remove" deletes the focused button, which would otherwise drop focus to
  // `document.body` and break the shortcuts). See VisibilityOrderingBuilder for
  // the same `focusout` + null-`relatedTarget` pattern.
  const containerRef = useRef<HTMLDivElement>(null);
  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (GLOBAL_SHORTCUTS.UNDO.matchesEvent(event) && canUndo) {
        event.preventDefault();
        event.stopPropagation();
        undo();
      } else if (GLOBAL_SHORTCUTS.REDO.matchesEvent(event) && canRedo) {
        event.preventDefault();
        event.stopPropagation();
        redo();
      }
    },
    [canUndo, canRedo, undo, redo]
  );
  const handleBlur = useCallback((event: ReactFocusEvent<HTMLDivElement>) => {
    // `relatedTarget == null` means focus is moving to nothing - typically
    // because the previously focused control was just unmounted (Remove,
    // toggling a section off, etc.). Pull focus back to the container so
    // keyboard shortcuts keep working. If focus is moving to a real element
    // (another panel/control), leave it alone. The refocus is deferred to the
    // next frame because calling `focus()` synchronously inside a `focusout`
    // handler is ignored by the browser while focus is still mid-transition;
    // we also re-check that focus actually fell back to the body so we don't
    // steal it if something else claimed it in the meantime.
    if (event.relatedTarget != null) {
      return;
    }
    const container = containerRef.current;
    requestAnimationFrame(() => {
      if (
        container != null &&
        (document.activeElement == null ||
          document.activeElement === document.body)
      ) {
        container.focus();
      }
    });
  }, []);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      ref={containerRef}
      // `pivot-create-page` sets `height: 100%` so the empty area below the
      // cards still belongs to this focusable container - clicking it focuses
      // us and keeps the undo/redo shortcuts working, rather than focusing an
      // ancestor.
      //
      // `tabIndex={-1}` makes the container focusable via click and our
      // programmatic `focus()` (see `handleBlur`) without inserting it into the
      // keyboard Tab sequence. A Tab stop on the whole panel isn't useful (the
      // inner controls are individually tabbable and `handleKeyDown` also fires
      // for keydowns bubbling up from them), and as a keyboard-focused element
      // its `:focus-visible` outline wraps the entire scrolling region and gets
      // clipped into a broken shape by the sidebar's scroll container.
      className="iris-grid-plugin-sidebar-page pivot-create-page"
      role="menu"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <div
        // `height: 100%` on the container above means its `padding` sits at the
        // bottom of the fixed-height box rather than below the overflowing
        // content, so the last card butts up against the scroll bottom. The
        // `pivot-create-page-content` class adds bottom padding to the
        // scrolling content flow so a gap remains.
        className="pivot-create-page-content"
      >
        <PivotConfigSection
          availableColumns={allColumnNames}
          hiddenColumns={viewState.hiddenColumns}
          columnTypes={columnTypes}
          globalOn={globalOn}
          onGlobalOnChange={setGlobalOn}
          rollupRows={rollupRows}
          onRollupRowsChange={setRollupRows}
          rollupRowsOn={rollupRowsOn}
          onRollupRowsOnChange={setRollupRowsOn}
          rollupRowsDisabled={!rollupAvailable}
          pivotColumns={pivotColumns}
          onPivotColumnsChange={setPivotColumns}
          pivotColumnsOn={pivotColumnsOn}
          onPivotColumnsOnChange={setPivotColumnsOn}
          pivotColumnsDisabled={!pivotAvailable || !rollupAvailable}
          aggregationSettings={aggregationSettings}
          onAggregationSettingsChange={setAggregationSettings}
          aggregatesOn={aggregatesOn}
          onAggregatesOnChange={setAggregatesOn}
          filterableColumns={placeholderFilterable}
          onFilterableColumnsChange={setPlaceholderFilterable}
          filterableColumnsOn={placeholderFilterableOn}
          onFilterableColumnsOnChange={setPlaceholderFilterableOn}
          includeConstituents={includeConstituents}
          onIncludeConstituentsChange={setIncludeConstituents}
          nonAggregatedInRollup={nonAggregatedInRollup}
          onNonAggregatedInRollupChange={setNonAggregatedInRollup}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
          onClearAll={clearAll}
        />
      </div>
    </div>
  );
}

export default CreatePivotPage;
