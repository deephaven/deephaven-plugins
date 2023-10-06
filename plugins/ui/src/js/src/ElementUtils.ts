export const CALLABLE_KEY = '__dh_cbid';
export const OBJECT_KEY = '__dh_obid';
export const ELEMENT_KEY = '__dh_elem';

export type CallableNode = {
  /** The name of the callable to call */
  [CALLABLE_KEY]: string;
};

export type ObjectNode = {
  /** The index of the object in the exported objects array */
  [OBJECT_KEY]: number;
};

export type ElementNode = {
  [ELEMENT_KEY]: string;
  props?: { [key: string]: unknown };
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

export function isExportedObject(obj: unknown): obj is ExportedObject {
  return (
    obj != null &&
    typeof obj === 'object' &&
    typeof (obj as ExportedObject).fetch === 'function' &&
    typeof (obj as ExportedObject).type === 'string'
  );
}

export type ExportedObject<T = unknown> = {
  fetch(): Promise<T>;
  type: string;
};

/**
 * Create a key for an element.
 * @param child Child element
 * @param itemTypeCount Map of item types to counts. Will update the map with this type.
 * @returns A key that can be used for rendering an item.
 */
export function makeElementKey(
  child: unknown,
  itemTypeCount: Map<string, number>
): string {
  const type = isElementNode(child) ? child[ELEMENT_KEY] : 'unknown';
  const currentCount = itemTypeCount.get(type) ?? 0;
  itemTypeCount.set(type, currentCount + 1);
  return `${type}-${currentCount}`;
}
