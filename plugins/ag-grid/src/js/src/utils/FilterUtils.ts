import type { dh as DhType } from '@deephaven/jsapi-types';
import { AdvancedFilterModel, FilterModel } from '@ag-grid-community/core';

export default class FilterUtils {
  /**
   * Compares two arrays to see if they contain the same filter conditions in any order.
   * @param a A FilterCondition array to compare
   * @param b Another FilterCondition array to compare
   * @returns True if the both arrays contain the same filter conditions, otherwise false.
   */
  static areFiltersEqual(
    a: readonly DhType.FilterCondition[],
    b: readonly DhType.FilterCondition[]
  ): boolean {
    if (a.length !== b.length) return false;
    // Might be a better way than using .toString() here
    const filters = new Set(a.map(f => f.toString()));
    return b.every(f => filters.has(f.toString()));
  }

  static parseFilterModel(
    dh: typeof DhType,
    table: DhType.Table,
    filterModel: FilterModel | AdvancedFilterModel | null
  ): DhType.FilterCondition[] {
    if (filterModel == null) {
      return [];
    }

    return Object.entries(filterModel).map(([colId, val]) => {
      const column = table.findColumn(colId);

      const { conditions, operator } = val;
      if (
        conditions != null &&
        operator != null &&
        Array.isArray(conditions) &&
        typeof operator === 'string'
      ) {
        return conditions
          .map(condition => {
            const { filterType, filter, type } = condition;
            return FilterUtils.parseFilter(
              dh,
              column,
              filterType,
              type,
              filter
            );
          })
          .reduce((prev, curr) => {
            if (operator === 'OR') {
              return prev.or(curr);
            }
            if (operator === 'AND') {
              return prev.and(curr);
            }
            throw new Error(`Unknown operator ${operator} for column ${colId}`);
          });
      }

      const { filterType, filter, type } = val;
      return this.parseFilter(dh, column, filterType, type, filter);
    });
  }

  private static parseFilter(
    dh: typeof DhType,
    column: DhType.Column,
    filterType: string,
    type: string,
    filter: string
  ): DhType.FilterCondition {
    switch (filterType) {
      case 'text':
        return this.parseTextFilter(dh, column, type, filter);
      default:
        throw new Error(`Unimplemented filter type ${filterType}`);
    }
  }

  private static parseTextFilter(
    dh: typeof DhType,
    column: DhType.Column,
    type: string,
    filter: string
  ): DhType.FilterCondition {
    const filterValue = dh.FilterValue.ofString(filter ?? '');
    switch (type) {
      case 'equals':
        return column.filter().eq(filterValue);
      case 'notEqual':
        return column.filter().notEq(filterValue);
      case 'contains':
        return column.filter().contains(filterValue);
      case 'notContains':
        return column
          .filter()
          .isNull()
          .or(column.filter().contains(filterValue).not());
      case 'startsWith':
        return column
          .filter()
          .isNull()
          .not()
          .and(column.filter().invoke('startsWith', filterValue));
      case 'endsWith':
        return column
          .filter()
          .isNull()
          .not()
          .and(column.filter().invoke('endsWith', filterValue));
      // filterValue becomes ofString('') for blank/notBlank filters
      case 'blank':
        return column.filter().isNull().or(column.filter().eq(filterValue));
      case 'notBlank':
        return column
          .filter()
          .isNull()
          .not()
          .and(column.filter().notEq(filterValue));
      default:
        throw new Error(`Unimplemented filter operation ${type}`);
    }
  }
}
