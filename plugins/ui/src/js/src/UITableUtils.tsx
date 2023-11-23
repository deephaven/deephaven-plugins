import type { WidgetExportedObject } from '@deephaven/jsapi-types';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';

export const UITABLE_ELEMENT_TYPE = 'deephaven.ui.elements.UITable';

export type UITableElementName = typeof UITABLE_ELEMENT_TYPE;

export interface UITableProps {
  table: WidgetExportedObject;
  onRowDoublePress?: (
    rowIndex: number,
    rowData: Record<string, unknown>
  ) => void;
  [key: string]: unknown;
}

export type UITableNode = ElementNode<UITableElementName> & {
  props: UITableProps;
};

export function isUITable(obj: unknown): obj is UITableNode {
  return (
    isElementNode(obj) &&
    (obj as UITableNode)[ELEMENT_KEY] === UITABLE_ELEMENT_TYPE
  );
}
