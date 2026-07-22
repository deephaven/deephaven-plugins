import type { dh as DhType } from '@deephaven/jsapi-types';
import type { UITotalsTableConfig } from '@deephaven/iris-grid';
import {
  findStaleColumnRefs,
  sanitizeRollupConfig,
  sanitizeTotalsConfig,
  type PivotBuilderConfig,
  type PivotConfig,
} from './pivotBuilderModel';

/**
 * Minimal `dh.Column` fixture — only `name`/`type` are read. Cast through
 * `unknown` so we don't fabricate the full column surface.
 */
function col(name: string, type: string): DhType.Column {
  return { name, type } as unknown as DhType.Column;
}

const STRING = 'java.lang.String';
const INT = 'int';
const DOUBLE = 'double';

const columns = [
  col('name', STRING),
  col('region', STRING),
  col('price', DOUBLE),
  col('qty', INT),
];

function makeRollup(
  groupingColumns: string[],
  aggregations?: Record<string, string[]>
): DhType.RollupConfig {
  return {
    groupingColumns,
    aggregations,
  } as unknown as DhType.RollupConfig;
}

function makeTotals(
  operationMap: Record<string, string[]>
): UITotalsTableConfig {
  return {
    operationMap,
    operationOrder: [],
    showOnTop: false,
    defaultOperation: 'Skip',
  } as unknown as UITotalsTableConfig;
}

function makePivot(partial: Partial<PivotConfig>): PivotConfig {
  return { rowKeys: [], columnKeys: [], aggregations: [], ...partial };
}

function config(partial: Partial<PivotBuilderConfig>): PivotBuilderConfig {
  return { pivot: null, rollup: null, totals: null, ...partial };
}

const NONE = { rollupColumns: [], totalsColumns: [], pivotColumns: [] };

describe('findStaleColumnRefs', () => {
  it('returns all-empty arrays when nothing is stale', () => {
    expect(
      findStaleColumnRefs(
        config({
          rollup: makeRollup(['region'], { Sum: ['price'] }),
          pivot: makePivot({
            rowKeys: ['name'],
            aggregations: [{ operation: 'Sum', columns: ['qty'] }],
          }),
          totals: makeTotals({ price: ['Sum'] }),
        }),
        columns
      )
    ).toEqual(NONE);
  });

  it('reports rollup-only stale references (grouping + aggregations)', () => {
    expect(
      findStaleColumnRefs(
        config({
          rollup: makeRollup(['gone'], { Sum: ['price', 'alsoGone'] }),
        }),
        columns
      )
    ).toEqual({
      rollupColumns: ['gone', 'alsoGone'],
      totalsColumns: [],
      pivotColumns: [],
    });
  });

  it('reports totals-only stale references (operationMap keys)', () => {
    expect(
      findStaleColumnRefs(
        config({ totals: makeTotals({ price: ['Sum'], missing: ['Avg'] }) }),
        columns
      )
    ).toEqual({
      rollupColumns: [],
      totalsColumns: ['missing'],
      pivotColumns: [],
    });
  });

  it('reports pivot-only stale references (rowKeys/columnKeys/aggregations)', () => {
    expect(
      findStaleColumnRefs(
        config({
          pivot: makePivot({
            rowKeys: ['ghost'],
            columnKeys: ['region', 'phantom'],
            aggregations: [{ operation: 'Sum', columns: ['spectre'] }],
          }),
        }),
        columns
      )
    ).toEqual({
      rollupColumns: [],
      totalsColumns: [],
      pivotColumns: ['ghost', 'phantom', 'spectre'],
    });
  });

  it('reports stale references across all three sections at once', () => {
    const report = findStaleColumnRefs(
      config({
        rollup: makeRollup(['rGone']),
        totals: makeTotals({ tGone: ['Sum'] }),
        pivot: makePivot({ rowKeys: ['pGone'] }),
      }),
      columns
    );
    expect(report).toEqual({
      rollupColumns: ['rGone'],
      totalsColumns: ['tGone'],
      pivotColumns: ['pGone'],
    });
  });

  it('reports rollup + totals (two-way) without touching pivot', () => {
    expect(
      findStaleColumnRefs(
        config({
          rollup: makeRollup(['rGone']),
          totals: makeTotals({ tGone: ['Sum'] }),
        }),
        columns
      )
    ).toEqual({
      rollupColumns: ['rGone'],
      totalsColumns: ['tGone'],
      pivotColumns: [],
    });
  });

  it('de-duplicates repeated names within a section', () => {
    expect(
      findStaleColumnRefs(
        config({
          rollup: makeRollup(['gone', 'gone'], {
            Sum: ['gone'],
            Avg: ['gone'],
          }),
        }),
        columns
      )
    ).toEqual({ rollupColumns: ['gone'], totalsColumns: [], pivotColumns: [] });
  });

  it('keeps the same stale name in separate sections (dedupe is per-section)', () => {
    expect(
      findStaleColumnRefs(
        config({
          rollup: makeRollup(['shared']),
          pivot: makePivot({ rowKeys: ['shared'] }),
        }),
        columns
      )
    ).toEqual({
      rollupColumns: ['shared'],
      totalsColumns: [],
      pivotColumns: ['shared'],
    });
  });

  it('does NOT report type-drift (column exists but wrong type) — existence only', () => {
    // `name` is a string; `Sum` over it is type-invalid, but the column still
    // exists, so it is not a "stale/missing" reference. (Build-time
    // sanitization drops it; the notification is only about missing columns.)
    expect(
      findStaleColumnRefs(
        config({ totals: makeTotals({ name: ['Sum'] }) }),
        columns
      )
    ).toEqual(NONE);
  });

  it('handles the legacy Record<operation, columns[]> pivot aggregations shape', () => {
    const legacyPivot = {
      rowKeys: [],
      columnKeys: [],
      aggregations: { Sum: ['price', 'gone'] },
    } as unknown as PivotConfig;
    expect(findStaleColumnRefs(config({ pivot: legacyPivot }), columns)).toEqual(
      { rollupColumns: [], totalsColumns: [], pivotColumns: ['gone'] }
    );
  });

  it('handles a v1-migrated config (bare PivotConfig wrapped with null rollup/totals)', () => {
    // Mirrors PivotBuilderPanelMiddleware's v1→v2 migration:
    // `{ pivot: state, rollup: null, totals: null }`.
    const v1State: PivotConfig = makePivot({
      rowKeys: ['name'],
      columnKeys: ['droppedCol'],
      aggregations: [{ operation: 'Sum', columns: ['price'] }],
    });
    const migrated: PivotBuilderConfig = {
      pivot: v1State,
      rollup: null,
      totals: null,
    };
    expect(findStaleColumnRefs(migrated, columns)).toEqual({
      rollupColumns: [],
      totalsColumns: [],
      pivotColumns: ['droppedCol'],
    });
  });

  it('is empty for the empty builder config', () => {
    expect(findStaleColumnRefs(config({}), columns)).toEqual(NONE);
  });
});

describe('sanitizeRollupConfig', () => {
  it('drops grouping columns that no longer exist', () => {
    expect(
      sanitizeRollupConfig(makeRollup(['region', 'gone']), columns)
    ).toEqual(expect.objectContaining({ groupingColumns: ['region'] }));
  });

  it('returns null when every grouping column was dropped', () => {
    expect(sanitizeRollupConfig(makeRollup(['gone']), columns)).toBeNull();
  });

  it('filters aggregations by missing column and by type validity', () => {
    const sanitized = sanitizeRollupConfig(
      makeRollup(['region'], {
        // `gone` missing, `name` is a string (Sum invalid), `price` survives.
        Sum: ['price', 'name', 'gone'],
        // Count valid on any type — `region` survives, `gone` dropped.
        Count: ['region', 'gone'],
      }),
      columns
    ) as unknown as { aggregations: Record<string, string[]> };
    expect(sanitized.aggregations).toEqual({
      Sum: ['price'],
      Count: ['region'],
    });
  });

  it('drops an operation once its column list is emptied', () => {
    const sanitized = sanitizeRollupConfig(
      makeRollup(['region'], { Sum: ['name'] }),
      columns
    ) as unknown as { aggregations: Record<string, string[]> };
    expect(sanitized.aggregations).toEqual({});
  });

  it('keeps a rollup with grouping but no surviving aggregations (empty map is valid)', () => {
    const sanitized = sanitizeRollupConfig(
      makeRollup(['region'], {}),
      columns
    );
    expect(sanitized).not.toBeNull();
    expect(
      (sanitized as unknown as { groupingColumns: string[] }).groupingColumns
    ).toEqual(['region']);
  });

  it('preserves other rollup fields (e.g. includeConstituents)', () => {
    const rollup = {
      groupingColumns: ['region'],
      includeConstituents: true,
    } as unknown as DhType.RollupConfig;
    expect(sanitizeRollupConfig(rollup, columns)).toEqual(
      expect.objectContaining({
        groupingColumns: ['region'],
        includeConstituents: true,
      })
    );
  });

  it('does not mutate the input', () => {
    const rollup = makeRollup(['region', 'gone'], { Sum: ['price', 'name'] });
    const before = JSON.stringify(rollup);
    sanitizeRollupConfig(rollup, columns);
    expect(JSON.stringify(rollup)).toBe(before);
  });
});

describe('sanitizeTotalsConfig', () => {
  it('drops operationMap entries whose column no longer exists', () => {
    expect(
      sanitizeTotalsConfig(makeTotals({ price: ['Sum'], gone: ['Avg'] }), columns)
    ).toEqual(expect.objectContaining({ operationMap: { price: ['Sum'] } }));
  });

  it('drops individual type-invalid operations for an existing column', () => {
    // `name` is a string: `Sum`/`Avg` invalid, `Count` valid.
    expect(
      sanitizeTotalsConfig(
        makeTotals({ name: ['Sum', 'Count', 'Avg'] }),
        columns
      )
    ).toEqual(expect.objectContaining({ operationMap: { name: ['Count'] } }));
  });

  it('drops a column entirely once its operation list is emptied', () => {
    expect(
      sanitizeTotalsConfig(makeTotals({ name: ['Sum'] }), columns)
    ).toEqual(expect.objectContaining({ operationMap: {} }));
  });

  it('returns a config (never null) with an empty operationMap when nothing survives', () => {
    const sanitized = sanitizeTotalsConfig(
      makeTotals({ gone: ['Sum'] }),
      columns
    );
    expect(sanitized).not.toBeNull();
    expect(
      (sanitized as unknown as { operationMap: Record<string, string[]> })
        .operationMap
    ).toEqual({});
  });

  it('preserves other totals fields (showOnTop, defaultOperation)', () => {
    const totals = {
      operationMap: { price: ['Sum'] },
      operationOrder: ['Sum'],
      showOnTop: true,
      defaultOperation: 'Skip',
    } as unknown as UITotalsTableConfig;
    expect(sanitizeTotalsConfig(totals, columns)).toEqual(
      expect.objectContaining({ showOnTop: true, defaultOperation: 'Skip' })
    );
  });

  it('does not mutate the input', () => {
    const totals = makeTotals({ price: ['Sum'], gone: ['Avg'] });
    const before = JSON.stringify(totals);
    sanitizeTotalsConfig(totals, columns);
    expect(JSON.stringify(totals)).toBe(before);
  });
});

// Guard against `AggregationUtils.isValidOperation`'s missing default case:
// a non-enum operation string returns `undefined` (falsy) at runtime, so it
// must be conservatively dropped, never thrown.
describe('non-enum operation strings are dropped, not thrown', () => {
  it('drops a bogus operation in rollup aggregations', () => {
    const run = (): unknown =>
      sanitizeRollupConfig(
        makeRollup(['region'], { NotAnOp: ['price'] }),
        columns
      );
    expect(run).not.toThrow();
    const sanitized = run() as unknown as {
      aggregations: Record<string, string[]>;
    };
    expect(sanitized.aggregations).toEqual({});
  });

  it('drops a bogus operation in totals operationMap', () => {
    const run = (): unknown =>
      sanitizeTotalsConfig(makeTotals({ price: ['NotAnOp'] }), columns);
    expect(run).not.toThrow();
    const sanitized = run() as unknown as {
      operationMap: Record<string, string[]>;
    };
    expect(sanitized.operationMap).toEqual({});
  });
});
