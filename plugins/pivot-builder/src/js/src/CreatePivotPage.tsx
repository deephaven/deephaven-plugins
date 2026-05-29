import { useEffect, useMemo, useState } from 'react';
import {
  IrisGridUtils,
  type AggregationSettings,
  type IrisGridModel,
  type UITotalsTableConfig,
} from '@deephaven/iris-grid';
import deepEqual from 'fast-deep-equal';
import Log from '@deephaven/log';
import { isPivotBuilderIrisGridModel } from './pivotBuilderModel';
import { PivotConfigSection } from './PivotConfigSection';

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

const log = Log.module('@deephaven/js-plugin-pivot-builder/CreatePivotPage');

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

  // Seed Rollup rows from the existing `model.rollupConfig` once.
  // `showNonAggregatedColumns` is UI-only (not faithfully recoverable
  // from a `dh.RollupConfig`) so it defaults to `true`.
  const [mockRollupRows, setMockRollupRows] = useState<string[]>(() => {
    const cfg = model.rollupConfig;
    return cfg?.groupingColumns?.map((c: unknown) => String(c)) ?? [];
  });
  const [mockRollupRowsOn, setMockRollupRowsOn] = useState<boolean>(true);
  const [mockIncludeConstituents, setMockIncludeConstituents] =
    useState<boolean>(() => model.rollupConfig?.includeConstituents ?? true);
  const [mockNonAggregatedInRollup, setMockNonAggregatedInRollup] =
    useState(true);

  // Aggregate values state. Source-of-truth shape matches the host's
  // `AggregationSettings` so we can hand it straight to
  // `IrisGridUtils.getModelRollupConfig` / `.getModelTotalsConfig`.
  const [aggregationSettings, setAggregationSettings] =
    useState<AggregationSettings>(EMPTY_AGGREGATION_SETTINGS);
  const [aggregatesOn, setAggregatesOn] = useState(true);

  // Mock-data state for the remaining cards.
  const [mockPivotColumns, setMockPivotColumns] = useState<string[]>([]);
  const [mockPivotColumnsOn, setMockPivotColumnsOn] = useState(true);
  const [mockFilterable, setMockFilterable] = useState<string[]>([]);
  const [mockFilterableOn, setMockFilterableOn] = useState(true);

  // Combined effect that owns BOTH `model.rollupConfig` and
  // `model.totalsConfig`. The two surfaces are mutually exclusive in
  // IrisGrid: when a rollup is active, totals are suppressed and
  // aggregations are folded into the rollup config; otherwise
  // aggregations become a standalone totals row.
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

    if (rollupActive) {
      const uiConfig = {
        columns: mockRollupRows,
        showConstituents: mockIncludeConstituents,
        showNonAggregatedColumns: mockNonAggregatedInRollup,
        includeDescriptions: true as const,
      };
      const nextRollup = IrisGridUtils.getModelRollupConfig(
        model.sourceTable.columns,
        uiConfig,
        effectiveAggregationSettings
      );
      if (!deepEqual(nextRollup, model.rollupConfig)) {
        log.debug('Applying rollupConfig (rollup active)', nextRollup);
        // eslint-disable-next-line no-param-reassign
        model.rollupConfig = nextRollup;
      }
      if (model.totalsConfig != null) {
        log.debug('Clearing totalsConfig (rollup wins)');
        // eslint-disable-next-line no-param-reassign
        model.totalsConfig = null;
      }
      return;
    }

    // No rollup: clear it, then push totals (or null).
    if (model.rollupConfig != null) {
      log.debug('Clearing rollupConfig (rollup inactive)');
      // eslint-disable-next-line no-param-reassign
      model.rollupConfig = null;
    }
    const nextTotals = IrisGridUtilsExt.getModelTotalsConfig(
      model.sourceTable.columns,
      undefined,
      effectiveAggregationSettings
    );
    if (!deepEqual(nextTotals, model.totalsConfig)) {
      log.debug('Applying totalsConfig (standalone aggregations)', nextTotals);
      // eslint-disable-next-line no-param-reassign
      model.totalsConfig = nextTotals;
    }
  }, [
    model,
    mockRollupRowsOn,
    mockRollupRows,
    mockIncludeConstituents,
    mockNonAggregatedInRollup,
    aggregatesOn,
    aggregationSettings,
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
