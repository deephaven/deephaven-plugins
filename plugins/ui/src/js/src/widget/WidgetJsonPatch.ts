import { Operation } from 'fast-json-patch';

/**
 * Applies a JSON patch to a document. Performs a shallow copy on all objects along the path of the patch. Leaves other parts of the document unchanged.
 *
 * @param document The original document to apply the JSON patch to.
 * @param patch The JSON patch operations to apply.
 * @returns The modified document after applying the JSON patch.
 */
export function applyJsonPatch(document: object, patch: Operation[]): object {
  // TODO implement
  return document;
}

function shallowCopyPath(document: object, path: string): void {
  // TODO implement
}

export function applyOperation(document: object, operation: Operation): void {
  // TODO implement
}

export function applyAddOperation(
  document: object,
  operation: Operation
): void {
  // TODO implement
}

export function applyRemoveOperation(
  document: object,
  operation: Operation
): void {
  // TODO implement
}

export function applyReplaceOperation(
  document: object,
  operation: Operation
): void {
  // TODO implement
}

export function applyCopyOperation(
  document: object,
  operation: Operation
): void {
  // TODO implement
}

export function applyMoveOperation(
  document: object,
  operation: Operation
): void {
  // TODO implement
}

export function applyTestOperation(
  document: object,
  operation: Operation
): boolean {
  // TODO implement
  return false;
}
