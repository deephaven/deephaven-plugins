import { type StyleProps } from '@react-types/shared';
import type { dh } from '@deephaven/jsapi-types';
import {
  type ColumnName,
  type DehydratedSort,
  AggregationOperation,
} from '@deephaven/iris-grid';
import {
  ELEMENT_KEY,
  type ElementNode,
  isElementNode,
} from '../utils/ElementUtils';
import { ELEMENT_NAME, type ElementName } from '../model/ElementConstants';
import { type ResolvableUIContextItem } from './UITableContextMenuHandler';

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
  table: dh.WidgetExportedObject;
  format_?: FormattingRule | FormattingRule[];
  onCellPress?: (data: CellData) => void;
  onCellDoublePress?: (data: CellData) => void;
  onRowPress?: (rowData: RowDataMap) => void;
  onRowDoublePress?: (rowData: RowDataMap) => void;
  onColumnPress?: (columnName: ColumnName) => void;
  onColumnDoublePress?: (columnName: ColumnName) => void;
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
export function getAggregationOperation(
  agg: string
): AggregationOperation | undefined {
  const lowerAgg = agg.toLowerCase().replace(/_/g, '');
  const operation = Object.values(AggregationOperation).find(
    op => op.toLowerCase() === lowerAgg
  );

  if (operation == null) {
    throw new Error(`Invalid aggregation operation: ${agg}`);
  }

  return operation;
}
