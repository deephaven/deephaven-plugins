import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type IrisGridModel,
  IrisGridUtils,
  type AggregationSettings,
  type UITotalsTableConfig,
} from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  isPivotBuilderIrisGridModel,
  type PivotConfig,
  type PivotBuilderUiState,
} from './pivotBuilderModel';
import { PivotConfigSection } from './PivotConfigSection';
import { usePivotServiceStatus } from './PivotServiceContext';

// `IrisGridTableOptionsPageProps` is not yet in the installed
// `@deephaven/iris-grid` typings (added in a newer host build), but is
// emitted at runtime. Inline-type the prop until the dep bumps.
type IrisGridTableOptionsPageProps = { model: IrisGridModel };

// Statics added to IrisGridUtils after the installed v1.18.0 — present at
// runtime via the host's workspace build. Cast to access until the
// installed @deephaven/iris-grid typings are bumped.
type IrisGridUtilsWithExtras = typeof IrisGridUtils & {
  getModelTotalsConfig: (
    columns: readonly { name: string }[],
    rollupConfig:
      | {
          columns?: readonly string[];
          showConstituents?: boolean;
          showNonAggregatedColumns?: boolean;
          includeDescriptions?: boolean;
        }
      | undefined,
    aggregationSettings: AggregationSettings
  ) => UITotalsTableConfig | null;
};
const IrisGridUtilsExt = IrisGridUtils as IrisGridUtilsWithExtras;

const EMPTY_AGGREGATION_SETTINGS: AggregationSettings = {
  aggregations: [],
  showOnTop: false,
};

/**
 * Convert an `operation → columns` map (as stored on `RollupConfig` and
 * `PivotConfig`) into the host's `AggregationSettings.aggregations`
 * array. The `invert` flag is not recoverable from a map and defaults
 * to `false`.
 */
function aggregationsFromOpMap(
  map: Record<string, readonly string[]>
): AggregationSettings['aggregations'] {
  return Object.entries(map)
    .filter(([, cols]) => (cols?.length ?? 0) > 0)
    .map(([operation, cols]) => ({
      operation:
        operation as AggregationSettings['aggregations'][number]['operation'],
      selected: [...(cols ?? [])],
      invert: false,
    }));
}

/**
 * Reverse-engineer `AggregationSettings` from a `RollupConfig` or
 * `UITotalsTableConfig` so the sidebar's Aggregate values card hydrates
 * from the proxy's last-seen state. The `invert` flag is not
 * recoverable from either source and defaults to `false`.
 */
function seedAggregationSettings(
  rollup: DhType.RollupConfig | null,
  totals: UITotalsTableConfig | null
): AggregationSettings {
  const rollupAggs = (
    rollup as { aggregations?: Record<string, readonly string[]> } | null
  )?.aggregations;
  if (rollupAggs) {
    return {
      aggregations: aggregationsFromOpMap(rollupAggs),
      showOnTop: false,
    };
  }
  if (totals?.operationMap) {
    const byOp = new Map<string, string[]>();
    Object.entries(totals.operationMap).forEach(([col, ops]) => {
      (ops ?? []).forEach(op => {
        const list = byOp.get(op) ?? [];
        list.push(col);
        byOp.set(op, list);
      });
    });
    const order = totals.operationOrder ?? [...byOp.keys()];
    const seen = new Set<string>();
    const aggregations = order
      .filter(op => {
        if (seen.has(op)) return false;
        seen.add(op);
        return byOp.has(op);
      })
      .map(op => ({
        operation:
          op as AggregationSettings['aggregations'][number]['operation'],
        selected: byOp.get(op) ?? [],
        invert: false,
      }));
    return { aggregations, showOnTop: totals.showOnTop ?? false };
  }
  return EMPTY_AGGREGATION_SETTINGS;
}

function aggregationsToPivot(
  settings: AggregationSettings
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  settings.aggregations.forEach(agg => {
    if (agg.selected.length === 0) return;
    const op = String(agg.operation);
    out[op] = [...(out[op] ?? []), ...agg.selected];
  });
  return out;
}

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
}: IrisGridTableOptionsPageProps): JSX.Element {
  const isProxy = isPivotBuilderIrisGridModel(model);
  const pivotServiceStatus = usePivotServiceStatus();
  const pivotAvailable = pivotServiceStatus === 'ready';

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

  const [rollupRows, setRollupRows] = useState<string[]>(() => {
    if (uiIntent != null) return [...uiIntent.rollupRows];
    if (pivotIntent != null) return [...pivotIntent.rowKeys];
    return rollupIntent?.groupingColumns?.map((c: unknown) => String(c)) ?? [];
  });
  const [rollupRowsOn, setRollupRowsOn] = useState<boolean>(
    () => uiIntent?.rollupRowsOn ?? true
  );
  const [includeConstituents, setIncludeConstituents] = useState<boolean>(
    () =>
      uiIntent?.includeConstituents ?? rollupIntent?.includeConstituents ?? true
  );
  const [nonAggregatedInRollup, setNonAggregatedInRollup] = useState<boolean>(
    () => uiIntent?.nonAggregatedInRollup ?? true
  );

  // Aggregate values state. Source-of-truth shape matches the host's
  // `AggregationSettings` so we can hand it straight to
  // `IrisGridUtils.getModelRollupConfig` / `.getModelTotalsConfig`.
  const [aggregationSettings, setAggregationSettings] =
    useState<AggregationSettings>(() => {
      if (uiIntent != null) return uiIntent.aggregations;
      if (pivotIntent != null) {
        return {
          aggregations: aggregationsFromOpMap(pivotIntent.aggregations),
          showOnTop: false,
        };
      }
      return seedAggregationSettings(rollupIntent, totalsIntent);
    });
  const [aggregatesOn, setAggregatesOn] = useState<boolean>(
    () => uiIntent?.aggregatesOn ?? true
  );

  const [pivotColumns, setPivotColumns] = useState<string[]>(() => {
    if (uiIntent != null) return [...uiIntent.pivotColumns];
    return pivotIntent != null ? [...pivotIntent.columnKeys] : [];
  });
  const [pivotColumnsOn, setPivotColumnsOn] = useState<boolean>(
    () => uiIntent?.pivotColumnsOn ?? true
  );
  const [placeholderFilterable, setPlaceholderFilterable] = useState<string[]>(
    () => uiIntent?.filterableColumns ?? []
  );
  const [placeholderFilterableOn, setPlaceholderFilterableOn] =
    useState<boolean>(() => uiIntent?.filterableOn ?? true);

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

    const rollupActive = rollupRowsOn && rollupRows.length > 0;
    const aggsActive =
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
      pivotAvailable && pivotColumnsOn && pivotColumns.length > 0;

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
      totals = IrisGridUtilsExt.getModelTotalsConfig(
        model.sourceTable.columns,
        undefined,
        effectiveAggregationSettings
      );
    }

    model.applyPivotBuilderConfig({
      pivot,
      rollup,
      totals,
      // Persist the full card UI state (switch positions + contents) so the
      // sidebar restores exactly what the user left — the derived
      // pivot/rollup/totals above collapse "card off" and "card on but
      // empty" into the same value and so can't recover the switches (or a
      // toggled-off card's contents) on their own.
      ui: {
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
    });
  }, [
    model,
    rollupRowsOn,
    rollupRows,
    includeConstituents,
    nonAggregatedInRollup,
    pivotColumnsOn,
    pivotColumns,
    aggregatesOn,
    aggregationSettings,
    placeholderFilterableOn,
    placeholderFilterable,
    pivotAvailable,
  ]);

  return (
    <div className="iris-grid-plugin-sidebar-page" style={{ padding: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PivotConfigSection
          availableColumns={allColumnNames}
          columnTypes={columnTypes}
          rollupRows={rollupRows}
          onRollupRowsChange={setRollupRows}
          rollupRowsOn={rollupRowsOn}
          onRollupRowsOnChange={setRollupRowsOn}
          pivotColumns={pivotColumns}
          onPivotColumnsChange={setPivotColumns}
          pivotColumnsOn={pivotColumnsOn}
          onPivotColumnsOnChange={setPivotColumnsOn}
          pivotColumnsDisabled={!pivotAvailable}
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
        />
      </div>
    </div>
  );
}

export default CreatePivotPage;
