import { WidgetExportedObject } from '@deephaven/jsapi-types';

export const CALLABLE_KEY = '__dhCbid';
export const OBJECT_KEY = '__dhObid';
export const ELEMENT_KEY = '__dhElemName';

export type CallableNode = {
  /** The name of the callable to call */
  [CALLABLE_KEY]: string;
};

export type ObjectNode = {
  /** The index of the object in the exported objects array */
  [OBJECT_KEY]: number;
};

/**
 * Describes an element that can be rendered in the UI.
 * Extend this type with stricter rules on the element key type to provide types.
 * See `SpectrumElementNode` for an example.
 */
export type ElementNode = {
  /**
   * The type of this element. Can be something like `deephaven.ui.components.Panel`, or
   * a custom component type defined by the user in their plugin.
   */
  [ELEMENT_KEY]: string;
  props?: Record<string, unknown>;
};

export function isObjectNode(obj: unknown): obj is ObjectNode {
  return obj != null && typeof obj === 'object' && OBJECT_KEY in obj;
}

export function isElementNode(obj: unknown): obj is ElementNode {
  return obj != null && typeof obj === 'object' && ELEMENT_KEY in obj;
}

export function isCallableNode(obj: unknown): obj is CallableNode {
  return obj != null && typeof obj === 'object' && CALLABLE_KEY in obj;
}

export function isExportedObject(obj: unknown): obj is WidgetExportedObject {
  return (
    obj != null &&
    typeof obj === 'object' &&
    typeof (obj as WidgetExportedObject).fetch === 'function' &&
    typeof (obj as WidgetExportedObject).type === 'string'
  );
}

/**
 * Gets the type of an element object, or `unknown` if it is not an element.
 * @param node A node in a document, element or unknown object.
 * @returns The type of the element
 */
export function getElementType(node: unknown): string {
  return isElementNode(node) ? node[ELEMENT_KEY] : 'unknown';
}

export function getElementKey(node: unknown, defaultKey: string): string {
  if (!isElementNode(node) || node.props?.key == null) {
    return defaultKey;
  }
  return `${node.props?.key}`;
}
