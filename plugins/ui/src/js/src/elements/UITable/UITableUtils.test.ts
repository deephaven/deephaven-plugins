import { GridRange, type GridModel, RangedSelection } from '@deephaven/grid';
import { type IrisGridModel, KeyedSelection } from '@deephaven/iris-grid';
import { type KeyedGridModel } from '@deephaven/iris-grid';
import { TestUtils } from '@deephaven/test-utils';
import { asRangedSelection, getAggregationOperation } from './UITableUtils';

describe('getAggregationOperation', () => {
  it('should return the correct operation regardless of case', () => {
    expect(getAggregationOperation('SUM')).toBe('Sum');
    expect(getAggregationOperation('sum')).toBe('Sum');
    expect(getAggregationOperation('Sum')).toBe('Sum');
    expect(getAggregationOperation('sUM')).toBe('Sum');
    expect(getAggregationOperation('abssum')).toBe('AbsSum');
    expect(getAggregationOperation('abs_sum')).toBe('AbsSum');
    expect(getAggregationOperation('ABS_SUM')).toBe('AbsSum');
    expect(getAggregationOperation('Abs_Sum')).toBe('AbsSum');
    expect(getAggregationOperation('AbsSum')).toBe('AbsSum');
  });

  it('should throw for unknown operations', () => {
    expect(() => getAggregationOperation('foo')).toThrow(
      /Invalid aggregation operation/
    );
  });
});

describe('asRangedSelection', () => {
  it('returns the selection for a RangedSelection', () => {
    const getModel = () => TestUtils.createMockProxy<GridModel>();
    const selection = new RangedSelection(
      [new GridRange(null, 0, null, 5)],
      getModel
    );
    expect(asRangedSelection(selection)).toBe(selection);
  });

  it('returns null for a KeyedSelection', () => {
    const getModel = () =>
      TestUtils.createMockProxy<IrisGridModel & KeyedGridModel>();
    expect(asRangedSelection(KeyedSelection.empty(getModel))).toBeNull();
  });
});
