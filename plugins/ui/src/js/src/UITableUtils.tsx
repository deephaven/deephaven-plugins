import type { Table } from '@deephaven/jsapi-types';
import {
  ELEMENT_KEY,
  ElementNode,
  ExportedObject,
  isElementNode,
} from './ElementUtils';

export const UITABLE_ELEMENT_TYPE = 'deephaven.ui.elements.UITable';

export type UITableElementName = `${typeof UITABLE_ELEMENT_TYPE}`;

export type UITableNode = ElementNode & {
  [ELEMENT_KEY]: UITableElementName;
  props: {
    table: ExportedObject<Table>;
    onRowDoublePress?: (
      rowIndex: number,
      rowData: Record<string, unknown>
    ) => void;
    [key: string]: unknown;
  };
};

export function isUITable(obj: unknown): obj is UITableNode {
  return (
    isElementNode(obj) &&
    (obj as UITableNode)[ELEMENT_KEY] === UITABLE_ELEMENT_TYPE
  );
}
