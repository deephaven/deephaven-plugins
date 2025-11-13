import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import { ColDef, ColGroupDef } from 'ag-grid-community';
import { assertNotNull } from '@deephaven/utils';
import {
  AgGridViewportRowData,
  getCellStyleFunction,
  SingleRowData,
  TREE_NODE_KEY,
} from './AgGridTableUtils';

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
 * Converts a group key string and a value source name to a value key string.
 * @param groupKeyString The group key string.
 * @param valueSourceName The value source name.
 * @returns A value key string.
 */
export function toValueKeyString(
  groupKeyString: string,
  valueSourceName: string
): string {
  return `${groupKeyString}/${valueSourceName}`;
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

export function makePendingColDef(groupId: string): ColDef {
  return {
    headerName: '...',
    field: `${groupId}/...`,
    colId: `${groupId}/...`,
    columnGroupShow: 'open',
    maxWidth: 30, // We don't need the pending column to be very wide
  };
}

/**
 * Get the column definition for a column with value sources in a pivot table.
 * If only one value source is provided, it will return a simple column definition.
 * If multiple value sources are provided, it will return a column group definition
 * @param headerName Header name of the value source group
 * @param columnKey Column key of the value source group
 * @param valueSources Value sources for the pivot table
 * @returns The pivot value source group definition
 */
export function makeColumnValuesColDef(
  headerName: string,
  columnKey: string,
  valueSources: CorePlusDhType.coreplus.pivot.PivotSource[]
): ColGroupDef | ColDef {
  if (valueSources.length === 0) {
    throw new Error('No value sources provided');
  }

  const children: ColDef[] = valueSources.map(valueSource => {
    const dataType = TableUtils.getNormalizedType(valueSource.type);
    return {
      headerName: valueSource.name,
      field: toValueKeyString(columnKey, valueSource.name),
      colId: toValueKeyString(columnKey, valueSource.name),
      cellDataType: dataType,
      cellStyle: getCellStyleFunction(dataType),
    };
  });
  if (children.length === 1) {
    return { ...children[0], headerName };
  }
  return {
    headerName,
    groupId: columnKey,
    children,
  };
}

/**
 * Get the pivot result columns from the provided pivot dimension data. This tells AG Grid how to display the columns, including expandable/collapsible groups.
 * @param columns The pivot dimension data representing the columns.
 * @param valueSources The value sources for the pivot table.
 * @returns An array of column definitions for the pivot result.
 */
export function getPivotResultColumns(
  columns: CorePlusDhType.coreplus.pivot.DimensionData,
  valueSources: CorePlusDhType.coreplus.pivot.PivotSource[]
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
      currentGroup.children.push(makePendingColDef(currentGroup.groupId ?? ''));
    }
    // Also add the totals for this group
    const totalsValueGroup = makeColumnValuesColDef(
      `${currentGroup.headerName} Totals`,
      currentGroup.groupId ?? '',
      valueSources
    );
    currentGroup.children.push(totalsValueGroup);
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
        columnGroupShow: 'open',
        children: [],
      });
    } else {
      const columnValueGroup = makeColumnValuesColDef(
        headerName,
        columnKey,
        valueSources
      );
      getCurrentChildren().push({
        ...columnValueGroup,
        // We only want these values to show when the parent is open
        columnGroupShow: 'open',
      });
    }
  }

  while (currentGroups.length > 0) {
    closeGroup();
  }

  // Add a root level totals column for each value source as well
  for (let v = 0; v < valueSources.length; v += 1) {
    const valueSource = valueSources[v];
    const dataType = TableUtils.getNormalizedType(valueSource.type);
    result.push({
      headerName: `${valueSource.name} Totals`,
      field: valueSource.name,
      colId: valueSource.name,
      cellDataType: dataType,
      cellStyle: getCellStyleFunction(dataType),
    });
  }

  return result;
}

export function extractSnapshotRow(
  snapshot: CorePlusDhType.coreplus.pivot.PivotSnapshot,
  table: CorePlusDhType.coreplus.pivot.PivotTable,
  rowIndex: number
): SingleRowData {
  const rowKeys = snapshot.rows.getKeys(rowIndex);
  const row: SingleRowData = {};
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
    for (let v = 0; v < table.valueSources.length; v += 1) {
      const valueSource = table.valueSources[v];
      const valueKey = toValueKeyString(columnKey, valueSource.name);
      const value = snapshot.getValue(
        valueSource,
        rowIndex,
        snapshot.columns.offset + c
      );
      row[valueKey] = value;
    }
  }

  // Add the totals data
  for (let v = 0; v < table.valueSources.length; v += 1) {
    const valueSource = table.valueSources[v];
    row[valueSource.name] = snapshot.rows.getTotal(rowIndex, valueSource);
  }

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
  for (let c = 0; c < snapshot.columns.count; c += 1) {
    const columnKey = toGroupKeyString(snapshot.columns.getKeys(c));
    for (let v = 0; v < table.valueSources.length; v += 1) {
      const valueSource = table.valueSources[v];
      const valueKey = toValueKeyString(columnKey, valueSource.name);
      const value = snapshot.columns.getTotal(c, valueSource);
      totalsRow[valueKey] = value;
    }
  }

  // Grand totals values
  for (let v = 0; v < table.valueSources.length; v += 1) {
    const valueSource = table.valueSources[v];
    totalsRow[valueSource.name] = snapshot.getGrandTotal(valueSource);
  }

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
