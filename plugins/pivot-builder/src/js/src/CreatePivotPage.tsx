import { useEffect, useMemo, useState } from 'react';
import { IrisGridUtils, type IrisGridModel } from '@deephaven/iris-grid';
import deepEqual from 'fast-deep-equal';
import Log from '@deephaven/log';
import { isPivotBuilderIrisGridModel } from './pivotBuilderModel';
import { PivotConfigSection, type AggregateEntry } from './PivotConfigSection';

// `IrisGridTableOptionsPageProps` is not yet in the installed
// `@deephaven/iris-grid` typings (added in a newer host build), but is
// emitted at runtime. Inline-type the prop until the dep bumps.
type IrisGridTableOptionsPageProps = { model: IrisGridModel };

const log = Log.module('@deephaven/js-plugin-pivot-builder/CreatePivotPage');

/**
 * Sidebar `configPage` for the Create Pivot menu item.
 *
 * Renders the card-based config panel. The Rollup rows card is wired to
 * `model.rollupConfig`; the other three cards are mock-data only (see
 * `plans/DH-21476-pivot-builder-rollup-rows-wiring.md`).
 *
 * The legacy column-selector UI below the cards is intentionally removed
 * — it duplicated controls now owned by the cards and will be partially
 * revived once Pivot columns / Aggregate values are wired.
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

  // Seed Rollup rows from the existing `model.rollupConfig` once. There's
  // no faithful way to recover `showNonAggregatedColumns` from a
  // `dh.RollupConfig` (it's a UI-only flag that controls whether
  // `getModelRollupConfig` synthesises a `First` aggregation), so it
  // defaults to `true`.
  const [mockRollupRows, setMockRollupRows] = useState<string[]>(() => {
    const cfg = model.rollupConfig;
    return cfg?.groupingColumns?.map((c: unknown) => String(c)) ?? [];
  });
  const [mockRollupRowsOn, setMockRollupRowsOn] = useState<boolean>(true);
  const [mockIncludeConstituents, setMockIncludeConstituents] =
    useState<boolean>(() => model.rollupConfig?.includeConstituents ?? true);
  const [mockNonAggregatedInRollup, setMockNonAggregatedInRollup] =
    useState(true);

  // Mock-data state for the remaining cards. Not yet wired to any model
  // setter — see plans/DH-21476-pivot-builder-rollup-rows-wiring.md.
  const [mockPivotColumns, setMockPivotColumns] = useState<string[]>([]);
  const [mockPivotColumnsOn, setMockPivotColumnsOn] = useState(true);
  const [mockAggregates, setMockAggregates] = useState<AggregateEntry[]>([
    { id: 'seed-sum', fn: 'Sum', columns: ['Price', 'Size'] },
  ]);
  const [mockAggregatesOn, setMockAggregatesOn] = useState(true);
  const [mockFilterable, setMockFilterable] = useState<string[]>([]);
  const [mockFilterableOn, setMockFilterableOn] = useState(true);

  // Sync the Rollup rows card to `model.rollupConfig`. The host's
  // `IrisGridProxyModel` swaps the inner model to `table.rollup(cfg)`
  // when this property is assigned (mirroring the existing Rollup Rows
  // sidebar).
  useEffect(() => {
    if (!isPivotBuilderIrisGridModel(model)) return;

    const uiConfig =
      mockRollupRowsOn && mockRollupRows.length > 0
        ? {
            columns: mockRollupRows,
            showConstituents: mockIncludeConstituents,
            showNonAggregatedColumns: mockNonAggregatedInRollup,
            includeDescriptions: true as const,
          }
        : undefined;

    const next = IrisGridUtils.getModelRollupConfig(
      model.sourceTable.columns,
      uiConfig,
      { aggregations: [], showOnTop: false }
    );

    if (!deepEqual(next, model.rollupConfig)) {
      log.debug('Applying rollupConfig from Rollup rows card', next);
      // eslint-disable-next-line no-param-reassign
      model.rollupConfig = next;
    }
  }, [
    model,
    mockRollupRowsOn,
    mockRollupRows,
    mockIncludeConstituents,
    mockNonAggregatedInRollup,
  ]);

  return (
    <div className="iris-grid-plugin-sidebar-page" style={{ padding: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <PivotConfigSection
          availableColumns={allColumnNames}
          rollupRows={mockRollupRows}
          onRollupRowsChange={setMockRollupRows}
          rollupRowsOn={mockRollupRowsOn}
          onRollupRowsOnChange={setMockRollupRowsOn}
          pivotColumns={mockPivotColumns}
          onPivotColumnsChange={setMockPivotColumns}
          pivotColumnsOn={mockPivotColumnsOn}
          onPivotColumnsOnChange={setMockPivotColumnsOn}
          aggregates={mockAggregates}
          onAggregatesChange={setMockAggregates}
          aggregatesOn={mockAggregatesOn}
          onAggregatesOnChange={setMockAggregatesOn}
          filterableColumns={mockFilterable}
          onFilterableColumnsChange={setMockFilterable}
          filterableColumnsOn={mockFilterableOn}
          onFilterableColumnsOnChange={setMockFilterableOn}
          includeConstituents={mockIncludeConstituents}
          onIncludeConstituentsChange={setMockIncludeConstituents}
          nonAggregatedInRollup={mockNonAggregatedInRollup}
          onNonAggregatedInRollupChange={setMockNonAggregatedInRollup}
        />
        {/*
          TODO(DH-21476): legacy column-selector UI (Row keys / Column
          keys / aggregation function / Columns / Apply / Reset) was
          removed in favour of the card-based PivotConfigSection above.
          The previous implementation lives in git history (commit
          "Mock builder UI") and will be partially revived as Pivot
          columns / Aggregate values get wired to `model.pivotConfig`.
        */}
      </div>
    </div>
  );
}

export default CreatePivotPage;
