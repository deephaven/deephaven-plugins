import React from 'react';
import { Text } from '@adobe/react-spectrum';
import type { dh } from '@deephaven/jsapi-types';
import { ITEM_ELEMENT_NAME } from './ElementConstants';
import ObjectView from './ObjectView';

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
  P extends Record<string, unknown> = Record<string, unknown>,
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
  P extends Record<string, unknown> = Record<string, unknown>,
> = ElementNode<K, P> & {
  props: React.PropsWithChildren<P>;
};

export function isObjectNode(obj: unknown): obj is ObjectNode {
  return obj != null && typeof obj === 'object' && OBJECT_KEY in obj;
}

/**
 * Re-export and fetch the table from the given exported object.
 * @param exportedObject
 * @returns Promise that resolves to the table or null if given
 * object is null
 */
export async function fetchReexportedTable(
  exportedObject: dh.WidgetExportedObject | null
): Promise<dh.Table | null> {
  if (exportedObject == null) {
    return null;
  }

  const reexportedTable = await exportedObject.reexport();
  return reexportedTable.fetch();
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

export function isExportedObject(obj: unknown): obj is dh.WidgetExportedObject {
  return (
    obj != null &&
    typeof obj === 'object' &&
    typeof (obj as dh.WidgetExportedObject).fetch === 'function' &&
    typeof (obj as dh.WidgetExportedObject).type === 'string'
  );
}

/**
 * Typeguard for primitive values.
 * @param value The value to check
 * @returns True if given value is a string, number, or boolean
 */
export function isPrimitive(
  value: unknown
): value is string | number | boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
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

/**
 * Wrap certain children of an element node with the appropriate React components.
 * 1. Exported objects are wrapped with `ObjectView`
 * 2. Primitive children of `Item` elements are wrapped with `Text`, and the
 * `textValue` prop of `Item` element is set if it doesn't exist and the
 * original had a single primitive child
 * @param element The element node to wrap children for
 * @returns A new element node with wrapped children or the original if no
 * children are present
 */
export function wrapElementChildren(element: ElementNode): ElementNode {
  if (element.props?.children == null) {
    return element;
  }

  const newProps = { ...element.props };

  const isItemElement = isElementNode(element, ITEM_ELEMENT_NAME);

  // We will be wrapping all primitive `Item` children in a `Text` element to
  // ensure proper layout. Since `Item` components require a `textValue` prop
  // if they don't contain exactly 1 `string` child, this will trigger a11y
  // warnings. We can set a default `textValue` prop in cases where the
  // original had a single primitive child.
  if (isItemElement) {
    if (!('textValue' in newProps) && isPrimitive(newProps.children)) {
      newProps.textValue = String(newProps.children);
    }

    if (!('key' in newProps)) {
      newProps.key = newProps.textValue;
    }
  }

  // Derive child keys based on type + index of the occurrence of the type
  const typeMap = new Map<string, number>();
  const getChildKey = (type: string | null | undefined): string => {
    const typeCount = typeMap.get(String(type)) ?? 0;
    typeMap.set(String(type), typeCount + 1);
    return `${type}-${typeCount}`;
  };

  const children = Array.isArray(newProps.children)
    ? newProps.children
    : [newProps.children];

  const wrappedChildren = children.map(child => {
    // Exported objects need to be converted to `ObjectView` to be rendered
    if (isExportedObject(child)) {
      return <ObjectView key={getChildKey(child.type)} object={child} />;
    }

    // Auto wrap primitive children of `Item` elements in `Text` elements
    if (isItemElement && isPrimitive(child)) {
      return <Text key={String(child)}>{String(child)}</Text>;
    }

    return child;
  });

  // Keep the children as an array or single item based on the original value
  newProps.children = Array.isArray(newProps.children)
    ? wrappedChildren
    : wrappedChildren[0];

  return {
    ...element,
    props: newProps,
  };
}
