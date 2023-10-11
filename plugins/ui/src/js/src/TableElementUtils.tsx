import type { Table } from '@deephaven/jsapi-types';
import {
  ELEMENT_KEY,
  ElementNode,
  ExportedObject,
  isElementNode,
} from './ElementUtils';

export const TABLE_ELEMENT_TYPE = 'deephaven.ui.elements.TableElement';

export type TableElementName = `${typeof TABLE_ELEMENT_TYPE}`;

export type TableElementNode = ElementNode & {
  [ELEMENT_KEY]: TableElementName;
  props: {
    table: ExportedObject<Table>;
    onRowDoublePress?: (
      rowIndex: number,
      rowData: Record<string, unknown>
    ) => void;
    [key: string]: unknown;
  };
};

export function isTableElementNode(obj: unknown): obj is TableElementNode {
  return (
    isElementNode(obj) &&
    (obj as TableElementNode)[ELEMENT_KEY] === TABLE_ELEMENT_TYPE
  );
}
