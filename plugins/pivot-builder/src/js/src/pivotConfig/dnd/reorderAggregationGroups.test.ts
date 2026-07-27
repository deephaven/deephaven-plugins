import type { AggregationSettings } from '@deephaven/iris-grid';
import { reorderAggregationGroups } from './reorderAggregationGroups';
import {
  AGGREGATIONS_DROPPABLE,
  aggregationColumnId,
  aggregationRowId,
} from './dndIds';

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
}

function run(params: {
  activeId: string;
  overId: string;
  aggregationSettings?: AggregationSettings;
}): RunResult {
  const result: RunResult = {};
  reorderAggregationGroups({
    activeId: params.activeId,
    overId: params.overId,
    aggregationSettings: params.aggregationSettings ?? settings([]),
    onAggregationSettingsChange: next => {
      result.agg = next;
    },
  });
  return result;
}

/** Flatten an AggregationSettings back into `[op, columns]` pairs. */
function ops(
  s: AggregationSettings | undefined
): [string, readonly string[]][] {
  return (s?.aggregations ?? []).map(a => [a.operation as string, a.selected]);
}

describe('reorderAggregationGroups', () => {
  it('reorders a function row onto another', () => {
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

  it('maps an `over` column row back to its function', () => {
    const result = run({
      activeId: aggregationRowId('Avg'),
      overId: aggregationColumnId('Sum', 'price'),
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

  it('drops at the end when the card background is hovered', () => {
    const result = run({
      activeId: aggregationRowId('Sum'),
      overId: AGGREGATIONS_DROPPABLE,
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

  it('no-ops when dropped on its own slot', () => {
    const result = run({
      activeId: aggregationRowId('Sum'),
      overId: aggregationRowId('Sum'),
      aggregationSettings: settings([
        { operation: 'Sum', selected: ['price'] },
      ]),
    });
    expect(result.agg).toBeUndefined();
  });

  it('ignores single-column drags (handled by the live preview)', () => {
    const result = run({
      activeId: aggregationColumnId('Sum', 'qty'),
      overId: aggregationRowId('Sum'),
      aggregationSettings: settings([
        { operation: 'Sum', selected: ['price', 'qty'] },
      ]),
    });
    expect(result.agg).toBeUndefined();
  });

  it('ignores drags outside the aggregations scope', () => {
    const result = run({
      activeId: aggregationRowId('Sum'),
      overId: 'rollup-rows',
      aggregationSettings: settings([
        { operation: 'Sum', selected: ['price'] },
      ]),
    });
    expect(result).toEqual({});
  });
});
