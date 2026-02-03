import {
  getAggregationOperation,
  extractDatabarsFromFormatRules,
} from './UITableUtils';

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

describe('extractDatabarsFromFormatRules', () => {
  it('should extract databar from format rule with single column', () => {
    const formatRules = [
      {
        cols: 'Price',
        mode: { color: 'blue' },
      },
    ];

    const result = extractDatabarsFromFormatRules(formatRules);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      color: 'blue',
      column: 'Price',
    });
  });

  it('should extract databars from format rule with multiple columns', () => {
    const formatRules = [
      {
        cols: ['Price', 'Size'],
        mode: { color: 'positive', opacity: 0.8 },
      },
    ];

    const result = extractDatabarsFromFormatRules(formatRules);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      color: 'positive',
      opacity: 0.8,
      column: 'Price',
    });
    expect(result[1]).toEqual({
      color: 'positive',
      opacity: 0.8,
      column: 'Size',
    });
  });

  it('should ignore format rules without mode', () => {
    const formatRules = [
      {
        cols: 'Price',
        color: 'red',
      },
      {
        cols: 'Size',
        mode: { color: 'blue' },
      },
    ];

    const result = extractDatabarsFromFormatRules(formatRules);

    expect(result).toHaveLength(1);
    expect(result[0].column).toBe('Size');
  });

  it('should handle empty format rules array', () => {
    const result = extractDatabarsFromFormatRules([]);

    expect(result).toHaveLength(0);
  });
});
