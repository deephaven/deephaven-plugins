import { GridPoint, ModelIndex } from '@deephaven/grid';
import type {
  ContextAction,
  ResolvableContextAction,
} from '@deephaven/components';
import {
  type IrisGridContextMenuData,
  IrisGridModel,
  IrisGridType,
  IrisGridContextMenuHandler,
} from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { type ColumnName } from '@deephaven/jsapi-utils';
import { ensureArray } from '@deephaven/utils';
import { getRowDataMap, RowDataMap, type UITableProps } from './UITableUtils';
import { getIcon } from '../utils/IconElementUtils';
import { ELEMENT_PREFIX, ElementPrefix } from '../model/ElementConstants';

interface UIContextItemParams {
  value: unknown;
  text: string | null;
  column_name: string;
  is_column_header: boolean;
  is_row_header: boolean;
  always_fetch_columns: RowDataMap;
}

type UIContextItem = Omit<ContextAction, 'action' | 'actions' | 'icon'> & {
  action?: (params: UIContextItemParams) => void;
  actions?: ResolvableUIContextItem[];
  icon?: string;
};

export type ResolvableUIContextItem =
  | UIContextItem
  | ((
      params: UIContextItemParams
    ) => Promise<UIContextItem | UIContextItem[] | null>);

function wrapUIContextItem(
  item: UIContextItem,
  data: IrisGridContextMenuData,
  alwaysFetchColumns: RowDataMap
): ContextAction {
  return {
    group: 999999, // Default to the end of the menu
    ...item,
    icon:
      item.icon != null && item.icon !== ''
        ? getIcon(`${ELEMENT_PREFIX.icon}${item.icon}` as ElementPrefix['icon'])
        : undefined,
    action: item.action
      ? () => {
          item.action?.({
            value: data.value,
            text: data.valueText,
            column_name: data.column.name,
            is_column_header: data.rowIndex == null,
            is_row_header: data.columnIndex == null,
            always_fetch_columns: alwaysFetchColumns,
          });
        }
      : undefined,
    actions: item.actions
      ? wrapContextActions(item.actions, data, alwaysFetchColumns)
      : undefined,
  } satisfies ContextAction;
}

function wrapUIContextItems(
  items: UIContextItem | UIContextItem[],
  data: IrisGridContextMenuData,
  alwaysFetchColumns: RowDataMap
): ContextAction[] {
  return ensureArray(items).map(item =>
    wrapUIContextItem(item, data, alwaysFetchColumns)
  );
}

/**
 * Wraps context item actions from the server so they are called with the cell info.
 * @param items The context items from the server
 * @param data The context menu data to use for the context items
 * @param alwaysFetchColumns The names of column data to always send or the data if it is a nested
 * @returns Context items with the UI actions wrapped so they receive the cell info
 */
export function wrapContextActions(
  items: ResolvableUIContextItem | ResolvableUIContextItem[],
  data: IrisGridContextMenuData,
  alwaysFetchColumns: ColumnName[] | RowDataMap
): ResolvableContextAction[] {
  let alwaysFetchColumnsMap: RowDataMap = {};
  if (Array.isArray(alwaysFetchColumns)) {
    const rowDataMap =
      data.modelRow != null ? getRowDataMap(data.modelRow, data.model) : {};
    // Filter rowDataMap for only alwaysFetchColumns keys
    alwaysFetchColumnsMap = Object.fromEntries(
      Object.entries(rowDataMap).filter(([key]) =>
        alwaysFetchColumns.includes(key)
      )
    );
  } else {
    alwaysFetchColumnsMap = alwaysFetchColumns;
  }

  return ensureArray(items).map(item => {
    if (typeof item === 'function') {
      return async () =>
        wrapUIContextItems(
          (await item({
            value: data.value,
            text: data.valueText,
            column_name: data.column.name,
            is_column_header: data.rowIndex == null,
            is_row_header: data.columnIndex == null,
            always_fetch_columns: alwaysFetchColumnsMap,
          })) ?? [],
          data,
          alwaysFetchColumnsMap
        );
    }

    return wrapUIContextItem(item, data, alwaysFetchColumnsMap);
  });
}

/**
 * Context menu handler for UITable.
 */
class UITableContextMenuHandler extends IrisGridContextMenuHandler {
  private model: IrisGridModel;

  private contextMenuItems: UITableProps['contextMenu'];

  private contextColumnHeaderItems: UITableProps['contextHeaderMenu'];

  private alwaysFetchColumns: ColumnName[];

  constructor(
    dh: typeof DhType,
    irisGrid: IrisGridType,
    model: IrisGridModel,
    contextMenuItems: UITableProps['contextMenu'],
    contextColumnHeaderItems: UITableProps['contextHeaderMenu'],
    alwaysFetchColumns: ColumnName[]
  ) {
    super(irisGrid, dh);
    this.order -= 1; // Make it just above the default handler priority
    this.irisGrid = irisGrid;
    this.model = model;
    this.contextMenuItems = contextMenuItems;
    this.contextColumnHeaderItems = contextColumnHeaderItems;
    this.alwaysFetchColumns = alwaysFetchColumns;
  }

  getHeaderActions(
    modelIndex: ModelIndex,
    gridPoint: GridPoint
  ): ResolvableContextAction[] {
    const { irisGrid, contextColumnHeaderItems, model } = this;

    const { column: columnIndex } = gridPoint;
    const modelColumn = irisGrid.getModelColumn(columnIndex);

    if (!contextColumnHeaderItems || modelColumn == null) {
      return super.getHeaderActions(modelIndex, gridPoint);
    }

    const { columns } = model;

    const sourceCell = model.sourceForCell(modelColumn, 0);
    const { column: sourceColumn } = sourceCell;
    const column = columns[sourceColumn];

    return [
      ...super.getHeaderActions(modelIndex, gridPoint),
      ...wrapContextActions(
        contextColumnHeaderItems,
        {
          value: null,
          valueText: null,
          rowIndex: null,
          columnIndex: sourceColumn,
          column,
          model,
          modelColumn,
          modelRow: null,
        },
        this.alwaysFetchColumns
      ),
    ];
  }
}

export default UITableContextMenuHandler;
