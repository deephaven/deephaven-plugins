import { dh as DhType } from '@deephaven/jsapi-types';
import {
  FilterModel,
  TextFilterModel,
  NumberFilterModel,
  DateFilterModel,
  ICombinedSimpleModel,
  ISimpleFilterModel,
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
});
