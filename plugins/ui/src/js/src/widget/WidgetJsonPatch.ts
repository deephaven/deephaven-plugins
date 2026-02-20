import { CopyOperation } from '@deephaven/iris-grid/dist/IrisGridCopyHandler';
import {
  AddOperation,
  MoveOperation,
  Operation,
  RemoveOperation,
  ReplaceOperation,
  TestOperation,
} from 'fast-json-patch';

/**
 * Applies a JSON patch to a document. Performs a shallow copy on all objects and arrays along the path of the patch. Leaves other parts of the document unchanged.
 *
 * @param document The original document to apply the JSON patch to.
 * @param patch The JSON patch operations to apply.
 * @returns The modified document after applying the JSON patch.
 */
export function applyJsonPatch(document: object, patch: Operation[]): object {
  // TODO implement
  return document;
}

/**
 * Performs a shallow copy on all objects and arrays along the specified path in the document.
 *
 * @param document The document to perform the shallow copy on.
 * @param path The JSON pointer path to the property to copy.
 */
function shallowCopyPath(document: object, path: string): void {
  // TODO implement
}

export function applyOperation(document: object, operation: Operation): void {
  // TODO implement
}

export function applyAddOperation<T>(
  document: object,
  operation: AddOperation<T>
): void {
  // TODO implement
}

export function applyRemoveOperation(
  document: object,
  operation: RemoveOperation
): void {
  // TODO implement
}

export function applyReplaceOperation<T>(
  document: object,
  operation: ReplaceOperation<T>
): void {
  // TODO implement
}

export function applyCopyOperation(
  document: object,
  operation: CopyOperation
): void {
  // TODO implement
}

export function applyMoveOperation(
  document: object,
  operation: MoveOperation
): void {
  // TODO implement
}

export function applyTestOperation<T>(
  document: object,
  operation: TestOperation<T>
): void {
  // TODO implement
}
