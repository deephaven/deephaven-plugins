import type { dh } from '@deephaven/jsapi-types';
import type {
  ColumnName,
  DehydratedSort,
  IrisGridContextMenuData,
  RowIndex,
} from '@deephaven/iris-grid';
import type { ContextAction } from '@deephaven/components';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';
import { ELEMENT_NAME, ElementName } from './ElementConstants';

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

export type UIContextItem = Omit<ContextAction, 'action' | 'actions'> & {
  action?: (params: {
    value: unknown;
    text_value: string | null;
    column_name: string;
    is_column_header: boolean;
    is_row_header: boolean;
  }) => void;

  actions?: UIContextItem[];
};
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
  showSearch: boolean;
  showQuickFilters: boolean;
  contextItems?: UIContextItem[];
  contextColumnHeaderItems?: UIContextItem[];
  [key: string]: unknown;
}

export type UITableNode = Required<
  ElementNode<ElementName['uiTable'], UITableProps>
>;

export function isUITable(obj: unknown): obj is UITableNode {
  return (
    isElementNode(obj) &&
    (obj as UITableNode)[ELEMENT_KEY] === ELEMENT_NAME.uiTable
  );
}

/**
 * Wraps context item actions from the server so they are called with the cell info.
 * @param items The context items from the server
 * @param data The context menu data to use for the context items
 * @returns Context items with the UI actions wrapped so they receive the cell info
 */
export function wrapContextActions(
  items: UIContextItem[],
  data: Omit<IrisGridContextMenuData, 'model' | 'modelRow' | 'modelColumn'>
): ContextAction[] {
  return items.map(item => ({
    group: 999999, // Default to the end of the menu
    ...item,
    action: item.action
      ? () => {
          item.action?.({
            value: data.value,
            text_value: data.valueText,
            column_name: data.column.name,
            is_column_header: data.rowIndex == null,
            is_row_header: data.columnIndex == null,
          });
        }
      : undefined,
    actions: item.actions ? wrapContextActions(item.actions, data) : undefined,
  }));
}
