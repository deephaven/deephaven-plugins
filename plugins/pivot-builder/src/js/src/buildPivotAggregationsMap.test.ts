import type { dh as DhType } from '@deephaven/jsapi-types';
import {
  buildPivotAggregationsMap,
  buildSanitizedPivotRequest,
  sanitizePivotAggregations,
  type PivotConfig,
} from './pivotBuilderModel';

/**
 * Minimal `dh.Column` fixture — only `name`/`type` are read by
 * `buildPivotAggregationsMap`. Cast through `unknown` so we don't fabricate
 * the full column surface.
 */
function col(name: string, type: string): DhType.Column {
  return { name, type } as unknown as DhType.Column;
}

const STRING = 'java.lang.String';
const INT = 'int';
const DOUBLE = 'double';

function makeConfig(partial: Partial<PivotConfig>): PivotConfig {
  return {
    rowKeys: [],
    columnKeys: [],
    aggregations: [],
    ...partial,
  };
}

describe('buildPivotAggregationsMap', () => {
  const columns = [
    col('name', STRING),
    col('region', STRING),
    col('price', DOUBLE),
    col('qty', INT),
  ];

  it('collapses the ordered aggregations into an operation → columns map', () => {
    const config = makeConfig({
      aggregations: [{ operation: 'Sum', columns: ['price', 'qty'] }],
    });
    expect(buildPivotAggregationsMap(config, columns)).toEqual({
      Sum: ['price', 'qty'],
    });
  });

  it('merges columns for an operation that appears in more than one entry', () => {
    const config = makeConfig({
      aggregations: [
        { operation: 'Sum', columns: ['price'] },
        { operation: 'Sum', columns: ['qty'] },
      ],
    });
    expect(buildPivotAggregationsMap(config, columns)).toEqual({
      Sum: ['price', 'qty'],
    });
  });

  it('drops columns whose type is invalid for the operation (Sum on string)', () => {
    const config = makeConfig({
      aggregations: [{ operation: 'Sum', columns: ['name', 'price'] }],
    });
    expect(buildPivotAggregationsMap(config, columns)).toEqual({
      Sum: ['price'],
    });
  });

  it('drops aggregations left with no valid columns', () => {
    const config = makeConfig({
      rowKeys: ['region'],
      aggregations: [{ operation: 'Sum', columns: ['price'] }],
    });
    // Sum is valid for price (double) and qty (int); also keeps a Count.
    const config2 = makeConfig({
      rowKeys: ['region'],
      aggregations: [
        { operation: 'Sum', columns: ['name'] },
        { operation: 'Count', columns: ['region'] },
      ],
    });
    expect(buildPivotAggregationsMap(config, columns)).toEqual({
      Sum: ['price'],
    });
    expect(buildPivotAggregationsMap(config2, columns)).toEqual({
      Count: ['region'],
    });
  });

  it('drops columns that no longer exist on the source table', () => {
    const config = makeConfig({
      aggregations: [{ operation: 'Sum', columns: ['price', 'gone'] }],
    });
    expect(buildPivotAggregationsMap(config, columns)).toEqual({
      Sum: ['price'],
    });
  });

  it('keeps Count/First/Last on any column type', () => {
    const config = makeConfig({
      aggregations: [
        { operation: 'Count', columns: ['name'] },
        { operation: 'First', columns: ['region'] },
        { operation: 'Last', columns: ['name'] },
      ],
    });
    expect(buildPivotAggregationsMap(config, columns)).toEqual({
      Count: ['name'],
      First: ['region'],
      Last: ['name'],
    });
  });

  it('tolerates the legacy Record<operation, columns[]> aggregations shape', () => {
    const config = {
      rowKeys: [],
      columnKeys: [],
      aggregations: { Sum: ['name', 'price'] },
    } as unknown as PivotConfig;
    expect(buildPivotAggregationsMap(config, columns)).toEqual({
      Sum: ['price'],
    });
  });

  describe('Count fallback when the sanitized map is empty', () => {
    it('synthesizes Count over the first column not used as a key', () => {
      const config = makeConfig({
        rowKeys: ['name'],
        columnKeys: ['region'],
        aggregations: [{ operation: 'Sum', columns: ['name'] }],
      });
      expect(buildPivotAggregationsMap(config, columns)).toEqual({
        Count: ['price'],
      });
    });

    it('falls back to the first column overall when all columns are keys', () => {
      const twoCols = [col('name', STRING), col('region', STRING)];
      const config = makeConfig({
        rowKeys: ['name'],
        columnKeys: ['region'],
        aggregations: [],
      });
      expect(buildPivotAggregationsMap(config, twoCols)).toEqual({
        Count: ['name'],
      });
    });

    it('synthesizes Count for an empty aggregations list with no keys', () => {
      const config = makeConfig({ aggregations: [] });
      expect(buildPivotAggregationsMap(config, columns)).toEqual({
        Count: ['name'],
      });
    });

    it('returns an empty map when the source table has no columns', () => {
      const config = makeConfig({ aggregations: [] });
      expect(buildPivotAggregationsMap(config, [])).toEqual({});
    });
  });
});

describe('sanitizePivotAggregations (no Count fallback)', () => {
  const columns = [
    col('name', STRING),
    col('region', STRING),
    col('price', DOUBLE),
    col('qty', INT),
  ];

  it('sanitizes like buildPivotAggregationsMap but never synthesizes a Count', () => {
    // Same config that makes buildPivotAggregationsMap synthesize a Count.
    const config = makeConfig({
      rowKeys: ['name'],
      columnKeys: ['region'],
      aggregations: [{ operation: 'Sum', columns: ['name'] }],
    });
    expect(buildPivotAggregationsMap(config, columns)).toEqual({
      Count: ['price'],
    });
    // The pre-fallback sanitized map is empty — this is the distinction the
    // total-key-loss rule relies on.
    expect(sanitizePivotAggregations(config, columns)).toEqual({});
  });

  it('keeps valid aggregations untouched', () => {
    const config = makeConfig({
      aggregations: [{ operation: 'Sum', columns: ['price', 'name'] }],
    });
    expect(sanitizePivotAggregations(config, columns)).toEqual({
      Sum: ['price'],
    });
  });

  it('drops a non-enum operation string rather than throwing', () => {
    const config = makeConfig({
      aggregations: [{ operation: 'NotAnOp', columns: ['price'] }],
    });
    expect(() => sanitizePivotAggregations(config, columns)).not.toThrow();
    expect(sanitizePivotAggregations(config, columns)).toEqual({});
  });
});

describe('buildSanitizedPivotRequest (rowKeys/columnKeys sanitization)', () => {
  const columns = [
    col('name', STRING),
    col('region', STRING),
    col('price', DOUBLE),
    col('qty', INT),
  ];

  it('drops rowKeys/columnKeys that no longer exist', () => {
    const config = makeConfig({
      rowKeys: ['name', 'gone'],
      columnKeys: ['region', 'phantom'],
      aggregations: [{ operation: 'Sum', columns: ['price'] }],
    });
    const req = buildSanitizedPivotRequest(config, columns);
    expect(req.rowKeys).toEqual(['name']);
    expect(req.columnKeys).toEqual(['region']);
    expect(req.aggregations).toEqual({ Sum: ['price'] });
    expect(req.isEmpty).toBe(false);
  });

  it('flags isEmpty when all keys are stale AND no aggregations survive', () => {
    const config = makeConfig({
      rowKeys: ['gone'],
      columnKeys: ['phantom'],
      aggregations: [{ operation: 'Sum', columns: ['name'] }], // Sum on string → dropped
    });
    const req = buildSanitizedPivotRequest(config, columns);
    expect(req.rowKeys).toEqual([]);
    expect(req.columnKeys).toEqual([]);
    expect(req.isEmpty).toBe(true);
    expect(req.aggregations).toEqual({});
  });

  it('does NOT flag isEmpty when keys are all stale but aggregations survive', () => {
    const config = makeConfig({
      rowKeys: ['gone'],
      columnKeys: [],
      aggregations: [{ operation: 'Sum', columns: ['price'] }],
    });
    const req = buildSanitizedPivotRequest(config, columns);
    expect(req.rowKeys).toEqual([]);
    expect(req.columnKeys).toEqual([]);
    expect(req.isEmpty).toBe(false);
    // A meaningful flat, ungrouped summary row — kept, no Count synthesized.
    expect(req.aggregations).toEqual({ Sum: ['price'] });
  });

  it('still synthesizes a Count fallback when a key survives but aggregations are empty', () => {
    const config = makeConfig({
      rowKeys: ['name'],
      columnKeys: ['gone'],
      aggregations: [{ operation: 'Sum', columns: ['name'] }], // dropped
    });
    const req = buildSanitizedPivotRequest(config, columns);
    expect(req.rowKeys).toEqual(['name']);
    expect(req.columnKeys).toEqual([]);
    expect(req.isEmpty).toBe(false);
    // Count over the first column not used as a (sanitized) key.
    expect(req.aggregations).toEqual({ Count: ['region'] });
  });

  it('does not mutate the input config', () => {
    const config = makeConfig({
      rowKeys: ['name', 'gone'],
      aggregations: [{ operation: 'Sum', columns: ['price'] }],
    });
    const before = JSON.stringify(config);
    buildSanitizedPivotRequest(config, columns);
    expect(JSON.stringify(config)).toBe(before);
  });
});
