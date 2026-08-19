import { type dh as DhType } from '@deephaven/jsapi-types';
import {
  type FilterModel,
  type GridApi,
  type TextFilterModel,
  type NumberFilterModel,
  type DateFilterModel,
  type ICombinedSimpleModel,
  type ISimpleFilterModel,
} from 'ag-grid-community';
import AgGridFilterUtils from './AgGridFilterUtils';

describe('AgGridFilterUtils', () => {
  const mockDh = {
    FilterValue: {
      ofString: jest.fn(),
      ofNumber: jest.fn(),
    },
    DateWrapper: {
      ofJsDate: jest.fn(),
    },
  };

  const mockColumn = {
    filter: jest.fn(),
    findColumn: jest.fn(),
  };

  const mockTable = {
    findColumn: jest.fn().mockReturnValue(mockColumn),
  };

  const mockGridApi = {
    getColumnDef: jest.fn().mockReturnValue(null),
    getFilterModel: jest.fn().mockReturnValue({}),
  };

  /** Set the filter model returned by the mock GridApi and parse it */
  function parseModel(model: FilterModel | null): DhType.FilterCondition[] {
    mockGridApi.getFilterModel.mockReturnValue(model);
    return AgGridFilterUtils.getFilterFromGridApi(
      mockDh as unknown as typeof DhType,
      mockTable as unknown as DhType.Table,
      mockGridApi as unknown as GridApi
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockTable.findColumn.mockReturnValue(mockColumn);
    mockGridApi.getColumnDef.mockReturnValue(null);
  });

  describe('areFiltersEqual', () => {
    it('should return false when arrays have different lengths', () => {
      const a = [{ toString: () => 'filter1' }] as DhType.FilterCondition[];
      const b = [
        { toString: () => 'filter1' },
        { toString: () => 'filter2' },
      ] as DhType.FilterCondition[];
      expect(AgGridFilterUtils.areFiltersEqual(a, b)).toBe(false);
    });

    it('should return true when arrays have same filters in different order', () => {
      const a = [
        { toString: () => 'filter1' },
        { toString: () => 'filter2' },
      ] as DhType.FilterCondition[];
      const b = [
        { toString: () => 'filter2' },
        { toString: () => 'filter1' },
      ] as DhType.FilterCondition[];
      expect(AgGridFilterUtils.areFiltersEqual(a, b)).toBe(true);
    });

    it('should return false when arrays have different filters', () => {
      const a = [{ toString: () => 'filter1' }] as DhType.FilterCondition[];
      const b = [{ toString: () => 'filter2' }] as DhType.FilterCondition[];
      expect(AgGridFilterUtils.areFiltersEqual(a, b)).toBe(false);
    });
  });

  describe('parseFilterModel (deprecated)', () => {
    it('should keep filtering text case-sensitively with the original signature', () => {
      const column = 'col1';
      const filterValue = 'test';
      const textModel: FilterModel = {
        [column]: {
          filterType: 'text',
          type: 'equals',
          filter: filterValue,
        } as TextFilterModel,
      };

      const mockEq = jest.fn();
      mockColumn.filter.mockReturnValue({
        eq: mockEq,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce(filterValue);

      AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        textModel
      );
      expect(mockTable.findColumn).toHaveBeenCalledWith(column);
      expect(mockEq).toHaveBeenCalledWith(filterValue);
    });

    it('should return empty array for null filter model', () => {
      const result = AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        null
      );
      expect(result).toEqual([]);
    });
  });

  describe('getFilterFromGridApi', () => {
    it('should return empty array for null filter model', () => {
      const result = parseModel(null);
      expect(result).toEqual([]);
    });

    it('should throw error for unsupported filter model', () => {
      const model = {
        col1: { filterType: 'unsupported' },
      } as unknown as FilterModel;

      expect(() => parseModel(model)).toThrow();
    });

    it('should parse text filter model case-insensitively by default', () => {
      const column = 'col1';
      const filterValue = 'test';
      const textModel: FilterModel = {
        [column]: {
          filterType: 'text',
          type: 'equals',
          filter: filterValue,
        } as TextFilterModel,
      };

      const mockEqIgnoreCase = jest.fn();
      mockColumn.filter.mockReturnValue({
        eqIgnoreCase: mockEqIgnoreCase,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce(filterValue);

      parseModel(textModel);
      expect(mockTable.findColumn).toHaveBeenCalledWith(column);
      expect(mockEqIgnoreCase).toHaveBeenCalledWith(filterValue);
    });

    it('should parse number filter model', () => {
      const column = 'col1';
      const filterValue = 123;
      const model: FilterModel = {
        [column]: {
          filterType: 'number',
          type: 'equals',
          filter: filterValue,
        } as NumberFilterModel,
      };

      const mockEq = jest.fn();
      mockColumn.filter.mockReturnValue({
        eq: mockEq,
      });
      mockDh.FilterValue.ofNumber.mockReturnValueOnce(filterValue);

      parseModel(model);
      expect(mockTable.findColumn).toHaveBeenCalledWith(column);
      expect(mockEq).toHaveBeenCalledWith(filterValue);
    });

    it('should parse date filter model', () => {
      const column = 'col1';
      const filterValue = '2025-04-22 00:00:00';
      const model: FilterModel = {
        [column]: {
          filterType: 'date',
          type: 'equals',
          dateFrom: filterValue,
        } as DateFilterModel,
      };

      const mockEq = jest.fn();
      mockColumn.filter.mockReturnValue({
        eq: mockEq,
      });

      // The date string is put in a DateWrapper and then converted to a FilterValue, can't exactly mock that
      const mockFilterValue = 12345;
      mockDh.FilterValue.ofNumber.mockReturnValueOnce(mockFilterValue);

      parseModel(model);
      expect(mockTable.findColumn).toHaveBeenCalledWith(column);
      expect(mockEq).toHaveBeenCalledWith(mockFilterValue);
    });

    it('should parse combined simple filter model', () => {
      const column = 'col1';
      const filterValue1 = 'test1';
      const filterValue2 = 'test2';
      const model: FilterModel = {
        [column]: {
          conditions: [
            {
              filterType: 'text',
              type: 'equals',
              filter: filterValue1,
            },
            {
              filterType: 'text',
              type: 'equals',
              filter: filterValue2,
            },
          ],
          operator: 'AND',
        } as ICombinedSimpleModel<TextFilterModel>,
      };

      const mockEq1 = jest.fn();
      const mockEq2 = jest.fn();
      const mockAnd = jest.fn();

      // First condition
      mockColumn.filter.mockReturnValueOnce({
        eqIgnoreCase: mockEq1,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce(filterValue1);

      // Second condition
      mockColumn.filter.mockReturnValueOnce({
        eqIgnoreCase: mockEq2,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce(filterValue2);

      // AND operation
      mockEq1.mockReturnValue({
        and: mockAnd,
      });

      parseModel(model);

      expect(mockTable.findColumn).toHaveBeenCalledWith(column);
      expect(mockEq1).toHaveBeenCalledWith(filterValue1);
      expect(mockEq2).toHaveBeenCalledWith(filterValue2);
      expect(mockAnd).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFilterFromGridApi text filter case sensitivity', () => {
    const column = 'col1';
    const filterText = 'Test';

    function makeTextModel(type: string): FilterModel {
      return {
        [column]: {
          filterType: 'text',
          type,
          filter: filterText,
        } as TextFilterModel,
      };
    }

    function parse(model: FilterModel): void {
      parseModel(model);
    }

    function setCaseSensitive(caseSensitive: boolean): void {
      mockGridApi.getColumnDef.mockReturnValue({
        filterParams: { caseSensitive },
      });
    }

    it.each([
      ['equals', 'eq', 'eqIgnoreCase'],
      ['notEqual', 'notEq', 'notEqIgnoreCase'],
      ['contains', 'contains', 'containsIgnoreCase'],
    ])(
      '%s uses %s when case-sensitive and %s otherwise',
      (type, sensitiveMethod, insensitiveMethod) => {
        const mockSensitive = jest.fn();
        const mockInsensitive = jest.fn();
        mockColumn.filter.mockReturnValue({
          [sensitiveMethod]: mockSensitive,
          [insensitiveMethod]: mockInsensitive,
        });
        mockDh.FilterValue.ofString.mockReturnValue(filterText);

        setCaseSensitive(true);
        parse(makeTextModel(type));
        expect(mockSensitive).toHaveBeenCalledWith(filterText);
        expect(mockInsensitive).not.toHaveBeenCalled();

        mockSensitive.mockClear();
        setCaseSensitive(false);
        parse(makeTextModel(type));
        expect(mockInsensitive).toHaveBeenCalledWith(filterText);
        expect(mockSensitive).not.toHaveBeenCalled();
      }
    );

    it('notContains uses contains when case-sensitive and containsIgnoreCase otherwise', () => {
      const mockNot = jest.fn();
      const mockOr = jest.fn();
      const mockContains = jest.fn().mockReturnValue({ not: mockNot });
      const mockContainsIgnoreCase = jest
        .fn()
        .mockReturnValue({ not: mockNot });
      mockColumn.filter.mockReturnValue({
        isNull: jest.fn().mockReturnValue({ or: mockOr }),
        contains: mockContains,
        containsIgnoreCase: mockContainsIgnoreCase,
      });
      mockDh.FilterValue.ofString.mockReturnValue(filterText);

      setCaseSensitive(true);
      parse(makeTextModel('notContains'));
      expect(mockContains).toHaveBeenCalledWith(filterText);
      expect(mockContainsIgnoreCase).not.toHaveBeenCalled();

      mockContains.mockClear();
      setCaseSensitive(false);
      parse(makeTextModel('notContains'));
      expect(mockContainsIgnoreCase).toHaveBeenCalledWith(filterText);
      expect(mockContains).not.toHaveBeenCalled();
    });

    it.each([
      ['startsWith', `(?s)^\\Q${filterText}\\E.*`],
      ['endsWith', `(?s).*\\Q${filterText}\\E$`],
    ])(
      '%s uses invoke when case-sensitive and matchesIgnoreCase otherwise',
      (type, expectedPattern) => {
        const mockAnd = jest.fn();
        const mockInvoke = jest.fn();
        const mockMatchesIgnoreCase = jest.fn();
        mockColumn.filter.mockReturnValue({
          isNull: jest.fn().mockReturnValue({
            not: jest.fn().mockReturnValue({ and: mockAnd }),
          }),
          invoke: mockInvoke,
          matchesIgnoreCase: mockMatchesIgnoreCase,
        });
        mockDh.FilterValue.ofString.mockImplementation(value => value);

        setCaseSensitive(true);
        parse(makeTextModel(type));
        expect(mockInvoke).toHaveBeenCalledWith(type, filterText);
        expect(mockMatchesIgnoreCase).not.toHaveBeenCalled();

        mockInvoke.mockClear();
        setCaseSensitive(false);
        parse(makeTextModel(type));
        expect(mockMatchesIgnoreCase).toHaveBeenCalledWith(expectedPattern);
        expect(mockInvoke).not.toHaveBeenCalled();
      }
    );

    it('defaults to case-insensitive when column def has no filterParams', () => {
      const mockEq = jest.fn();
      const mockEqIgnoreCase = jest.fn();
      mockColumn.filter.mockReturnValue({
        eq: mockEq,
        eqIgnoreCase: mockEqIgnoreCase,
      });
      mockDh.FilterValue.ofString.mockReturnValue(filterText);
      mockGridApi.getColumnDef.mockReturnValue({});

      parse(makeTextModel('equals'));
      expect(mockEqIgnoreCase).toHaveBeenCalledWith(filterText);
      expect(mockEq).not.toHaveBeenCalled();
    });

    it('applies case sensitivity to combined filter conditions', () => {
      const model: FilterModel = {
        [column]: {
          conditions: [
            { filterType: 'text', type: 'equals', filter: 'a' },
            { filterType: 'text', type: 'equals', filter: 'b' },
          ],
          operator: 'OR',
        } as ICombinedSimpleModel<TextFilterModel>,
      };

      const mockOr = jest.fn();
      const mockEq = jest.fn().mockReturnValue({ or: mockOr });
      mockColumn.filter.mockReturnValue({ eq: mockEq });
      mockDh.FilterValue.ofString.mockImplementation(value => value);

      setCaseSensitive(true);
      parse(model);
      expect(mockEq).toHaveBeenCalledTimes(2);
      expect(mockEq).toHaveBeenCalledWith('a');
      expect(mockEq).toHaveBeenCalledWith('b');
      expect(mockOr).toHaveBeenCalledTimes(1);
    });
  });

  describe('isCombinedSimpleModel', () => {
    const isSimpleModel = (obj: unknown): obj is ISimpleFilterModel => true;

    it.each([[null], [undefined], ['string'], [123]])(
      'should return false for non-object value: %s',
      val => {
        expect(
          AgGridFilterUtils.isCombinedSimpleModel(val, isSimpleModel)
        ).toBe(false);
      }
    );

    it('should return false when operator is not a string', () => {
      expect(
        AgGridFilterUtils.isCombinedSimpleModel(
          { operator: 123, conditions: [] },
          isSimpleModel
        )
      ).toBe(false);
      expect(
        AgGridFilterUtils.isCombinedSimpleModel(
          { operator: {}, conditions: [] },
          isSimpleModel
        )
      ).toBe(false);
    });

    it('should return false when conditions is not an array', () => {
      expect(
        AgGridFilterUtils.isCombinedSimpleModel(
          { operator: 'AND', conditions: 'not-array' },
          isSimpleModel
        )
      ).toBe(false);
      expect(
        AgGridFilterUtils.isCombinedSimpleModel(
          { operator: 'AND', conditions: {} },
          isSimpleModel
        )
      ).toBe(false);
    });

    it('should return true for valid combined model', () => {
      const validModel = {
        operator: 'AND',
        conditions: [{ type: 'equals', filterType: 'text' }],
      };
      expect(
        AgGridFilterUtils.isCombinedSimpleModel(validModel, isSimpleModel)
      ).toBe(true);
    });
  });

  describe('isCombinedSimpleModel', () => {
    const isSimpleModel = (obj: unknown): obj is ISimpleFilterModel => true;

    it('should return false for non-object values', () => {
      expect(AgGridFilterUtils.isCombinedSimpleModel(null, isSimpleModel)).toBe(
        false
      );
      expect(
        AgGridFilterUtils.isCombinedSimpleModel(undefined, isSimpleModel)
      ).toBe(false);
      expect(
        AgGridFilterUtils.isCombinedSimpleModel('string', isSimpleModel)
      ).toBe(false);
      expect(AgGridFilterUtils.isCombinedSimpleModel(123, isSimpleModel)).toBe(
        false
      );
    });

    it.each([[null], [undefined], ['string'], [123], [true]])(
      'should return false for non-object value:  %s',
      value => {
        expect(
          AgGridFilterUtils.isCombinedSimpleModel(value, isSimpleModel)
        ).toBe(false);
      }
    );

    it('should return false when operator is not a string', () => {
      expect(
        AgGridFilterUtils.isCombinedSimpleModel(
          { operator: 123, conditions: [] },
          isSimpleModel
        )
      ).toBe(false);
    });

    it('should return false when conditions is not an array', () => {
      expect(
        AgGridFilterUtils.isCombinedSimpleModel(
          { operator: 'AND', conditions: {} },
          isSimpleModel
        )
      ).toBe(false);
    });

    it('should return true for valid combined model', () => {
      const validModel = {
        operator: 'AND',
        conditions: [{ type: 'equals', filterType: 'text' }],
      };
      expect(
        AgGridFilterUtils.isCombinedSimpleModel(validModel, isSimpleModel)
      ).toBe(true);
    });
  });

  describe('isSimpleFilterModel', () => {
    it('should return false for non-object values', () => {
      expect(AgGridFilterUtils.isSimpleFilterModel(null)).toBe(false);
      expect(AgGridFilterUtils.isSimpleFilterModel(undefined)).toBe(false);
      expect(AgGridFilterUtils.isSimpleFilterModel('string')).toBe(false);
      expect(AgGridFilterUtils.isSimpleFilterModel(123)).toBe(false);
    });

    it('should return true when type and filterType are undefined', () => {
      expect(AgGridFilterUtils.isSimpleFilterModel({})).toBe(true);
    });

    it('should return true when type and filterType are strings', () => {
      expect(
        AgGridFilterUtils.isSimpleFilterModel({
          type: 'string',
          filterType: 'string',
        })
      ).toBe(true);
    });

    it('should return false when type or filterType are invalid types', () => {
      expect(AgGridFilterUtils.isSimpleFilterModel({ type: 123 })).toBe(false);
      expect(AgGridFilterUtils.isSimpleFilterModel({ filterType: {} })).toBe(
        false
      );
    });
  });

  describe('isSupportedSimpleFilterModel', () => {
    it('should return false when filterType is undefined', () => {
      expect(
        AgGridFilterUtils.isSupportedSimpleFilterModel({
          type: 'equals',
          filterType: undefined,
        })
      ).toBe(false);
    });

    it.each([
      ['text', true],
      ['number', true],
      ['date', true],
      ['unsupported', false],
    ])('filterType %s should return %s', (filterType, expected) => {
      expect(
        AgGridFilterUtils.isSupportedSimpleFilterModel({ filterType })
      ).toBe(expected);
    });
  });
});
