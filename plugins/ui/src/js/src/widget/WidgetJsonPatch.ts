import { Operation, applyOperation } from 'fast-json-patch';

/**
 * Applies a JSON patch to a document. Performs a shallow copy on all objects and arrays along the path of the patch. Leaves other parts of the document unchanged.
 *
 * @param document The original document to apply the JSON patch to.
 * @param patch The JSON patch operations to apply.
 * @returns The modified document after applying the JSON patch.
 */
export function applyJsonPatch(document: object, patch: Operation[]): object {
  const shallowCopyDocument = { ...document };
  patch.forEach(operation => {
    shallowCopyPath(shallowCopyDocument, operation.path);
    if (operation.op === 'move') {
      shallowCopyPath(shallowCopyDocument, operation.from);
    }
    applyOperation(shallowCopyDocument, operation, false, true);
  });
  return shallowCopyDocument;
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

export default applyJsonPatch;
