import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { ColDef, ColGroupDef } from '@ag-grid-community/core';
import { assertNotNull } from '@deephaven/utils';
import {
  AgGridViewportRowData,
  SingleRowData,
  TREE_NODE_KEY,
} from './AgGridTableUtils';

export const TOTALS_COLUMN_NAME = 'Totals';

export type PivotColumnGroupContext = {
  snapshotIndex: number;
};

export function isPivotColumnGroupContext(
  context?: unknown
): context is PivotColumnGroupContext {
  return (context as PivotColumnGroupContext)?.snapshotIndex != null;
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

export function getHeaderName(columnKeys: (string | null)[]): string {
  for (let i = columnKeys.length - 1; i >= 0; i -= 1) {
    const columnKey = columnKeys[i];
    if (columnKey != null) {
      return columnKey;
    }
  }
  throw new Error('No non-null column key found');
}

/**
 * Get the pivot result columns from the provided pivot dimension data. This tells AG Grid how to display the columns, including expandable/collapsible groups.
 * @param columns The pivot dimension data representing the columns.
 * @returns An array of column definitions for the pivot result.
 */
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
    // If there were no children added to this group yet, that means we haven't expanded it yet. Add a placeholder so AG Grid knows it can be expanded.
    if (currentGroup.children.length === 0) {
      currentGroup.children.push({
        headerName: '...',
        field: `${currentGroup.groupId}/...`,
        colId: `${currentGroup.groupId}/...`,
        columnGroupShow: 'open',
      });
    }
    // Also add the totals for this group
    currentGroup.children.push({
      headerName: `${currentGroup.headerName} Total`,
      field: currentGroup.groupId,
      colId: currentGroup.groupId,
    });
    getCurrentChildren().push(currentGroup);
  }

  for (let c = 0; c < columns.count; c += 1) {
    const columnKeys = columns.getKeys(c);
    const columnKey = toGroupKeyString(columnKeys);
    const headerName = getHeaderName(columnKeys);
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
      currentGroups.push({
        headerName,
        groupId: columnKey,
        context,
        children: [],
      });
    } else {
      getCurrentChildren().push({
        headerName,
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

  // Add a root level totals column as well
  result.push({
    headerName: TOTALS_COLUMN_NAME,
    field: TOTALS_COLUMN_NAME,
    colId: TOTALS_COLUMN_NAME,
  });

  return result;
}

export function extractSnapshotRow(
  snapshot: CorePlusDhType.coreplus.pivot.PivotSnapshot,
  table: CorePlusDhType.coreplus.pivot.PivotTable,
  rowIndex: number
): SingleRowData {
  const rowKeys = snapshot.rows.getKeys(rowIndex);
  const row: SingleRowData = {};
  // TODO: Support multiple value sources
  const valueSource = table.valueSources[0];
  for (
    let rowSourceIndex = 0;
    rowSourceIndex < table.rowSources.length;
    rowSourceIndex += 1
  ) {
    const rowSource = table.rowSources[rowSourceIndex];
    const rowSourceKey = rowKeys[rowSourceIndex];
    if (rowSourceKey != null) {
      row[rowSource.name] = rowSourceKey;
    }
  }
  const depth = snapshot.rows.getDepth(rowIndex);
  row[TREE_NODE_KEY] = {
    hasChildren: snapshot.rows.hasChildren(rowIndex),
    isExpanded: snapshot.rows.isExpanded(rowIndex),
    depth,
    index: rowIndex,
  };
  for (let c = 0; c < snapshot.columns.count; c += 1) {
    const columnKey = toGroupKeyString(snapshot.columns.getKeys(c));
    const value = snapshot.getValue(
      valueSource,
      rowIndex,
      snapshot.columns.offset + c
    );
    row[columnKey] = value;
  }

  // Add the totals data
  row[TOTALS_COLUMN_NAME] = snapshot.rows.getTotal(rowIndex, valueSource);

  return row;
}

export function extractTotalsRow(
  snapshot: CorePlusDhType.coreplus.pivot.PivotSnapshot,
  table: CorePlusDhType.coreplus.pivot.PivotTable
): SingleRowData {
  const totalsRow: SingleRowData = {};
  totalsRow[TREE_NODE_KEY] = {
    hasChildren: false,
    isExpanded: false,
    depth: 0,
    index: snapshot.rows.totalCount,
  };
  // TODO: Support multiple value sources
  const valueSource = table.valueSources[0];
  for (let c = 0; c < snapshot.columns.count; c += 1) {
    const columnKey = toGroupKeyString(snapshot.columns.getKeys(c));
    totalsRow[columnKey] = snapshot.columns.getTotal(c, valueSource);
  }
  totalsRow[TOTALS_COLUMN_NAME] = snapshot.getGrandTotal(valueSource);

  return totalsRow;
}

export function extractSnapshotRows(
  snapshot: CorePlusDhType.coreplus.pivot.PivotSnapshot,
  table: CorePlusDhType.coreplus.pivot.PivotTable
): AgGridViewportRowData {
  const rows: AgGridViewportRowData = {};
  for (let rowIndex = 0; rowIndex < snapshot.rows.count; rowIndex += 1) {
    const row = extractSnapshotRow(
      snapshot,
      table,
      snapshot.rows.offset + rowIndex
    );
    rows[snapshot.rows.offset + rowIndex] = row;
  }

  // Need to push a row for totals as well
  rows[snapshot.rows.totalCount] = extractTotalsRow(snapshot, table);

  return rows;
}
