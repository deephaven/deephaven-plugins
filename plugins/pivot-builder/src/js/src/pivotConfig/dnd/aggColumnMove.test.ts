import type { AggregationSettings } from '@deephaven/iris-grid';
import { aggregationColumnId, aggregationRowId } from './dndIds';
import {
  findAggColGroupIndex,
  fromAggColPreview,
  moveAggColAcross,
  reorderAggColWithin,
  resolveOverGroupIndex,
  toAggColPreview,
  type AggColPreview,
} from './aggColumnMove';

/** Build an AggColPreview from `[operation, columns]` pairs. */
function preview(groups: [string, string[]][]): AggColPreview {
  return groups.map(([operation, columns]) => ({
    operation,
    columnIds: columns.map(c => aggregationColumnId(operation, c)),
  }));
}

const col = aggregationColumnId;

describe('toAggColPreview', () => {
  it('encodes each column id with its group operation', () => {
    const aggregations = [
      { operation: 'Sum', selected: ['price'], invert: false },
      { operation: 'Avg', selected: ['qty', 'price'], invert: false },
    ] as unknown as AggregationSettings['aggregations'];
    expect(toAggColPreview(aggregations)).toEqual(
      preview([
        ['Sum', ['price']],
        ['Avg', ['qty', 'price']],
      ])
    );
  });
});

describe('resolveOverGroupIndex', () => {
  const p = preview([
    ['Sum', ['price']],
    ['Avg', ['qty']],
  ]);

  it('resolves a group function-line row to its index', () => {
    expect(resolveOverGroupIndex(p, aggregationRowId('Avg'))).toBe(1);
  });

  it('resolves a column id to the group that renders it', () => {
    expect(resolveOverGroupIndex(p, col('Sum', 'price'))).toBe(0);
  });

  it('returns -1 for a non-aggregation id', () => {
    expect(resolveOverGroupIndex(p, 'column:price')).toBe(-1);
  });
});

describe('moveAggColAcross', () => {
  it('moves a column into another group before the hovered column', () => {
    const next = moveAggColAcross(
      preview([
        ['Sum', ['price', 'tax']],
        ['Avg', ['qty']],
      ]),
      col('Sum', 'price'),
      col('Avg', 'qty'),
      false
    );
    expect(fromAggColPreview(next)).toEqual([
      { operation: 'Sum', selected: ['tax'] },
      { operation: 'Avg', selected: ['price', 'qty'] },
    ]);
  });

  it('appends when hovering the target group function line', () => {
    const next = moveAggColAcross(
      preview([
        ['Sum', ['price']],
        ['Avg', ['qty']],
      ]),
      col('Sum', 'price'),
      aggregationRowId('Avg'),
      false
    );
    expect(fromAggColPreview(next)).toEqual([
      { operation: 'Avg', selected: ['qty', 'price'] },
    ]);
  });

  it('keeps the dragged id encoded with its original operation', () => {
    const next = moveAggColAcross(
      preview([
        ['Sum', ['price']],
        ['Avg', ['qty']],
      ]),
      col('Sum', 'price'),
      col('Avg', 'qty'),
      true
    );
    // Still findable by its ORIGINAL (Sum) id even though it now sits in Avg.
    expect(findAggColGroupIndex(next, col('Sum', 'price'))).toBe(1);
  });

  it('is a no-op (same reference) within one group', () => {
    const p = preview([['Sum', ['price', 'tax']]]);
    expect(
      moveAggColAcross(p, col('Sum', 'price'), col('Sum', 'tax'), false)
    ).toBe(p);
  });
});

describe('reorderAggColWithin', () => {
  it('reorders columns inside one group', () => {
    const next = reorderAggColWithin(
      preview([['Sum', ['price', 'tax', 'qty']]]),
      col('Sum', 'qty'),
      col('Sum', 'price')
    );
    expect(fromAggColPreview(next)).toEqual([
      { operation: 'Sum', selected: ['qty', 'price', 'tax'] },
    ]);
  });

  it('is a no-op (same reference) across groups', () => {
    const p = preview([
      ['Sum', ['price']],
      ['Avg', ['qty']],
    ]);
    expect(reorderAggColWithin(p, col('Sum', 'price'), col('Avg', 'qty'))).toBe(
      p
    );
  });
});

describe('fromAggColPreview', () => {
  it('de-dupes a column merged into a group that already had it', () => {
    const merged = moveAggColAcross(
      preview([
        ['Sum', ['price']],
        ['Avg', ['price', 'qty']],
      ]),
      col('Sum', 'price'),
      col('Avg', 'qty'),
      false
    );
    expect(fromAggColPreview(merged)).toEqual([
      { operation: 'Avg', selected: ['price', 'qty'] },
    ]);
  });

  it('drops groups left with no columns', () => {
    const emptied = moveAggColAcross(
      preview([
        ['Sum', ['price']],
        ['Avg', ['qty']],
      ]),
      col('Sum', 'price'),
      col('Avg', 'qty'),
      false
    );
    expect(fromAggColPreview(emptied)).toEqual([
      { operation: 'Avg', selected: ['price', 'qty'] },
    ]);
  });
});
