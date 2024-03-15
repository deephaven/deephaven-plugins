import type { WidgetExportedObject } from '@deephaven/jsapi-types';

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
export type ElementNode<
  K extends string = string,
  P extends Record<string, unknown> = Record<string, unknown>
> = {
  /**
   * The type of this element. Can be something like `deephaven.ui.components.Panel`, or
   * a custom component type defined by the user in their plugin.
   */
  [ELEMENT_KEY]: K;
  props?: P;
};

export type ElementNodeWithChildren<
  K extends string = string,
  P extends Record<string, unknown> = Record<string, unknown>
> = ElementNode<K, P> & {
  props: React.PropsWithChildren<P>;
};

export function isObjectNode(obj: unknown): obj is ObjectNode {
  return obj != null && typeof obj === 'object' && OBJECT_KEY in obj;
}

/**
 * Type guard for `ElementNode` objects. If `name` is provided, it will also check
 * that the element name matches the provided name.
 * @param obj The object to check
 * @param name Optional name to check
 * @returns `true` if the object matches the `ElementNode` type and optionally
 * a given element name
 */
export function isElementNode(obj: unknown, name?: string): obj is ElementNode {
  const isElement =
    obj != null && typeof obj === 'object' && ELEMENT_KEY in obj;

  if (name == null) {
    return isElement;
  }

  return isElement && obj[ELEMENT_KEY] === name;
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

export function mapItemOrArray<T>(itemOrArray: T, mapItem: (item: T) => T): T;
export function mapItemOrArray<T>(
  itemOrArray: T[],
  mapItem: (item: T) => T
): T[];
export function mapItemOrArray<T>(
  itemOrArray: T | T[],
  mapItem: (item: T) => T
): T | T[] {
  if (Array.isArray(itemOrArray)) {
    return itemOrArray.map(mapItem);
  }

  return mapItem(itemOrArray);
}
