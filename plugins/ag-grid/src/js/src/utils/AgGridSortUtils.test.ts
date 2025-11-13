import type { dh as DhType } from '@deephaven/jsapi-types';
import { SortModelItem } from 'ag-grid-community';
import AgGridSortUtils from './AgGridSortUtils';

describe('AgGridSortUtils', () => {
  describe('areSortsEqual', () => {
    const mockSort = (
      name: string,
      direction: string,
      isAbs = false
    ): DhType.Sort =>
      ({
        column: { name } as DhType.Column,
        direction,
        isAbs,
      }) as DhType.Sort;

    it('should return true for identical sort arrays', () => {
      const sorts1 = [mockSort('col1', 'ASC'), mockSort('col2', 'DESC')];
      const sorts2 = [mockSort('col1', 'ASC'), mockSort('col2', 'DESC')];
      expect(AgGridSortUtils.areSortsEqual(sorts1, sorts2)).toBe(true);
    });

    it('should return false for same sorts in different order', () => {
      const sorts1 = [mockSort('col1', 'ASC'), mockSort('col2', 'DESC')];
      const sorts2 = [mockSort('col2', 'DESC'), mockSort('col1', 'ASC')];
      expect(AgGridSortUtils.areSortsEqual(sorts1, sorts2)).toBe(false);
    });

    it('should return false for different length arrays', () => {
      const sorts1 = [mockSort('col1', 'ASC')];
      const sorts2 = [mockSort('col1', 'ASC'), mockSort('col2', 'DESC')];
      expect(AgGridSortUtils.areSortsEqual(sorts1, sorts2)).toBe(false);
    });

    it('should return false for different column names', () => {
      const sorts1 = [mockSort('col1', 'ASC')];
      const sorts2 = [mockSort('col2', 'ASC')];
      expect(AgGridSortUtils.areSortsEqual(sorts1, sorts2)).toBe(false);
    });

    it('should return false for different sort directions', () => {
      const sorts1 = [mockSort('col1', 'ASC')];
      const sorts2 = [mockSort('col1', 'DESC')];
      expect(AgGridSortUtils.areSortsEqual(sorts1, sorts2)).toBe(false);
    });

    it('should return false for different isAbs values', () => {
      const sorts1 = [mockSort('col1', 'ASC', true)];
      const sorts2 = [mockSort('col1', 'ASC', false)];
      expect(AgGridSortUtils.areSortsEqual(sorts1, sorts2)).toBe(false);
    });
  });

  describe('parseSortModel', () => {
    const mockColumn = {
      sort: () => ({
        asc: () => ({ direction: 'ASC' }),
        desc: () => ({ direction: 'DESC' }),
      }),
    };

    const mockTable = {
      findColumn: (colId: string) => mockColumn,
    };

    it('should parse ascending sort model item', () => {
      const sortModel: SortModelItem[] = [{ colId: 'col1', sort: 'asc' }];
      const result = AgGridSortUtils.parseSortModel(
        mockTable as unknown as DhType.Table,
        sortModel
      );
      expect(result[0].direction).toBe('ASC');
    });

    it('should parse descending sort model item', () => {
      const sortModel: SortModelItem[] = [{ colId: 'col1', sort: 'desc' }];
      const result = AgGridSortUtils.parseSortModel(
        mockTable as unknown as DhType.Table,
        sortModel
      );
      expect(result[0].direction).toBe('DESC');
    });

    it('should parse multiple sort model items', () => {
      const sortModel: SortModelItem[] = [
        { colId: 'col1', sort: 'asc' },
        { colId: 'col2', sort: 'desc' },
      ];
      const result = AgGridSortUtils.parseSortModel(
        mockTable as unknown as DhType.Table,
        sortModel
      );
      expect(result.length).toBe(2);
      expect(result[0].direction).toBe('ASC');
      expect(result[1].direction).toBe('DESC');
    });

    it('should throw error for invalid sort direction', () => {
      const sortModel: SortModelItem[] = [
        { colId: 'col1', sort: 'invalid' as 'asc' | 'desc' },
      ];
      expect(() =>
        AgGridSortUtils.parseSortModel(
          mockTable as unknown as DhType.Table,
          sortModel
        )
      ).toThrow();
    });
  });
});
