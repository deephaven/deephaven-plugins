export type PrimitiveNode = string | number | boolean;

export type RenderedNode = {
  /** Name of the type of node */
  name: string;
  /** Children of the node */
  children?: RenderedNode[];
  /** Properties of the node */
  props?: { [key: string]: unknown };
};

export type ObjectNode = {
  /** The index of the object in the exported objects array */
  object_id: number;
};

export type ElementNode = RenderedNode | PrimitiveNode;

export function isPrimitiveNode(obj: unknown): obj is PrimitiveNode {
  return (
    typeof obj === 'string' ||
    typeof obj === 'number' ||
    typeof obj === 'boolean'
  );
}

export function isRenderedNode(obj: unknown): obj is RenderedNode {
  return (
    !isPrimitiveNode(obj) &&
    obj !== null &&
    typeof (obj as RenderedNode).name === 'string'
  );
}

export function isObjectNode(obj: unknown): obj is ObjectNode {
  return (
    !isPrimitiveNode(obj) &&
    obj !== null &&
    typeof (obj as ObjectNode).object_id === 'number'
  );
}

export type ExportedObject<T = unknown> = {
  fetch(): Promise<T>;
  type: string;
};

export type UIElement = {
  root: ElementNode;
  objects: ExportedObject[];
};
