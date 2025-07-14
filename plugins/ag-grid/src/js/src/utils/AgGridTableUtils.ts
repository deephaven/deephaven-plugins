import type { dh as DhType } from '@deephaven/jsapi-types';
import { ColDef } from '@ag-grid-community/core';
import { TableUtils } from '@deephaven/jsapi-utils';
import AgGridFormatter from './AgGridFormatter';

export const TREE_NODE_KEY = '__dhTreeNodeKey__';
export type TreeNode = {
  hasChildren: boolean;
  isExpanded: boolean;
  depth: number;
  index: number;
};

/**
 * Converts a Deephaven column to an AG Grid ColDef with appropriate properties.
 *
 * @param column Deephaven column to map
 * @param templateColDef Template ColDef to use as a base
 * @returns The equivalent AG Grid ColDef
 */
export function convertColumnToColDef(
  column: DhType.Column,
  templateColDef?: Partial<ColDef>
): ColDef {
  const dataType = TableUtils.getNormalizedType(column.type);

  switch (dataType) {
    case TableUtils.dataType.BOOLEAN:
      return {
        ...templateColDef,
        cellDataType: dataType,
        filter: true,
        // Disable checkmarks: https://github.com/ag-grid/ag-grid/issues/9315
        cellRenderer: null,
      };
    case TableUtils.dataType.CHAR:
      return {
        ...templateColDef,
        cellDataType: dataType,
        filter: 'agNumberColumnFilter',
        filterParams: {
          allowedCharPattern: 'a-zA-Z',
          buttons: ['reset', 'apply'],
          numberParser: (text: string | null) =>
            text != null && text.length === 1 ? text.charCodeAt(0) : null,
          numberFormatter: (value: number | null) =>
            value != null ? String.fromCharCode(value) : null,
        },
      };
    case TableUtils.dataType.DATETIME:
      return {
        ...templateColDef,
        cellDataType: dataType,
        filter: 'agDateColumnFilter',
        cellStyle: params => AgGridFormatter.styleForDateCell(params),
      };
    case TableUtils.dataType.DECIMAL:
      return {
        ...templateColDef,
        cellDataType: dataType,
        filter: 'agNumberColumnFilter',
        cellStyle: params => AgGridFormatter.styleForNumberCell(params),
      };
    case TableUtils.dataType.INT:
      return {
        ...templateColDef,
        cellDataType: dataType,
        filter: 'agNumberColumnFilter',
        cellStyle: params => AgGridFormatter.styleForNumberCell(params),
      };
    case TableUtils.dataType.STRING:
      return {
        ...templateColDef,
        cellDataType: dataType,
        filter: true,
      };
    case TableUtils.dataType.UNKNOWN:
      return {
        ...templateColDef,
        cellDataType: TableUtils.dataType.STRING,
        filter: false,
      };
  }
}

export function getColumnDefs(
  table: DhType.Table | DhType.TreeTable
): ColDef[] {
  const groupedColSet = new Set(
    (TableUtils.isTreeTable(table) ? table.groupedColumns : []).map(c => c.name)
  );
  const newDefs =
    table?.columns.map(c => {
      const templateColDef: Partial<ColDef> = groupedColSet.has(c.name)
        ? {
            field: c.name,
            rowGroup: true,
          }
        : {
            field: c.name,

            // TODO: Actually use the table/column information to determine whether we can group/aggregate by it
            enableRowGroup: true,
            enableValue: true,
          };
      return convertColumnToColDef(c, templateColDef);
    }) ?? [];
  return newDefs;
}

function isTreeRow(row: DhType.Row | DhType.TreeRow): row is DhType.TreeRow {
  return 'hasChildren' in row && 'isExpanded' in row && 'depth' in row;
}

export function extractViewportRow(
  row: DhType.Row,
  columns: DhType.Column[]
): { [key: string]: unknown } {
  const data: Record<string, unknown> = {};
  for (let c = 0; c < columns.length; c += 1) {
    const column = columns[c];
    data[column.name] = row.get(column);
  }

  if (isTreeRow(row)) {
    data[TREE_NODE_KEY] = {
      hasChildren: row.hasChildren,
      isExpanded: row.isExpanded,
      depth: row.depth,
      index: row.index.asNumber(),
    } satisfies TreeNode;
  }

  return data;
}
