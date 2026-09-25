import {
  GridRange,
  type GridPoint,
  type ModelIndex,
  isRangedSelection,
} from '@deephaven/grid';
import type {
  ContextAction,
  ResolvableContextAction,
} from '@deephaven/components';
import {
  type IrisGridContextMenuData,
  type IrisGridModel,
  type IrisGridType,
  IrisGridContextMenuHandler,
  KeyedSelection,
  isKeyedGridModel,
} from '@deephaven/iris-grid';
import type { dh as DhType } from '@deephaven/jsapi-types';
import { type ColumnName } from '@deephaven/jsapi-utils';
import { ensureArray } from '@deephaven/utils';
import {
  getRowDataMap,
  type RowDataMap,
  type UITableProps,
} from './UITableUtils';
import { getIcon } from '../utils/IconElementUtils';
import { ELEMENT_PREFIX, type ElementPrefix } from '../model/ElementConstants';

interface UIContextItemParams {
  value: unknown;
  text: string | null;
  column_name: string;
  is_column_header: boolean;
  is_row_header: boolean;
  always_fetch_columns: RowDataMap;
  selected_ranges: {
    start_row: number | null;
    end_row: number | null;
    start_column: number | null;
    end_column: number | null;
  }[];
  /**
   * Populated instead of `selected_ranges` when the table declares key columns
   * (`with_keys`). Identifies rows by value so the selection survives ticks.
   */
  selected_keys: {
    key_columns: string[];
    key_values: unknown[][];
    inverted: boolean;
  } | null;
  _visible_columns: string[];
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
  alwaysFetchColumns: RowDataMap,
  selectedRanges: UIContextItemParams['selected_ranges'],
  visibleColumns: string[],
  selectedKeys: UIContextItemParams['selected_keys']
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
            selected_ranges: selectedRanges,
            selected_keys: selectedKeys,
            _visible_columns: visibleColumns,
          });
        }
      : undefined,
    actions: item.actions
      ? wrapContextActions(
          item.actions,
          data,
          alwaysFetchColumns,
          selectedRanges,
          visibleColumns,
          selectedKeys
        )
      : undefined,
  } satisfies ContextAction;
}

function wrapUIContextItems(
  items: UIContextItem | UIContextItem[],
  data: IrisGridContextMenuData,
  alwaysFetchColumns: RowDataMap,
  selectedRanges: UIContextItemParams['selected_ranges'],
  visibleColumns: string[],
  selectedKeys: UIContextItemParams['selected_keys']
): ContextAction[] {
  return ensureArray(items).map(item =>
    wrapUIContextItem(
      item,
      data,
      alwaysFetchColumns,
      selectedRanges,
      visibleColumns,
      selectedKeys
    )
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
  alwaysFetchColumns: ColumnName[] | RowDataMap,
  selectedRanges: UIContextItemParams['selected_ranges'],
  visibleColumns: string[],
  selectedKeys: UIContextItemParams['selected_keys'] = null
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
            selected_ranges: selectedRanges,
            selected_keys: selectedKeys,
            _visible_columns: visibleColumns,
          })) ?? [],
          data,
          alwaysFetchColumnsMap,
          selectedRanges,
          visibleColumns,
          selectedKeys
        );
    }

    return wrapUIContextItem(
      item,
      data,
      alwaysFetchColumnsMap,
      selectedRanges,
      visibleColumns,
      selectedKeys
    );
  });
}

/**
 * Converts the viewport-space selected ranges from IrisGrid to model-index ranges.
 * Returns empty for keyed selections, which are sent via `getSelectedKeys` instead.
 */
export function getModelSelectedRanges(
  irisGrid: IrisGridType,
  contextMenuData: IrisGridContextMenuData
): UIContextItemParams['selected_ranges'] {
  // `selection` is already the effective selection: IrisGrid substitutes the
  // clicked row when the right-click lands outside the current selection.
  const selection = contextMenuData.selection ?? irisGrid.state.gridSelection;
  if (selection == null || !isRangedSelection(selection)) {
    return [];
  }

  return GridRange.consolidate(selection.toRanges())
    .sort((a, b) => (a.startRow ?? 0) - (b.startRow ?? 0))
    .map(range => ({
      start_row:
        range.startRow != null
          ? irisGrid.getModelRow(range.startRow) ?? null
          : null,
      end_row:
        range.endRow != null
          ? irisGrid.getModelRow(range.endRow) ?? null
          : null,
      start_column:
        range.startColumn != null
          ? irisGrid.getModelColumn(range.startColumn) ?? null
          : null,
      end_column:
        range.endColumn != null
          ? irisGrid.getModelColumn(range.endColumn) ?? null
          : null,
    }));
}

/**
 * Extracts the key-based selection for tables that declare key columns, or null
 * when the selection is positional. Key values are sent instead of row positions
 * so the server resolves the same rows even if they move.
 */
export function getSelectedKeys(
  irisGrid: IrisGridType,
  contextMenuData: IrisGridContextMenuData
): UIContextItemParams['selected_keys'] {
  const selection = contextMenuData.selection ?? irisGrid.state.gridSelection;
  if (!(selection instanceof KeyedSelection)) {
    return null;
  }

  const { model } = contextMenuData;
  return {
    key_columns: isKeyedGridModel(model)
      ? model.selectionKeyColumnIndices.map(i => model.columns[i].name)
      : [],
    key_values: Array.from(selection.selectedKeyValues.values()).map(values => [
      ...values,
    ]),
    inverted: selection.invertedSelection,
  };
}

/**
 * Returns visible column names in their current visual order (moves applied, hidden columns excluded).
 */
export function getVisibleColumnNames(
  irisGrid: IrisGridType,
  model: IrisGridModel
): string[] {
  const { metrics } = irisGrid.state;
  if (metrics == null) return [];

  const names: string[] = [];
  for (let visIdx = 0; visIdx < metrics.columnCount; visIdx += 1) {
    const modelIdx = irisGrid.getModelColumn(visIdx);
    if (
      modelIdx != null &&
      model.columns[modelIdx] != null &&
      (metrics.allColumnWidths.get(visIdx) ?? 0) > 0
    ) {
      names.push(model.columns[modelIdx].name);
    }
  }
  return names;
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

    const headerContextMenuData: IrisGridContextMenuData = {
      value: null,
      valueText: null,
      rowIndex: null,
      columnIndex: sourceColumn,
      column,
      model,
      modelColumn,
      modelRow: null,
    };

    return [
      ...super.getHeaderActions(modelIndex, gridPoint),
      ...wrapContextActions(
        contextColumnHeaderItems,
        headerContextMenuData,
        this.alwaysFetchColumns,
        getModelSelectedRanges(irisGrid, headerContextMenuData),
        getVisibleColumnNames(irisGrid, model),
        getSelectedKeys(irisGrid, headerContextMenuData)
      ),
    ];
  }
}

export default UITableContextMenuHandler;
