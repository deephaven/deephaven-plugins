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
export function shallowCopyPath(document: object, path: string): void {
  if (path === '' || path === '/') return;

  // Parse the pointer path - split by '/' and handle RFC 6901 escaping
  const parts = path
    .split('/')
    .slice(1) // Remove the first empty part from leading '/'
    .map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = document;

  // Walk down the path, shallow copying each object/array
  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    const value = current[part];

    // If the value is an object or array, shallow copy it
    if (value != null && typeof value === 'object') {
      if (Array.isArray(value)) {
        current[part] = [...value];
      } else {
        current[part] = { ...value };
      }
    }

    // Move to the next level
    current = current[part];

    // If current is null or undefined, stop
    if (current == null) break;
  }
}

export default applyJsonPatch;
