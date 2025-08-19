import { type StyleProps } from '@react-types/shared';
import type { dh } from '@deephaven/jsapi-types';
import {
  type ColumnName,
  type DehydratedSort,
  AggregationOperation,
  type IrisGridModel,
  IrisGridType,
} from '@deephaven/iris-grid';
import {
  BoundedGridRange,
  GridRange,
  isExpandableGridModel,
  type ModelIndex,
} from '@deephaven/grid';
import { assertNotNull } from '@deephaven/utils';
import {
  ELEMENT_KEY,
  type ElementNode,
  isElementNode,
} from '../utils/ElementUtils';
import { ELEMENT_NAME, type ElementName } from '../model/ElementConstants';
import { type ResolvableUIContextItem } from './UITableContextMenuHandler';
import UriExportedObject from '../../widget/UriExportedObject';

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

export type ColorGradient = string[];

export type DatabarConfig = {
  column: ColumnName;
  value_column?: ColumnName;
  min?: number | ColumnName;
  max?: number | ColumnName;
  axis?: 'proportional' | 'middle' | 'directional';
  direction?: 'LTR' | 'RTL';
  value_placement?: 'beside' | 'overlap' | 'hide';
  color?:
    | string
    | ColorGradient
    | { positive?: string | ColorGradient; negative?: string | ColorGradient };
  opacity?: number;
  markers?: { value: number | string; color?: string }[];
};

export type FormattingRule = {
  cols?: ColumnName | ColumnName[];
  if_?: string;
  color?: string;
  background_color?: string;
  alignment?: 'left' | 'center' | 'right';
  value?: string;
  mode?: DatabarConfig;
};

type UIAggregation = {
  agg: string;
  cols?: ColumnName | ColumnName[];
  ignore_cols?: ColumnName | ColumnName[];
};

export type UITableProps = StyleProps & {
  table: dh.WidgetExportedObject | UriExportedObject;
  format_?: FormattingRule | FormattingRule[];
  onCellPress?: (data: CellData) => void;
  onCellDoublePress?: (data: CellData) => void;
  onRowPress?: (rowData: RowDataMap) => void;
  onRowDoublePress?: (rowData: RowDataMap) => void;
  onColumnPress?: (columnName: ColumnName) => void;
  onColumnDoublePress?: (columnName: ColumnName) => void;
  onSelectionChange?: (selectedRows: RowDataMap[]) => void;
  alwaysFetchColumns?: string | string[] | boolean;
  quickFilters?: Record<string, string>;
  sorts?: DehydratedSort[];
  aggregations?: UIAggregation | UIAggregation[];
  aggregationsPosition?: 'top' | 'bottom';
  showSearch: boolean;
  showQuickFilters: boolean;
  showGroupingColumn: boolean;
  reverse: boolean;
  frontColumns?: string[];
  backColumns?: string[];
  frozenColumns?: string[];
  hiddenColumns?: string[];
  columnGroups?: dh.ColumnGroup[];
  columnDisplayNames?: Record<ColumnName, string>;
  density?: 'compact' | 'regular' | 'spacious';
  contextMenu?: ResolvableUIContextItem | ResolvableUIContextItem[];
  contextHeaderMenu?: ResolvableUIContextItem | ResolvableUIContextItem[];
  databars?: DatabarConfig[];
  [key: string]: unknown; // Needed because StyleProps is an interface which removes the implicit index signature of the type
};

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
 * Gets the case-sensitive aggregation name for use with the JS API from a case-insensitive name.
 * Also removes undescores when needed.
 * E.g. "sum" -> "Sum" or "COUNT" -> "Count" or "ABS_SUM" -> "AbsSum" or "abssum" -> "AbsSum"
 * @param agg The name of the aggregation operation
 * @returns The case-sensitive aggregation operation enum value
 */
export function getAggregationOperation(agg: string): AggregationOperation {
  const lowerAgg = agg.toLowerCase().replace(/_/g, '');
  const operation = Object.values(AggregationOperation).find(
    op => op.toLowerCase() === lowerAgg
  );

  if (operation == null) {
    throw new Error(
      `Invalid aggregation operation: ${agg}. Valid operations are: ${Object.values(
        AggregationOperation
      ).join(', ')}`
    );
  }

  return operation;
}

export function getCellData(
  columnIndex: ModelIndex,
  rowIndex: ModelIndex,
  model: IrisGridModel
): CellData {
  const column = model.columns[columnIndex];
  const { type } = column;
  const value = model.valueForCell(columnIndex, rowIndex);
  const text = model.textForCell(columnIndex, rowIndex);
  return {
    value,
    text,
    type,
  };
}

/**
 * Get the data map for the given row
 * @param rowIndex Row to get the data map for
 * @param model The IrisGridModel to get the data from
 * @param columnNames Optional array of column names to filter the data map.
 *                    If not provided, all columns in the viewport will be included.
 * @returns Data map for the row
 */
export function getRowDataMap(
  rowIndex: ModelIndex,
  model: IrisGridModel,
  columnNames?: string[]
): RowDataMap {
  const { columns, groupedColumns } = model;
  const columnNamesSet = new Set(columnNames);
  const dataMap: RowDataMap = {};
  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i];
    const { name } = column;
    if (columnNames == null || columnNamesSet.has(name)) {
      const isExpandable =
        isExpandableGridModel(model) && model.isRowExpandable(rowIndex);
      const isGrouped = groupedColumns.find(c => c.name === name) != null;
      const cellData = getCellData(i, rowIndex, model);
      // If the cellData.value is undefined, that means we don't have any data for that column (i.e. the column is not visible), don't send it back
      if (cellData.value !== undefined) {
        dataMap[name] = {
          ...cellData,
          isGrouped,
          isExpandable,
        };
      }
    }
  }

  return dataMap;
}

export function getSelectionDataMap(
  ranges: readonly GridRange[],
  model: IrisGridModel,
  irisGrid: IrisGridType,
  columnNames?: string[]
): RowDataMap[] {
  const dataMaps: RowDataMap[] = [];

  const boundedSortedRanges = (
    GridRange.boundedRanges(
      GridRange.consolidate(ranges),
      model.columnCount,
      model.rowCount
    ) as BoundedGridRange[]
  ).sort((a, b) => a.startRow - b.startRow); // Ensure we're in ascending order by row

  const { metrics } = irisGrid.state;
  assertNotNull(metrics);
  const { top, bottomViewport } = metrics;

  for (let i = 0; i < boundedSortedRanges.length; i += 1) {
    const visibleRange = GridRange.intersection(
      boundedSortedRanges[i],
      GridRange.makeNormalized(null, top, null, bottomViewport)
    ) as BoundedGridRange;

    if (visibleRange == null) {
      // eslint-disable-next-line no-continue
      continue;
    }

    for (
      let row = visibleRange.startRow;
      row <= visibleRange.endRow;
      row += 1
    ) {
      const modelRow = irisGrid.getModelRow(row);
      if (modelRow != null) {
        const rowDataMap = getRowDataMap(modelRow, model, columnNames);
        dataMaps.push(rowDataMap);
      }
    }
  }
  return dataMaps;
}
