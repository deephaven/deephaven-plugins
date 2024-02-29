import type { WidgetExportedObject } from '@deephaven/jsapi-types';
import { DehydratedSort } from '@deephaven/iris-grid';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';
import { UITableElementName, UITABLE_ELEMENT_TYPE } from './ElementConstants';

export interface UITableProps {
  table: WidgetExportedObject;
  onRowDoublePress?: (
    rowIndex: number,
    rowData: Record<string, unknown>
  ) => void;
  alwaysFetchColumns?: string[];
  canSearch?: boolean;
  filters?: Record<string, string>;
  sorts?: DehydratedSort[];
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
