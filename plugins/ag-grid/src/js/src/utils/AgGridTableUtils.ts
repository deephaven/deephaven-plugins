import type { dh as DhType } from '@deephaven/jsapi-types';
import type { ColDef, SideBarDef } from '@ag-grid-community/core';
import type { dh as CorePlusDhType } from '@deephaven-enterprise/jsapi-coreplus-types';
import { TableUtils } from '@deephaven/jsapi-utils';
import { AgGridTableType } from '../types';
import AgGridFormatter from './AgGridFormatter';

export type SingleRowData = { [columnKey: string]: unknown };
export type AgGridViewportRowData = { [rowIndex: number]: SingleRowData };

export const TREE_NODE_KEY = '__dhTreeNodeKey__';
export type TreeNode = {
  hasChildren: boolean;
  isExpanded: boolean;
  depth: number;
  index: number;
};

export function isPivotTable(
  table: AgGridTableType
): table is CorePlusDhType.coreplus.pivot.PivotTable {
  return (
    'columnSources' in table && 'rowSources' in table && 'valueSources' in table
  );
}

export function isTable(table: AgGridTableType): table is DhType.Table {
  return (
    'columns' in table &&
    'rollup' in table &&
    typeof table.rollup === 'function'
  );
}

export function isTreeTable(table: AgGridTableType): table is DhType.TreeTable {
  return (
    'columns' in table &&
    'groupedColumns' in table &&
    'expand' in table &&
    'collapse' in table
  );
}

/**
 * Returns whether the given data type is groupable using Deephaven.
 * @param dataType The data type to check
 * @returns True if the data type is groupable, false otherwise
 */
export function isRowGroupable(dataType: string): boolean {
  return (
    !TableUtils.isBigDecimalType(dataType) &&
    !TableUtils.isBigIntegerType(dataType)
  );
}

/**
 * Get the cell style function for a specific data type.
 * @param dataType Data type of the column
 * @returns A function to style the cell based on its data type
 */
export function getCellStyleFunction(dataType: string): ColDef['cellStyle'] {
  switch (dataType) {
    case TableUtils.dataType.DECIMAL:
    case TableUtils.dataType.INT:
      return AgGridFormatter.styleForNumberCell;
    case TableUtils.dataType.DATETIME:
      return AgGridFormatter.styleForDateCell;
    default:
      return undefined;
  }
}

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
        cellStyle: getCellStyleFunction(dataType),
      };
    case TableUtils.dataType.DECIMAL:
      return {
        ...templateColDef,
        cellDataType: dataType,
        filter: 'agNumberColumnFilter',
        cellStyle: getCellStyleFunction(dataType),
      };
    case TableUtils.dataType.INT:
      return {
        ...templateColDef,
        cellDataType: dataType,
        filter: 'agNumberColumnFilter',
        cellStyle: getCellStyleFunction(dataType),
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

export function getColumnDefs(table: AgGridTableType): ColDef[] {
  if (isTable(table) || isTreeTable(table)) {
    const groupedColSet = new Set(
      (isTreeTable(table) ? table.groupedColumns : []).map(c => c.name)
    );
    const newDefs =
      table?.columns.map(c => {
        const templateColDef: Partial<ColDef> = groupedColSet.has(c.name)
          ? {
              field: c.name,
              headerName: c.name,
              rowGroup: true,
            }
          : {
              field: c.name,
              headerName: c.name,
              enableRowGroup: isRowGroupable(c.type),
              enableValue: true,
            };
        return convertColumnToColDef(c, templateColDef);
      }) ?? [];
    return newDefs;
  }

  if (isPivotTable(table)) {
    // For pivot tables, we need to create ColDefs for the row, column, and value sources.
    const colDefs: ColDef[] = [];
    table.rowSources.forEach(c => {
      colDefs.push({ field: c.name, rowGroup: true });
    });
    table.columnSources.forEach(c => {
      colDefs.push({ field: c.name, pivot: true });
    });
    table.valueSources.forEach(c => {
      // We're just pushing an `aggFunc` here so it shows up correctly in the UI, but we also set the `suppressAggFuncInHeader` so that it doesn't actually appear.
      // We specify our own custom aggregation name. We don't actually use it, since the server does the aggregation already.
      colDefs.push({ field: c.name, aggFunc: 'deephaven-aggregation' });
    });
    return colDefs;
  }

  throw new Error(`Unsupported table type: ${table}`);
}

export function getSideBar(table: AgGridTableType): SideBarDef {
  return {
    toolPanels: [
      {
        id: 'columns',
        labelDefault: 'Columns',
        labelKey: 'columns',
        iconKey: 'columns',
        toolPanel: 'agColumnsToolPanel',
        toolPanelParams: {
          suppressRowGroups: isTreeTable(table),
          suppressValues: isTreeTable(table),
          suppressPivots: true,
        },
      },
    ],
  };
}

function isTreeRow(row: DhType.Row | DhType.TreeRow): row is DhType.TreeRow {
  return 'hasChildren' in row && 'isExpanded' in row && 'depth' in row;
}

export function extractViewportRow(
  row: DhType.Row,
  columns: DhType.Column[]
): SingleRowData {
  const data: SingleRowData = {};
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
