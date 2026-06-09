import { useEffect, useMemo, useState } from 'react';
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
  settings: AggregationSettings,
  fallbackCountColumn: string | undefined
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  settings.aggregations.forEach(agg => {
    if (agg.selected.length === 0) return;
    const op = String(agg.operation);
    out[op] = [...(out[op] ?? []), ...agg.selected];
  });
  if (Object.keys(out).length === 0 && fallbackCountColumn != null) {
    out.Count = [fallbackCountColumn];
  }
  return out;
}

/**
 * Sidebar `configPage` for the Create Pivot menu item.
 *
 * Renders the card-based config panel. The Rollup rows and Aggregate
 * values cards are wired to `model.rollupConfig` / `model.totalsConfig`;
 * the other two cards are mock-data only (see
 * `plans/DH-21476-pivot-builder-rollup-rows-wiring.md` and
 * `plans/DH-21476-pivot-builder-aggregate-values-wiring.md`).
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
  const allColumnNames = useMemo(
    () => columns.map((c: { name: string }) => c.name),
    [columns]
  );
  const columnTypes = useMemo(() => {
    const map: Record<string, string> = {};
    columns.forEach((c: { name: string; type: string }) => {
      map[c.name] = c.type;
    });
    return map;
  }, [columns]);

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

  const [mockRollupRows, setMockRollupRows] = useState<string[]>(() => {
    if (pivotIntent != null) return [...pivotIntent.rowKeys];
    return rollupIntent?.groupingColumns?.map((c: unknown) => String(c)) ?? [];
  });
  const [mockRollupRowsOn, setMockRollupRowsOn] = useState<boolean>(true);
  const [mockIncludeConstituents, setMockIncludeConstituents] =
    useState<boolean>(() => rollupIntent?.includeConstituents ?? true);
  const [mockNonAggregatedInRollup, setMockNonAggregatedInRollup] =
    useState(true);

  // Aggregate values state. Source-of-truth shape matches the host's
  // `AggregationSettings` so we can hand it straight to
  // `IrisGridUtils.getModelRollupConfig` / `.getModelTotalsConfig`.
  const [aggregationSettings, setAggregationSettings] =
    useState<AggregationSettings>(() => {
      if (pivotIntent != null) {
        return {
          aggregations: aggregationsFromOpMap(pivotIntent.aggregations),
          showOnTop: false,
        };
      }
      return seedAggregationSettings(rollupIntent, totalsIntent);
    });
  const [aggregatesOn, setAggregatesOn] = useState(true);

  const [mockPivotColumns, setMockPivotColumns] = useState<string[]>(() =>
    pivotIntent != null ? [...pivotIntent.columnKeys] : []
  );
  const [mockPivotColumnsOn, setMockPivotColumnsOn] = useState(true);
  const [mockFilterable, setMockFilterable] = useState<string[]>([]);
  const [mockFilterableOn, setMockFilterableOn] = useState(true);

  // Reconcile pivot/rollup/totals on every relevant state change. The
  // proxy owns ordering, diffing against last intent, and the mid-swap
  // queue for `totalsConfig` — see `applyPivotBuilderConfig`. Direct
  // writes to `model.rollupConfig` / `model.totalsConfig` are silently
  // dropped by the proxy (the host `IrisGridModelUpdater` writes those
  // on every render and the pivot-builder sidebar replaces those host
  // surfaces).
  useEffect(() => {
    if (!isPivotBuilderIrisGridModel(model)) return;

    const rollupActive = mockRollupRowsOn && mockRollupRows.length > 0;
    const aggsActive =
      aggregatesOn &&
      aggregationSettings.aggregations.some(
        a => a.selected.length > 0 || a.invert
      );

    const effectiveAggregationSettings = aggsActive
      ? aggregationSettings
      : EMPTY_AGGREGATION_SETTINGS;

    // Pivot is valid with empty rowKeys (PSP collapses to a single
    // row). It is NOT valid with an empty aggregations map, so we
    // synthesize a `Count` over the first source column that isn't
    // already used as a row or pivot key. Also gate on PSP being
    // available on this worker; otherwise createPivotTable hangs and
    // the proxy times out after 10s.
    const pivotActive =
      pivotAvailable && mockPivotColumnsOn && mockPivotColumns.length > 0;

    let pivot: PivotConfig | null = null;
    let rollup: ReturnType<typeof IrisGridUtils.getModelRollupConfig> | null =
      null;
    let totals: UITotalsTableConfig | null = null;

    if (pivotActive) {
      const used = new Set<string>([...mockRollupRows, ...mockPivotColumns]);
      const countFallback = allColumnNames.find(c => !used.has(c));
      pivot = {
        rowKeys: mockRollupRows,
        columnKeys: mockPivotColumns,
        aggregations: aggregationsToPivot(
          effectiveAggregationSettings,
          countFallback
        ),
      };
    } else if (rollupActive) {
      // Rollup folds aggregations into its config; standalone totals row
      // is suppressed.
      rollup = IrisGridUtils.getModelRollupConfig(
        model.sourceTable.columns,
        {
          columns: mockRollupRows,
          showConstituents: mockIncludeConstituents,
          showNonAggregatedColumns: mockNonAggregatedInRollup,
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

    model.applyPivotBuilderConfig({ pivot, rollup, totals });
  }, [
    model,
    mockRollupRowsOn,
    mockRollupRows,
    mockIncludeConstituents,
    mockNonAggregatedInRollup,
    mockPivotColumnsOn,
    mockPivotColumns,
    aggregatesOn,
    aggregationSettings,
    allColumnNames,
    pivotAvailable,
  ]);

  return (
    <div className="iris-grid-plugin-sidebar-page" style={{ padding: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PivotConfigSection
          availableColumns={allColumnNames}
          columnTypes={columnTypes}
          rollupRows={mockRollupRows}
          onRollupRowsChange={setMockRollupRows}
          rollupRowsOn={mockRollupRowsOn}
          onRollupRowsOnChange={setMockRollupRowsOn}
          pivotColumns={mockPivotColumns}
          onPivotColumnsChange={setMockPivotColumns}
          pivotColumnsOn={mockPivotColumnsOn}
          onPivotColumnsOnChange={setMockPivotColumnsOn}
          pivotColumnsDisabled={!pivotAvailable}
          aggregationSettings={aggregationSettings}
          onAggregationSettingsChange={setAggregationSettings}
          aggregatesOn={aggregatesOn}
          onAggregatesOnChange={setAggregatesOn}
          filterableColumns={mockFilterable}
          onFilterableColumnsChange={setMockFilterable}
          filterableColumnsOn={mockFilterableOn}
          onFilterableColumnsOnChange={setMockFilterableOn}
          includeConstituents={mockIncludeConstituents}
          onIncludeConstituentsChange={setMockIncludeConstituents}
          nonAggregatedInRollup={mockNonAggregatedInRollup}
          onNonAggregatedInRollupChange={setMockNonAggregatedInRollup}
        />
      </div>
    </div>
  );
}

export default CreatePivotPage;
