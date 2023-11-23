import type { WidgetExportedObject } from '@deephaven/jsapi-types';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';

export const OBJECT_ELEMENT_NAME = 'deephaven.ui.components.Object';

export type ObjectElementType = typeof OBJECT_ELEMENT_NAME;

export type ObjectViewProps = { object: WidgetExportedObject };

/** Describes an object that can be rendered in the UI. */
export type ObjectElementNode = ElementNode<ObjectElementType> & {
  props: ObjectViewProps;
};

/**
 * Check if an object is a ObjectElementNode
 * @param obj Object to check
 * @returns True if the object is a ObjectElementNode
 */
export function isObjectElementNode(obj: unknown): obj is ObjectElementNode {
  return (
    isElementNode(obj) &&
    (obj as ElementNode)[ELEMENT_KEY] === OBJECT_ELEMENT_NAME
  );
}
