import type { dh } from '@deephaven/jsapi-types';
import {
  REFERENCE_KEY,
  type ReferenceNode,
} from '../elements/utils/ElementUtils';

/** An object on the server that can be sent along with a message. */
export type ServerReference = NonNullable<
  Parameters<dh.Widget['sendMessage']>[1]
>[number];

// `Symbol.for`, so a wrapper made by another bundled copy of this module is still recognized.
const REFERENCE_BRAND = Symbol.for('@deephaven/js-plugin-ui/reference');

/** A server object marked to be sent by reference instead of being serialized. */
export type ByReference<T extends ServerReference = ServerReference> = {
  [REFERENCE_BRAND]: T;
};

function isByReference(value: unknown): value is ByReference {
  return value != null && typeof value === 'object' && REFERENCE_BRAND in value;
}

/**
 * Mark a server object to be sent to the server as a reference when it is passed
 * to a callable or otherwise sent in a request. The server receives the object
 * itself where the value was, at any depth.
 * @param value The server object to send by reference
 * @returns The value wrapped so `stringifyWithReferences` sends it by reference
 */
export function byReference<T extends ServerReference>(
  value: T
): ByReference<T> {
  return { [REFERENCE_BRAND]: value };
}

/**
 * Serialize a value to JSON, replacing every `byReference` value with a marker.
 * The marked objects are returned in the order first seen, and the same object
 * always maps to the same marker. Send both with `widget.sendMessage`.
 * @param value The value to serialize
 * @returns The JSON payload and the references the markers point into
 */
export function stringifyWithReferences(value: unknown): {
  payload: string;
  references: ServerReference[];
} {
  const references: ServerReference[] = [];
  const indexes = new Map<ServerReference, number>();
  const payload = JSON.stringify(value, (_, child) => {
    if (!isByReference(child)) {
      return child;
    }
    const target = child[REFERENCE_BRAND];
    let index = indexes.get(target);
    if (index === undefined) {
      index = references.length;
      references.push(target);
      indexes.set(target, index);
    }
    const marker: ReferenceNode = { [REFERENCE_KEY]: index };
    return marker;
  });
  return { payload, references };
}
