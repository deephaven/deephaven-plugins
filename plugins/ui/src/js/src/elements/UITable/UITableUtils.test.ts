import {
  getAggregationOperation,
  getUITableQuickFilters,
  getUITableSorts,
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

describe('UITable state callbacks', () => {
  it('converts quick-filter column indices to names', () => {
    expect(
      getUITableQuickFilters(
        [
          [1, { text: '>= 10' }],
          [0, { text: 'CAT' }],
          [3, { text: 'ignored' }],
        ],
        [{ name: 'Sym' }, { name: 'Size' }]
      )
    ).toEqual({ Size: '>= 10', Sym: 'CAT' });
  });

  it('converts sorts to Python-facing mappings', () => {
    expect(
      getUITableSorts([
        { column: 'Size', direction: 'DESC', isAbs: true },
        { column: 'Sym', direction: 'ASC', isAbs: false },
      ])
    ).toEqual([
      { column: 'Size', direction: 'DESC', is_abs: true },
      { column: 'Sym', direction: 'ASC', is_abs: false },
    ]);
  });

  it('converts cleared state to empty callback values', () => {
    expect(getUITableQuickFilters([], [])).toEqual({});
    expect(getUITableSorts([])).toEqual([]);
  });
});
