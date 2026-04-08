import { dh as DhType } from '@deephaven/jsapi-types';
import {
  FilterModel,
  TextFilterModel,
  NumberFilterModel,
  DateFilterModel,
  ICombinedSimpleModel,
  ISimpleFilterModel,
  AdvancedFilterModel,
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

  beforeEach(() => {
    jest.clearAllMocks();
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

  describe('parseFilterModel', () => {
    it('should return empty array for null filter model', () => {
      const result = AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        null
      );
      expect(result).toEqual([]);
    });

    it('should throw error for unsupported filter model', () => {
      const model = {
        col1: { filterType: 'unsupported' },
      } as unknown as FilterModel;

      expect(() =>
        AgGridFilterUtils.parseFilterModel(
          mockDh as unknown as typeof DhType,
          mockTable as unknown as DhType.Table,
          model
        )
      ).toThrow();
    });

    it('should parse text filter model', () => {
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

      AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );
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

      AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );
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
        eq: mockEq1,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce(filterValue1);

      // Second condition
      mockColumn.filter.mockReturnValueOnce({
        eq: mockEq2,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce(filterValue2);

      // AND operation
      mockEq1.mockReturnValue({
        and: mockAnd,
      });

      AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(mockTable.findColumn).toHaveBeenCalledWith(column);
      expect(mockEq1).toHaveBeenCalledWith(filterValue1);
      expect(mockEq2).toHaveBeenCalledWith(filterValue2);
      expect(mockAnd).toHaveBeenCalledTimes(1);
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

  describe('isAdvancedFilterModel', () => {
    it('should identify advanced filter models', () => {
      const advancedModel: AdvancedFilterModel = {
        filterType: 'join',
        type: 'AND',
        conditions: [
          {
            filterType: 'text',
            type: 'contains',
            filter: 'test',
            colId: 'Name',
          },
        ],
      };

      expect(AgGridFilterUtils.isAdvancedFilterModel(advancedModel)).toBe(true);
    });

    it('should reject regular filter models', () => {
      const regularModel: FilterModel = {
        Name: {
          filterType: 'text',
          type: 'contains',
          filter: 'test',
        },
      };

      expect(AgGridFilterUtils.isAdvancedFilterModel(regularModel)).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(
        AgGridFilterUtils.isAdvancedFilterModel(null as unknown as FilterModel)
      ).toBe(false);
      expect(
        AgGridFilterUtils.isAdvancedFilterModel(
          undefined as unknown as FilterModel
        )
      ).toBe(false);
    });
  });

  describe('parseAdvancedFilterModel', () => {
    it('should parse simple AND advanced filter', () => {
      const model: AdvancedFilterModel = {
        filterType: 'join',
        type: 'AND',
        conditions: [
          {
            filterType: 'text',
            type: 'contains',
            filter: 'foo',
            colId: 'Name',
          },
          {
            filterType: 'number',
            type: 'greaterThan',
            filter: 10,
            colId: 'Age',
          },
        ],
      };

      const mockAnd = jest.fn().mockReturnValue('result');
      const condition1 = { and: mockAnd };
      const condition2 = {};

      const mockContains = jest.fn().mockReturnValue(condition1);
      const mockGreaterThan = jest.fn().mockReturnValue(condition2);

      // First condition (text contains)
      mockColumn.filter.mockReturnValueOnce({
        contains: mockContains,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce('foo');

      // Second condition (number greaterThan)
      mockColumn.filter.mockReturnValueOnce({
        greaterThan: mockGreaterThan,
      });
      mockDh.FilterValue.ofNumber.mockReturnValueOnce(10);

      const result = AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('result');
      expect(mockTable.findColumn).toHaveBeenCalledWith('Name');
      expect(mockTable.findColumn).toHaveBeenCalledWith('Age');
      expect(mockAnd).toHaveBeenCalledWith(condition2);
    });

    it('should parse simple OR advanced filter', () => {
      const model: AdvancedFilterModel = {
        filterType: 'join',
        type: 'OR',
        conditions: [
          {
            filterType: 'text',
            type: 'equals',
            filter: 'John',
            colId: 'Name',
          },
          {
            filterType: 'text',
            type: 'equals',
            filter: 'Jane',
            colId: 'Name',
          },
        ],
      };

      const mockOr = jest.fn().mockReturnValue('result');
      const condition1 = { or: mockOr };
      const condition2 = {};

      const mockEq1 = jest.fn().mockReturnValue(condition1);
      const mockEq2 = jest.fn().mockReturnValue(condition2);

      // First condition
      mockColumn.filter.mockReturnValueOnce({
        eq: mockEq1,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce('John');

      // Second condition
      mockColumn.filter.mockReturnValueOnce({
        eq: mockEq2,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce('Jane');

      const result = AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('result');
      expect(mockOr).toHaveBeenCalledWith(condition2);
    });

    it('should parse nested advanced filter', () => {
      const model: AdvancedFilterModel = {
        filterType: 'join',
        type: 'AND',
        conditions: [
          {
            filterType: 'join',
            type: 'OR',
            conditions: [
              {
                filterType: 'text',
                type: 'equals',
                filter: 'John',
                colId: 'Name',
              },
              {
                filterType: 'text',
                type: 'equals',
                filter: 'Jane',
                colId: 'Name',
              },
            ],
          },
          {
            filterType: 'number',
            type: 'greaterThan',
            filter: 18,
            colId: 'Age',
          },
        ],
      };

      const mockAnd = jest.fn().mockReturnValue('finalResult');
      const mockOr = jest.fn().mockReturnValue({ and: mockAnd });

      const condition1 = { or: mockOr };
      const condition2 = {};
      const condition3 = {};

      const mockEq1 = jest.fn().mockReturnValue(condition1);
      const mockEq2 = jest.fn().mockReturnValue(condition2);
      const mockGreaterThan = jest.fn().mockReturnValue(condition3);

      // First nested condition (John)
      mockColumn.filter.mockReturnValueOnce({
        eq: mockEq1,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce('John');

      // Second nested condition (Jane)
      mockColumn.filter.mockReturnValueOnce({
        eq: mockEq2,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce('Jane');

      // Third condition (Age > 18)
      mockColumn.filter.mockReturnValueOnce({
        greaterThan: mockGreaterThan,
      });
      mockDh.FilterValue.ofNumber.mockReturnValueOnce(18);

      const result = AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('finalResult');
      expect(mockOr).toHaveBeenCalledWith(condition2);
      expect(mockAnd).toHaveBeenCalledWith(condition3);
    });

    it('should parse date filter in advanced filter', () => {
      const model: AdvancedFilterModel = {
        filterType: 'join',
        type: 'AND',
        conditions: [
          {
            filterType: 'date',
            type: 'equals',
            filter: '2025-04-22',
            colId: 'DateCol',
          },
        ],
      };

      const mockFilterValue = 12345;
      const mockDateWrapper = 54321;
      const mockEq = jest.fn().mockReturnValue('result');

      mockColumn.filter.mockReturnValueOnce({
        eq: mockEq,
      });

      mockDh.DateWrapper.ofJsDate.mockReturnValueOnce(mockDateWrapper);
      mockDh.FilterValue.ofNumber.mockReturnValueOnce(mockFilterValue);

      const result = AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('result');
      expect(mockTable.findColumn).toHaveBeenCalledWith('DateCol');
      expect(mockEq).toHaveBeenCalledWith(mockFilterValue);
    });

    it('should throw error for missing colId', () => {
      const model: AdvancedFilterModel = {
        filterType: 'join',
        type: 'AND',
        conditions: [
          {
            filterType: 'text',
            type: 'contains',
            filter: 'test',
          } as any,
        ],
      };

      expect(() =>
        AgGridFilterUtils.parseFilterModel(
          mockDh as unknown as typeof DhType,
          mockTable as unknown as DhType.Table,
          model
        )
      ).toThrow('Advanced filter condition must have colId');
    });

    it('should throw error for empty conditions', () => {
      const model: AdvancedFilterModel = {
        filterType: 'join',
        type: 'AND',
        conditions: [],
      };

      expect(() =>
        AgGridFilterUtils.parseFilterModel(
          mockDh as unknown as typeof DhType,
          mockTable as unknown as DhType.Table,
          model
        )
      ).toThrow('Advanced filter must have conditions');
    });

    it('should throw error for unsupported operator', () => {
      const model: AdvancedFilterModel = {
        filterType: 'join',
        type: 'INVALID' as any,
        conditions: [
          {
            filterType: 'text',
            type: 'equals',
            filter: 'test',
            colId: 'Name',
          },
          {
            filterType: 'text',
            type: 'equals',
            filter: 'value',
            colId: 'Col2',
          },
        ],
      };

      const condition1 = {};
      const condition2 = {};
      const mockEq1 = jest.fn().mockReturnValue(condition1);
      const mockEq2 = jest.fn().mockReturnValue(condition2);

      mockColumn.filter.mockReturnValueOnce({
        eq: mockEq1,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce('test');

      mockColumn.filter.mockReturnValueOnce({
        eq: mockEq2,
      });
      mockDh.FilterValue.ofString.mockReturnValueOnce('value');

      expect(() =>
        AgGridFilterUtils.parseFilterModel(
          mockDh as unknown as typeof DhType,
          mockTable as unknown as DhType.Table,
          model
        )
      ).toThrow('Unknown operator INVALID in advanced filter');
    });

    it('should throw error for unsupported filter type', () => {
      const model: AdvancedFilterModel = {
        filterType: 'join',
        type: 'AND',
        conditions: [
          {
            filterType: 'unsupported' as any,
            type: 'equals',
            colId: 'Col1',
          },
        ],
      };

      expect(() =>
        AgGridFilterUtils.parseFilterModel(
          mockDh as unknown as typeof DhType,
          mockTable as unknown as DhType.Table,
          model
        )
      ).toThrow();
    });

    it('should parse deeply nested advanced filter (3 levels)', () => {
      const model: AdvancedFilterModel = {
        filterType: 'join',
        type: 'AND',
        conditions: [
          {
            filterType: 'join',
            type: 'OR',
            conditions: [
              {
                filterType: 'join',
                type: 'AND',
                conditions: [
                  {
                    filterType: 'text',
                    type: 'equals',
                    filter: 'A',
                    colId: 'Name',
                  },
                  {
                    filterType: 'number',
                    type: 'greaterThan',
                    filter: 10,
                    colId: 'Age',
                  },
                ],
              },
              {
                filterType: 'text',
                type: 'equals',
                filter: 'B',
                colId: 'Name',
              },
            ],
          },
          {
            filterType: 'date',
            type: 'lessThan',
            filter: '2025-01-01',
            colId: 'DateCol',
          },
        ],
      };

      const mockOr = jest
        .fn()
        .mockReturnValue({ and: jest.fn().mockReturnValue('finalResult') });
      const mockAnd1 = jest.fn().mockReturnValue({ or: mockOr });

      const conditionA = { and: mockAnd1 };
      const conditionAge = {};
      const conditionB = {};
      const conditionDate = {};

      const mockEqA = jest.fn().mockReturnValue(conditionA);
      const mockGreaterThan = jest.fn().mockReturnValue(conditionAge);
      const mockEqB = jest.fn().mockReturnValue(conditionB);
      const mockLessThan = jest.fn().mockReturnValue(conditionDate);

      // Mock for text filter 'A'
      mockColumn.filter.mockReturnValueOnce({ eq: mockEqA });
      mockDh.FilterValue.ofString.mockReturnValueOnce('A');

      // Mock for number filter Age > 10
      mockColumn.filter.mockReturnValueOnce({ greaterThan: mockGreaterThan });
      mockDh.FilterValue.ofNumber.mockReturnValueOnce(10);

      // Mock for text filter 'B'
      mockColumn.filter.mockReturnValueOnce({ eq: mockEqB });
      mockDh.FilterValue.ofString.mockReturnValueOnce('B');

      // Mock for date filter
      mockColumn.filter.mockReturnValueOnce({ lessThan: mockLessThan });
      mockDh.DateWrapper.ofJsDate.mockReturnValueOnce(12345);
      mockDh.FilterValue.ofNumber.mockReturnValueOnce(12345);

      const result = AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('finalResult');
      expect(mockAnd1).toHaveBeenCalledWith(conditionAge);
      expect(mockOr).toHaveBeenCalled();
    });

    it('should parse advanced filter with mixed column and join conditions', () => {
      const model: AdvancedFilterModel = {
        filterType: 'join',
        type: 'OR',
        conditions: [
          {
            filterType: 'text',
            type: 'contains',
            filter: 'test',
            colId: 'Name',
          },
          {
            filterType: 'join',
            type: 'AND',
            conditions: [
              {
                filterType: 'number',
                type: 'greaterThan',
                filter: 18,
                colId: 'Age',
              },
              {
                filterType: 'number',
                type: 'lessThan',
                filter: 65,
                colId: 'Age',
              },
            ],
          },
        ],
      };

      const mockOr = jest.fn().mockReturnValue('finalResult');
      const mockAnd = jest.fn().mockReturnValue({ or: mockOr });

      const conditionName = { or: mockOr };
      const conditionAge1 = { and: mockAnd };
      const conditionAge2 = {};

      const mockContains = jest.fn().mockReturnValue(conditionName);
      const mockGreaterThan = jest.fn().mockReturnValue(conditionAge1);
      const mockLessThan = jest.fn().mockReturnValue(conditionAge2);

      mockColumn.filter.mockReturnValueOnce({ contains: mockContains });
      mockDh.FilterValue.ofString.mockReturnValueOnce('test');

      mockColumn.filter.mockReturnValueOnce({ greaterThan: mockGreaterThan });
      mockDh.FilterValue.ofNumber.mockReturnValueOnce(18);

      mockColumn.filter.mockReturnValueOnce({ lessThan: mockLessThan });
      mockDh.FilterValue.ofNumber.mockReturnValueOnce(65);

      const result = AgGridFilterUtils.parseFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toBe('finalResult');
      expect(mockAnd).toHaveBeenCalledWith(conditionAge2);
      expect(mockOr).toHaveBeenCalled();
    });

    it('should parse ColumnAdvancedFilterModel directly (text filter)', () => {
      const model: AdvancedFilterModel = {
        filterType: 'text',
        type: 'contains',
        filter: 'searchValue',
        colId: 'Name',
      };

      const mockContains = jest.fn().mockReturnValue('result');
      mockColumn.filter.mockReturnValueOnce({ contains: mockContains });
      mockDh.FilterValue.ofString.mockReturnValueOnce('searchValue');

      const result = AgGridFilterUtils.parseAdvancedFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(result).toBe('result');
      expect(mockTable.findColumn).toHaveBeenCalledWith('Name');
      expect(mockContains).toHaveBeenCalledWith('searchValue');
    });

    it('should parse ColumnAdvancedFilterModel directly (number filter)', () => {
      const model: AdvancedFilterModel = {
        filterType: 'number',
        type: 'greaterThan',
        filter: 42,
        colId: 'Age',
      };

      const mockGreaterThan = jest.fn().mockReturnValue('result');
      mockColumn.filter.mockReturnValueOnce({ greaterThan: mockGreaterThan });
      mockDh.FilterValue.ofNumber.mockReturnValueOnce(42);

      const result = AgGridFilterUtils.parseAdvancedFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(result).toBe('result');
      expect(mockTable.findColumn).toHaveBeenCalledWith('Age');
      expect(mockGreaterThan).toHaveBeenCalledWith(42);
    });

    it('should parse ColumnAdvancedFilterModel directly (boolean true filter)', () => {
      const model: AdvancedFilterModel = {
        filterType: 'boolean',
        type: 'true',
        colId: 'IsActive',
      };

      const mockIsTrue = jest.fn().mockReturnValue('result');
      mockColumn.filter.mockReturnValueOnce({ isTrue: mockIsTrue });

      const result = AgGridFilterUtils.parseAdvancedFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(result).toBe('result');
      expect(mockTable.findColumn).toHaveBeenCalledWith('IsActive');
      expect(mockIsTrue).toHaveBeenCalled();
    });

    it('should parse ColumnAdvancedFilterModel directly (boolean false filter)', () => {
      const model: AdvancedFilterModel = {
        filterType: 'boolean',
        type: 'false',
        colId: 'IsActive',
      };

      const mockIsFalse = jest.fn().mockReturnValue('result');
      mockColumn.filter.mockReturnValueOnce({ isFalse: mockIsFalse });

      const result = AgGridFilterUtils.parseAdvancedFilterModel(
        mockDh as unknown as typeof DhType,
        mockTable as unknown as DhType.Table,
        model
      );

      expect(result).toBe('result');
      expect(mockTable.findColumn).toHaveBeenCalledWith('IsActive');
      expect(mockIsFalse).toHaveBeenCalled();
    });

    it('should throw error for ColumnAdvancedFilterModel with missing colId', () => {
      const model = {
        filterType: 'text',
        type: 'contains',
        filter: 'test',
      } as AdvancedFilterModel;

      expect(() =>
        AgGridFilterUtils.parseAdvancedFilterModel(
          mockDh as unknown as typeof DhType,
          mockTable as unknown as DhType.Table,
          model
        )
      ).toThrow('Advanced filter condition must have colId');
    });
  });
});
