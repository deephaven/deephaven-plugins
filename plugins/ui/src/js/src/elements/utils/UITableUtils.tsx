import type { dh } from '@deephaven/jsapi-types';
import type {
  ColumnName,
  DehydratedSort,
  IrisGridContextMenuData,
} from '@deephaven/iris-grid';
import type {
  ContextAction,
  ResolvableContextAction,
} from '@deephaven/components';
import { ensureArray } from '@deephaven/utils';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';
import { getIcon } from './IconElementUtils';
import {
  ELEMENT_NAME,
  ELEMENT_PREFIX,
  ElementName,
  ElementPrefix,
} from '../model/ElementConstants';

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

export interface UIContextItemParams {
  value: unknown;
  text_value: string | null;
  column_name: string;
  is_column_header: boolean;
  is_row_header: boolean;
}

export type UIContextItem = Omit<ContextAction, 'action' | 'actions'> & {
  action?: (params: UIContextItemParams) => void;

  actions?: ResolvableUIContextItem[];
};

type ResolvableUIContextItem =
  | UIContextItem
  | ((
      params: UIContextItemParams
    ) => Promise<UIContextItem | UIContextItem[] | null>);

export interface UITableProps {
  table: dh.WidgetExportedObject;
  onCellPress?: (data: CellData) => void;
  onCellDoublePress?: (data: CellData) => void;
  onRowPress?: (rowData: RowDataMap) => void;
  onRowDoublePress?: (rowData: RowDataMap) => void;
  onColumnPress?: (columnName: ColumnName) => void;
  onColumnDoublePress?: (columnName: ColumnName) => void;
  alwaysFetchColumns?: string[];
  quickFilters?: Record<string, string>;
  sorts?: DehydratedSort[];
  showSearch: boolean;
  showQuickFilters: boolean;
  contextMenu?: ResolvableUIContextItem | ResolvableUIContextItem[];
  contextHeaderMenu?: ResolvableUIContextItem | ResolvableUIContextItem[];
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

function wrapUIContextItem(
  item: UIContextItem,
  data: Omit<IrisGridContextMenuData, 'model' | 'modelRow' | 'modelColumn'>
): ContextAction {
  return {
    group: 999999, // Default to the end of the menu
    ...item,
    icon: item.icon
      ? getIcon(`${ELEMENT_PREFIX.icon}${item.icon}` as ElementPrefix['icon'])
      : undefined,
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
  } satisfies ContextAction;
}

function wrapUIContextItems(
  items: UIContextItem | UIContextItem[],
  data: Omit<IrisGridContextMenuData, 'model' | 'modelRow' | 'modelColumn'>
): ContextAction[] {
  return ensureArray(items).map(item => wrapUIContextItem(item, data));
}

/**
 * Wraps context item actions from the server so they are called with the cell info.
 * @param items The context items from the server
 * @param data The context menu data to use for the context items
 * @returns Context items with the UI actions wrapped so they receive the cell info
 */
export function wrapContextActions(
  items: ResolvableUIContextItem | ResolvableUIContextItem[],
  data: Omit<IrisGridContextMenuData, 'model' | 'modelRow' | 'modelColumn'>
): ResolvableContextAction[] {
  return ensureArray(items).map(item => {
    if (typeof item === 'function') {
      return async () =>
        wrapUIContextItems(
          (await item({
            value: data.value,
            text_value: data.valueText,
            column_name: data.column.name,
            is_column_header: data.rowIndex == null,
            is_row_header: data.columnIndex == null,
          })) ?? [],
          data
        );
    }

    return wrapUIContextItem(item, data);
  });
}
