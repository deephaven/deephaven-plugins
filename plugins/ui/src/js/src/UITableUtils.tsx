import type { WidgetExportedObject } from '@deephaven/jsapi-types';
import { DehydratedSort } from '@deephaven/iris-grid';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';

export const UITABLE_ELEMENT_TYPE = 'deephaven.ui.elements.UITable';

export type UITableElementName = typeof UITABLE_ELEMENT_TYPE;

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
