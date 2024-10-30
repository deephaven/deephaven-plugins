import { type StyleProps } from '@react-types/shared';
import type { dh } from '@deephaven/jsapi-types';
import { ColumnName, DehydratedSort } from '@deephaven/iris-grid';
import { ELEMENT_KEY, ElementNode, isElementNode } from '../utils/ElementUtils';
import { ELEMENT_NAME, ElementName } from '../model/ElementConstants';
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

export type UITableProps = StyleProps & {
  table: dh.WidgetExportedObject;
  format_?: FormattingRule[];
  onCellPress?: (data: CellData) => void;
  onCellDoublePress?: (data: CellData) => void;
  onRowPress?: (rowData: RowDataMap) => void;
  onRowDoublePress?: (rowData: RowDataMap) => void;
  onColumnPress?: (columnName: ColumnName) => void;
  onColumnDoublePress?: (columnName: ColumnName) => void;
  alwaysFetchColumns?: string | string[] | boolean;
  quickFilters?: Record<string, string>;
  sorts?: DehydratedSort[];
  showSearch: boolean;
  showQuickFilters: boolean;
  showGroupingColumn: boolean;
  reverse: boolean;
  frontColumns?: string[];
  backColumns?: string[];
  frozenColumns?: string[];
  hiddenColumns?: string[];
  columnGroups?: dh.ColumnGroup[];
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
