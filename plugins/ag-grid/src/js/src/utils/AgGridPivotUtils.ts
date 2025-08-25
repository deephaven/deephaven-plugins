import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { assertNotNull } from '@deephaven/utils';
import AgGridTableType from '../AgGridTableType';

export const ROOT_HEADER_NAME = 'Totals';

export type PivotColumnGroupContext = {
  snapshotIndex: number;
};

export function isPivotColumnGroupContext(
  context?: unknown
): context is PivotColumnGroupContext {
  return (context as PivotColumnGroupContext)?.snapshotIndex != null;
}

export function isPivotTable(
  table: AgGridTableType
): table is CorePlusDhType.coreplus.pivot.PivotTable {
  return (
    'columnSources' in table && 'rowSources' in table && 'valueSources' in table
  );
}

/**
 * Converts an array of group keys to a string representation.
 * @param groupKeys The group keys to convert to a string.
 * @returns A string representation of the group keys.
 */
export function toGroupKeyString(groupKeys: (unknown | null)[]): string {
  return groupKeys.filter(key => key != null).join('/');
}

/**
 * Get the row group keys from the provided row sources and data.
 * @param rowSources The row sources to extract keys from.
 * @param data The data object containing the values.
 * @returns An array of row group keys.
 */
export function getRowGroupKeys(
  rowSources: CorePlusDhType.coreplus.pivot.PivotSource[],
  data: Record<string, unknown>
): string[] {
  const rowGroupKeys: string[] = [];
  for (let i = 0; i < rowSources.length; i += 1) {
    const rowSource = rowSources[i];
    if (data[rowSource.name] != null) {
      rowGroupKeys.push(String(data[rowSource.name]));
    }
  }
  return rowGroupKeys;
}

/**
 * Finds the index of a row in the pivot table snapshot based on the provided row group keys.
 * @param rows Rows from the pivot table snapshot.
 * @param rowGroupKeys The row group keys to find the index for.
 * @returns The index of the row, or null if not found.
 */
export function findRowIndex(
  rows: CorePlusDhType.coreplus.pivot.DimensionData,
  rowGroupKeys: string[]
): number | null {
  for (let r = 0; r < rows.count; r += 1) {
    const rowkeys = rows.getKeys(r);
    const nonNullRowKeys = rowkeys.filter(key => key != null);
    if (
      rowGroupKeys.length === nonNullRowKeys.length &&
      rowGroupKeys.every((key, index) => key === nonNullRowKeys[index])
    ) {
      return r;
    }
  }
  return null;
}

// TODO: Write a bunch of unit tests!
export function getPivotResultColumns(
  columns: CorePlusDhType.coreplus.pivot.DimensionData
): (ColGroupDef | ColDef)[] {
  const result: (ColGroupDef | ColDef)[] = [];

  // This is the current groups in progress. So we know which ones to push to.
  const currentGroups: ColGroupDef[] = [];
  function getCurrentChildren(): ColGroupDef['children'] {
    return currentGroups[currentGroups.length - 1]?.children ?? result;
  }

  function closeGroup() {
    // This isn't a child, we can pop the last group
    const currentGroup = currentGroups.pop();
    assertNotNull(currentGroup);
    getCurrentChildren().push(currentGroup);
  }
  for (let c = 0; c < columns.count; c += 1) {
    const columnKeys = columns.getKeys(c);
    const columnKey = toGroupKeyString(columnKeys);
    while (
      currentGroups.length > 0 &&
      !columnKey.startsWith(
        `${currentGroups[currentGroups.length - 1].groupId}/`
      )
    ) {
      closeGroup();
    }

    if (columns.hasChildren(c)) {
      const context: PivotColumnGroupContext = {
        snapshotIndex: columns.offset + c,
      };
      // Need to start the group, it will get closed out when we're done
      const children: ColGroupDef['children'] = [
        {
          headerName: 'Totals',
          field: columnKey,
          colId: columnKey,
          // field: `${columnKey}/__TOTALS__`,
          // colId: `${columnKey}/__TOTALS__`,
          // columnGroupShow undefined to always show the totals
          // columnGroupShow: 'closed',
        },
      ];
      if (!columns.isExpanded(c)) {
        // If it's not expanded, add a stub child so we know it's
        children.push({
          headerName: '...',
          field: `${columnKey}/...`,
          colId: `${columnKey}/...`,
          columnGroupShow: 'open',
        });
      }
      currentGroups.push({
        headerName: columnKey,
        groupId: columnKey,
        context,
        children,
      });
    } else {
      getCurrentChildren().push({
        headerName: columnKeys[columnKeys.length - 1] ?? columnKey,
        field: columnKey,
        colId: columnKey,
        // Only show these when the group is open
        columnGroupShow: 'open',
      });
    }
  }

  while (currentGroups.length > 0) {
    closeGroup();
  }

  return result;

  // for (let c = 0; c < columns.count; c += 1) {
  //   const columnKeys = columns.getKeys(c);
  //   const columnKey = toGroupKeyString(columnKeys);
  //   const currentGroup = groupsInProgress[groupsInProgress.length - 1];
  //   if (groupsInProgress.length > 0 && columnKey.startsWith(`${currentGroup.groupKey}/`)) {
  //     // This column is a child of the current group
  //     currentGroup.children.push(columnKey);
  //   } else {
  //     // This column is a new group
  //     groupsInProgress.push({ groupKey: columnKey, children: [] });
  //   }
  // }
  // let columnIndex = 0;

  // const cursor
  // let i = 0;
  // while (i < columns.count) {
  //   const columnKeys = columns.getKeys(i);
  //   const columnKey = toGroupKeyString(columnKeys);

  //   // TODO: Should go through the groups...
  //   i += 1;
  // }

  //   return {
  //     headerName: columnKey,
  //     field: columnKey,
  //     colId: columnKey,
  //     pivotResult: true,
  //     pivotResultIndex: columnIndex++,
  //   };
  // }
  // for (let c = 0; c < columns.count; c += 1) {
  //   const columnKeys = columns.getKeys(c);
  //   if ()
  //   const columnKey = toGroupKeyString(columnKeys);
  //   columnIds.push(columnKey);
  // }

  // Path we're currently processing. When we hit another node that does not match the path, then we close out that group
  // const path: string[][] = [];
  // for (let c = 0; c < columns.count; c += 1) {
  //   const columnKeys = columns.getKeys(c);
  //   const columnKey = columnKeys.filter(key => key != null).join('/');
  //   pivotResultColumns.push({
  //     headerName: columnKey,
  //     field: columnKey,
  //     colId: columnKey,
  //   });
  // }
  // return result;
}
