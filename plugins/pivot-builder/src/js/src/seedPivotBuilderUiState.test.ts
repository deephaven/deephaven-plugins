import type {
  AggregationSettings,
  UITotalsTableConfig,
} from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import type { PivotBuilderUiState, PivotConfig } from './pivotBuilderModel';
import {
  EMPTY_AGGREGATION_SETTINGS,
  aggregationsFromOpMap,
  aggregationsFromPivot,
  aggregationsToPivot,
  seedAggregationSettings,
  seedPivotBuilderUiState,
} from './seedPivotBuilderUiState';

/**
 * A legacy iris-grid `RollupConfig` only carries `groupingColumns` and an
 * `operation → columns` aggregation map (the part the pivot-builder seeds
 * from). Cast through `unknown` so the test fixtures stay readable without
 * fabricating the full `dh.RollupConfig` surface.
 */
function makeRollupConfig(
  groupingColumns: string[],
  aggregations?: Record<string, readonly string[]>
): DhType.RollupConfig {
  return { groupingColumns, aggregations } as unknown as DhType.RollupConfig;
}

function makeTotals(partial: {
  operationMap?: Record<string, string[]>;
  operationOrder?: string[];
  showOnTop?: boolean;
}): UITotalsTableConfig {
  return partial as unknown as UITotalsTableConfig;
}

const agg = (
  operation: string,
  selected: string[],
  invert = false
): AggregationSettings['aggregations'][number] =>
  ({
    operation,
    selected,
    invert,
  }) as AggregationSettings['aggregations'][number];

describe('aggregationsFromOpMap', () => {
  it('maps each operation to its columns, defaulting invert to false', () => {
    expect(aggregationsFromOpMap({ Sum: ['x', 'y'], Avg: ['z'] })).toEqual([
      agg('Sum', ['x', 'y']),
      agg('Avg', ['z']),
    ]);
  });

  it('drops operations with an empty column list', () => {
    expect(aggregationsFromOpMap({ Sum: ['x'], Avg: [] })).toEqual([
      agg('Sum', ['x']),
    ]);
  });

  it('copies the column arrays (no shared references)', () => {
    const cols = ['x'];
    const [result] = aggregationsFromOpMap({ Sum: cols });
    expect(result.selected).not.toBe(cols);
    expect(result.selected).toEqual(['x']);
  });
});

describe('aggregationsFromPivot', () => {
  it('maps an ordered PivotAggregation array', () => {
    expect(
      aggregationsFromPivot([
        { operation: 'Sum', columns: ['x', 'y'] },
        { operation: 'Avg', columns: ['z'] },
      ])
    ).toEqual([agg('Sum', ['x', 'y']), agg('Avg', ['z'])]);
  });

  it('tolerates the legacy Record<operation, columns[]> shape', () => {
    expect(aggregationsFromPivot({ Sum: ['x'] })).toEqual([agg('Sum', ['x'])]);
  });

  it('drops entries with no columns', () => {
    expect(aggregationsFromPivot([{ operation: 'Sum', columns: [] }])).toEqual(
      []
    );
  });
});

describe('aggregationsToPivot', () => {
  it('is the inverse of aggregationsFromPivot for non-empty selections', () => {
    const settings: AggregationSettings = {
      aggregations: [agg('Sum', ['x', 'y']), agg('Avg', ['z'])],
      showOnTop: false,
    };
    expect(aggregationsToPivot(settings)).toEqual([
      { operation: 'Sum', columns: ['x', 'y'] },
      { operation: 'Avg', columns: ['z'] },
    ]);
  });

  it('drops aggregations with no selected columns', () => {
    const settings: AggregationSettings = {
      aggregations: [agg('Sum', []), agg('Avg', ['z'])],
      showOnTop: false,
    };
    expect(aggregationsToPivot(settings)).toEqual([
      { operation: 'Avg', columns: ['z'] },
    ]);
  });
});

describe('seedAggregationSettings', () => {
  it('returns the empty settings when neither rollup nor totals is present', () => {
    expect(seedAggregationSettings(null, null)).toBe(
      EMPTY_AGGREGATION_SETTINGS
    );
  });

  it('returns empty settings for a rollup with no aggregation map', () => {
    expect(seedAggregationSettings(makeRollupConfig(['c1']), null)).toBe(
      EMPTY_AGGREGATION_SETTINGS
    );
  });

  it('reads the rollup aggregation map when present (showOnTop forced false)', () => {
    expect(
      seedAggregationSettings(
        makeRollupConfig(['c1'], { Sum: ['x', 'y'] }),
        null
      )
    ).toEqual({
      aggregations: [agg('Sum', ['x', 'y'])],
      showOnTop: false,
    });
  });

  it('reverse-engineers totals operationMap into per-operation columns', () => {
    expect(
      seedAggregationSettings(
        null,
        makeTotals({
          operationMap: { x: ['Sum'], y: ['Sum', 'Avg'] },
          operationOrder: ['Sum', 'Avg'],
          showOnTop: true,
        })
      )
    ).toEqual({
      aggregations: [agg('Sum', ['x', 'y']), agg('Avg', ['y'])],
      showOnTop: true,
    });
  });

  it('falls back to operationMap key order when operationOrder is absent', () => {
    expect(
      seedAggregationSettings(
        null,
        makeTotals({ operationMap: { x: ['Sum'] }, showOnTop: true })
      )
    ).toEqual({
      aggregations: [agg('Sum', ['x'])],
      showOnTop: true,
    });
  });

  it('de-duplicates repeated operations in operationOrder', () => {
    expect(
      seedAggregationSettings(
        null,
        makeTotals({
          operationMap: { x: ['Sum'], y: ['Avg'] },
          operationOrder: ['Sum', 'Avg', 'Sum'],
          showOnTop: false,
        })
      )
    ).toEqual({
      aggregations: [agg('Sum', ['x']), agg('Avg', ['y'])],
      showOnTop: false,
    });
  });

  it('keeps showOnTop while producing no aggregations for an empty operationMap', () => {
    expect(
      seedAggregationSettings(
        null,
        makeTotals({ operationMap: {}, showOnTop: true })
      )
    ).toEqual({ aggregations: [], showOnTop: true });
  });

  it('prefers the rollup aggregation map over totals when both are present', () => {
    expect(
      seedAggregationSettings(
        makeRollupConfig(['c1'], { Sum: ['x'] }),
        makeTotals({ operationMap: { y: ['Avg'] }, showOnTop: true })
      )
    ).toEqual({
      aggregations: [agg('Sum', ['x'])],
      showOnTop: false,
    });
  });
});

describe('seedPivotBuilderUiState legacy hydration', () => {
  it('returns all-default state when nothing is persisted', () => {
    expect(
      seedPivotBuilderUiState({
        uiIntent: null,
        pivotIntent: null,
        rollupIntent: null,
        totalsIntent: null,
      })
    ).toEqual({
      globalOn: true,
      rollupRowsOn: true,
      rollupRows: [],
      includeConstituents: true,
      nonAggregatedInRollup: true,
      aggregatesOn: true,
      aggregations: EMPTY_AGGREGATION_SETTINGS,
      pivotColumnsOn: true,
      pivotColumns: [],
      filterableOn: true,
      filterableColumns: [],
    });
  });

  it('hydrates rollup rows and aggregations from a legacy rollupConfig', () => {
    const seeded = seedPivotBuilderUiState({
      uiIntent: null,
      pivotIntent: null,
      rollupIntent: makeRollupConfig(['c1', 'c2'], { Sum: ['x', 'y'] }),
      totalsIntent: null,
    });
    expect(seeded.rollupRows).toEqual(['c1', 'c2']);
    expect(seeded.rollupRowsOn).toBe(true);
    expect(seeded.aggregatesOn).toBe(true);
    expect(seeded.aggregations).toEqual({
      aggregations: [agg('Sum', ['x', 'y'])],
      showOnTop: false,
    });
  });

  it('hydrates aggregations and showOnTop from legacy totals state', () => {
    const seeded = seedPivotBuilderUiState({
      uiIntent: null,
      pivotIntent: null,
      rollupIntent: null,
      totalsIntent: makeTotals({
        operationMap: { x: ['Sum'], y: ['Sum'] },
        operationOrder: ['Sum'],
        showOnTop: true,
      }),
    });
    expect(seeded.rollupRows).toEqual([]);
    expect(seeded.aggregations).toEqual({
      aggregations: [agg('Sum', ['x', 'y'])],
      showOnTop: true,
    });
  });

  it('reads includeConstituents from the legacy rollupConfig when present', () => {
    const rollupIntent = makeRollupConfig(['c1']);
    (rollupIntent as { includeConstituents?: boolean }).includeConstituents =
      false;
    const seeded = seedPivotBuilderUiState({
      uiIntent: null,
      pivotIntent: null,
      rollupIntent,
      totalsIntent: null,
    });
    expect(seeded.includeConstituents).toBe(false);
  });

  it('seeds from the pivot intent over the legacy rollup/totals fallbacks', () => {
    const pivotIntent: PivotConfig = {
      rowKeys: ['r1'],
      columnKeys: ['col1'],
      aggregations: [{ operation: 'Avg', columns: ['m1'] }],
    };
    const seeded = seedPivotBuilderUiState({
      uiIntent: null,
      pivotIntent,
      rollupIntent: makeRollupConfig(['ignored'], { Sum: ['ignored'] }),
      totalsIntent: makeTotals({ operationMap: { ignored: ['Sum'] } }),
    });
    expect(seeded.rollupRows).toEqual(['r1']);
    expect(seeded.pivotColumns).toEqual(['col1']);
    expect(seeded.aggregations).toEqual({
      aggregations: [agg('Avg', ['m1'])],
      showOnTop: false,
    });
  });

  it('restores persisted UI state verbatim, ignoring derived fallbacks', () => {
    const uiIntent: PivotBuilderUiState = {
      globalOn: false,
      rollupRowsOn: false,
      rollupRows: ['saved'],
      includeConstituents: false,
      nonAggregatedInRollup: false,
      aggregatesOn: false,
      aggregations: { aggregations: [agg('Min', ['s'])], showOnTop: true },
      pivotColumnsOn: false,
      pivotColumns: ['savedCol'],
      filterableOn: false,
      filterableColumns: ['f1'],
    };
    const seeded = seedPivotBuilderUiState({
      uiIntent,
      pivotIntent: {
        rowKeys: ['ignored'],
        columnKeys: ['ignored'],
        aggregations: [{ operation: 'Sum', columns: ['ignored'] }],
      },
      rollupIntent: makeRollupConfig(['ignored'], { Sum: ['ignored'] }),
      totalsIntent: makeTotals({ operationMap: { ignored: ['Sum'] } }),
    });
    expect(seeded).toEqual(uiIntent);
  });
});
