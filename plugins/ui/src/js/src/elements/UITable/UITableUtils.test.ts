import { getAggregationOperation } from './UITableUtils';

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
