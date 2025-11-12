import type { dh as DhType } from '@deephaven/jsapi-types';
import { ColumnState, SortModelItem } from 'ag-grid-community';

export function isSortModelItem(item: ColumnState): item is SortModelItem {
  return item.sort != null;
}

export class AgGridSortUtils {
  /**
   * Compares two arrays to see if they contain the same Sorts in the same order.
   * @param a A Sort array to compare
   * @param b Another Sort array to compare
   * @returns True if the two Sort arrays are identical, otherwise false.
   */
  static areSortsEqual(
    a: readonly DhType.Sort[],
    b: readonly DhType.Sort[]
  ): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (a[i].column.name !== b[i].column.name) return false;
      if (a[i].direction !== b[i].direction) return false;
      if (a[i].isAbs !== b[i].isAbs) return false;
    }
    return true;
  }

  /**
   * Parses the sort model items into Deephaven Sorts to apply on a table.
   * @param table Deephaven table or tree table to use
   * @param sortModelItems SortModelItem array to parse
   * @returns An array of Deephaven Sort objects parsed from the SortModelItem array.
   */
  static parseSortModel(
    table: DhType.Table | DhType.TreeTable,
    sortModelItems: readonly SortModelItem[]
  ): DhType.Sort[] {
    return sortModelItems.map(item => {
      const column = table.findColumn(item.colId);
      const sort = column.sort();
      switch (item.sort) {
        case 'asc':
          return sort.asc();
        case 'desc':
          return sort.desc();
        default:
          throw new Error(
            `Unknown sort direction ${item.sort} for column ${item.colId}`
          );
      }
    });
  }
}

export default AgGridSortUtils;
