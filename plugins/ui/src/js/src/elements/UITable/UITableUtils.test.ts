import { GridRange, type GridModel, RangedSelection } from '@deephaven/grid';
import {
  type IrisGridModel,
  type KeyedGridModel,
  KeyedSelection,
} from '@deephaven/iris-grid';
import { TestUtils } from '@deephaven/test-utils';
import {
  asRangedSelection,
  getAggregationOperation,
  getCellData,
  getUITableQuickFilters,
  getUITableSorts,
  serializeCellValue,
} from './UITableUtils';

/** 2^53 + 2, which a JS number cannot represent exactly. */
const BIG_LONG = '9007199254740994';

/** Stand-in for a JS API LongWrapper, which hides its value in internal fields. */
function makeLongWrapper(value: string) {
  return {
    value_0: { l: 2, m: 0, h: 512 },
    asNumber: () => Number(value),
    valueOf: () => value,
  };
}

describe('serializeCellValue', () => {
  it('converts a JS API wrapper to its exact decimal string', () => {
    expect(serializeCellValue(makeLongWrapper(BIG_LONG))).toBe(BIG_LONG);
  });

  it.each([1, 1.5, 'text', true, null, undefined])(
    'returns %p unchanged',
    value => {
      expect(serializeCellValue(value)).toBe(value);
    }
  );

  it('returns objects that are not wrappers unchanged', () => {
    const value = { valueOf: () => 'not a wrapper' };
    expect(serializeCellValue(value)).toBe(value);
  });
});

describe('getCellData', () => {
  it('sends long values as exact strings with their column type', () => {
    const model = TestUtils.createMockProxy<IrisGridModel>({
      columns: [
        { name: 'L', type: 'long' },
      ] as unknown as IrisGridModel['columns'],
      valueForCell: () => makeLongWrapper(BIG_LONG),
      textForCell: () => '9,007,199,254,740,994',
    });

    expect(getCellData(0, 0, model)).toEqual({
      value: BIG_LONG,
      text: '9,007,199,254,740,994',
      type: 'long',
    });
  });
});

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
