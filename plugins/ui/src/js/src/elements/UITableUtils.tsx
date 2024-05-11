import type { dh } from '@deephaven/jsapi-types';
import { ColumnName, DehydratedSort, RowIndex } from '@deephaven/iris-grid';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';
import { UITableElementName, UITABLE_ELEMENT_TYPE } from './ElementConstants';

export type CellData = {
  type: string;
  text: string;
  value: unknown;
};

export type RowDataValue = CellData & {
  isExpandable: boolean;
  isGrouped: boolean;
};

export type ColumnIndex = number;

export type RowDataMap = Record<ColumnName, RowDataValue>;

export interface UITableProps {
  table: dh.WidgetExportedObject;
  onCellPress?: (cellIndex: [ColumnIndex, RowIndex], data: CellData) => void;
  onCellDoublePress?: (
    cellIndex: [ColumnIndex, RowIndex],
    data: CellData
  ) => void;
  onRowPress?: (rowIndex: RowIndex, rowData: RowDataMap) => void;
  onRowDoublePress?: (rowIndex: RowIndex, rowData: RowDataMap) => void;
  onColumnPress?: (columnName: ColumnName) => void;
  onColumnDoublePress?: (columnName: ColumnName) => void;
  alwaysFetchColumns?: string[];
  quickFilters?: Record<string, string>;
  sorts?: DehydratedSort[];
  showSearch?: boolean;
  showQuickFilters?: boolean;
  [key: string]: unknown;
}

export type UITableNode = Required<
  ElementNode<UITableElementName, UITableProps>
>;

export function isUITable(obj: unknown): obj is UITableNode {
  return (
    isElementNode(obj) &&
    (obj as UITableNode)[ELEMENT_KEY] === UITABLE_ELEMENT_TYPE
  );
}
