import type { ItemKey, ItemSelection } from '@deephaven/components';
import { useCallback } from 'react';

export type SerializedSelection = 'all' | ItemKey[];

export type SerializedSelectionEventCallback = (
  event: SerializedSelection
) => void;

/**
 * Selection can be 'all' or a Set of keys. If it is a Set, serialize it as an
 * array.
 * @param selection Selection to serialize
 * @returns Serialized selection
 */
export function serializeSelectionEvent(
  selection: ItemSelection
): SerializedSelection {
  if (selection instanceof Set) {
    return [...selection];
  }

  return selection;
}

/**
 * Get a callback function that can be passed to selection change event handler
 * props of Spectrum components.
 * @param callback Callback to be called with the serialized selection
 * @returns A callback to be passed into the Spectrum component that transforms
 * the selection and calls the provided callback
 */
export function useSelectionEventCallback(
  callback?: SerializedSelectionEventCallback
) {
  return useCallback(
    (selection: ItemSelection) => {
      callback?.(serializeSelectionEvent(selection));
    },
    [callback]
  );
}
