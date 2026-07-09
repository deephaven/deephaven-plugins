import type { AggregationSettings } from '@deephaven/iris-grid';
import { applyPivotDragEnd } from './applyPivotDragEnd';
import {
  AGGREGATIONS_DROPPABLE,
  PIVOT_COLUMNS_DROPPABLE,
  ROLLUP_ROWS_DROPPABLE,
  aggregationColumnId,
  aggregationRowId,
  columnRowId,
} from './dndIds';

const STRING = 'java.lang.String';
const INT = 'int';
const DOUBLE = 'double';

const COLUMN_TYPES: Readonly<Record<string, string>> = {
  price: DOUBLE,
  qty: INT,
  name: STRING,
  region: STRING,
};

interface Agg {
  operation: string;
  selected: string[];
}

function settings(aggs: Agg[]): AggregationSettings {
  return {
    aggregations: aggs.map(a => ({
      operation:
        a.operation as AggregationSettings['aggregations'][number]['operation'],
      selected: a.selected,
      invert: false,
    })),
    showOnTop: false,
  };
}

interface RunResult {
  agg?: AggregationSettings;
  rollup?: string[];
  pivot?: string[];
}

function run(params: {
  activeId: string;
  overId: string;
  aggregationSettings?: AggregationSettings;
  rollupRows?: string[];
  pivotColumns?: string[];
}): RunResult {
  const result: RunResult = {};
  applyPivotDragEnd({
    activeId: params.activeId,
    overId: params.overId,
    aggregationSettings: params.aggregationSettings ?? settings([]),
    rollupRows: params.rollupRows ?? [],
    pivotColumns: params.pivotColumns ?? [],
    columnTypes: COLUMN_TYPES,
    onAggregationSettingsChange: next => {
      result.agg = next;
    },
    onRollupRowsChange: next => {
      result.rollup = next;
    },
    onPivotColumnsChange: next => {
      result.pivot = next;
    },
  });
  return result;
}

/** Flatten an AggregationSettings back into `[op, columns]` pairs. */
function ops(s: AggregationSettings | undefined): [string, string[]][] {
  return (s?.aggregations ?? []).map(a => [a.operation as string, a.selected]);
}

describe('applyPivotDragEnd — column cards', () => {
  it('reorders a column within the same card', () => {
    const result = run({
      activeId: columnRowId(ROLLUP_ROWS_DROPPABLE, 'qty'),
      overId: columnRowId(ROLLUP_ROWS_DROPPABLE, 'name'),
      rollupRows: ['name', 'region', 'qty'],
    });
    expect(result.rollup).toEqual(['qty', 'name', 'region']);
    expect(result.pivot).toBeUndefined();
  });

  it('no-ops when reordering onto the same position', () => {
    const result = run({
      activeId: columnRowId(ROLLUP_ROWS_DROPPABLE, 'name'),
      overId: columnRowId(ROLLUP_ROWS_DROPPABLE, 'name'),
      rollupRows: ['name', 'region'],
    });
    expect(result.rollup).toBeUndefined();
  });

  it('moves a column across cards, inserting at the hovered slot', () => {
    const result = run({
      activeId: columnRowId(ROLLUP_ROWS_DROPPABLE, 'name'),
      overId: columnRowId(PIVOT_COLUMNS_DROPPABLE, 'region'),
      rollupRows: ['name', 'qty'],
      pivotColumns: ['region'],
    });
    expect(result.rollup).toEqual(['qty']);
    expect(result.pivot).toEqual(['name', 'region']);
  });

  it('appends when dropped on the destination card background', () => {
    const result = run({
      activeId: columnRowId(ROLLUP_ROWS_DROPPABLE, 'name'),
      overId: PIVOT_COLUMNS_DROPPABLE,
      rollupRows: ['name'],
      pivotColumns: ['region'],
    });
    expect(result.rollup).toEqual([]);
    expect(result.pivot).toEqual(['region', 'name']);
  });

  it('drops silently when the destination already has the column', () => {
    const result = run({
      activeId: columnRowId(ROLLUP_ROWS_DROPPABLE, 'name'),
      overId: PIVOT_COLUMNS_DROPPABLE,
      rollupRows: ['name'],
      pivotColumns: ['name'],
    });
    expect(result.rollup).toBeUndefined();
    expect(result.pivot).toBeUndefined();
  });

  it('never lets a column card drop into aggregations', () => {
    const result = run({
      activeId: columnRowId(ROLLUP_ROWS_DROPPABLE, 'name'),
      overId: AGGREGATIONS_DROPPABLE,
      rollupRows: ['name'],
    });
    expect(result).toEqual({});
  });
});

describe('applyPivotDragEnd — aggregations', () => {
  it('reorders whole function rows', () => {
    const result = run({
      activeId: aggregationRowId('Avg'),
      overId: aggregationRowId('Sum'),
      aggregationSettings: settings([
        { operation: 'Sum', selected: ['price'] },
        { operation: 'Avg', selected: ['qty'] },
      ]),
    });
    expect(ops(result.agg)).toEqual([
      ['Avg', ['qty']],
      ['Sum', ['price']],
    ]);
  });

  it('reorders columns within one function', () => {
    const result = run({
      activeId: aggregationColumnId('Sum', 'qty'),
      overId: aggregationColumnId('Sum', 'price'),
      aggregationSettings: settings([
        { operation: 'Sum', selected: ['price', 'qty'] },
      ]),
    });
    expect(ops(result.agg)).toEqual([['Sum', ['qty', 'price']]]);
  });

  it('moves a column to another function, removing an emptied source', () => {
    const result = run({
      activeId: aggregationColumnId('Avg', 'price'),
      overId: aggregationRowId('Sum'),
      aggregationSettings: settings([
        { operation: 'Sum', selected: ['qty'] },
        { operation: 'Avg', selected: ['price'] },
      ]),
    });
    // Avg emptied and dropped; price appended to Sum.
    expect(ops(result.agg)).toEqual([['Sum', ['qty', 'price']]]);
  });

  it('snaps back when the target function rejects the column type', () => {
    const result = run({
      activeId: aggregationColumnId('First', 'name'),
      overId: aggregationRowId('Sum'),
      aggregationSettings: settings([
        { operation: 'Sum', selected: ['qty'] },
        { operation: 'First', selected: ['name'] },
      ]),
    });
    // `Sum` is invalid for a String column, so nothing changes.
    expect(result.agg).toBeUndefined();
  });

  it('does not move columns out of the aggregations scope', () => {
    const result = run({
      activeId: aggregationColumnId('Sum', 'qty'),
      overId: columnRowId(ROLLUP_ROWS_DROPPABLE, 'name'),
      aggregationSettings: settings([{ operation: 'Sum', selected: ['qty'] }]),
      rollupRows: ['name'],
    });
    expect(result).toEqual({});
  });
});
