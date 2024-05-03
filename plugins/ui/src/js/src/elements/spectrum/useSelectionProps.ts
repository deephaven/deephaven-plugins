import { useCallback } from 'react';
import type { SelectionMode } from '@react-types/shared';
import type { ItemKey, ItemSelection } from '@deephaven/components';

export type SerializedSelection = 'all' | ItemKey[];

export type SerializedSelectionEventCallback = (
  event: SerializedSelection
) => void;

export interface SerializedSelectionProps {
  selectionMode?: SelectionMode | Uppercase<SelectionMode>;

  /** Handler that is called when selection changes */
  onChange?: SerializedSelectionEventCallback;

  /**
   * Handler that is called when the selection changes.
   * @deprecated Use `onChange` instead
   */
  onSelectionChange?: SerializedSelectionEventCallback;
}

export interface SelectionProps {
  selectionMode?: SelectionMode;
  onChange?: (selection: ItemSelection) => void;
  onSelectionChange?: (selection: ItemSelection) => void;
}

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
): (selection: ItemSelection) => void {
  return useCallback(
    (selection: ItemSelection) => {
      callback?.(serializeSelectionEvent(selection));
    },
    [callback]
  );
}

export function useSelectionProps({
  selectionMode,
  onChange,
  onSelectionChange,
}: SerializedSelectionProps): SelectionProps {
  const selectionModeLc = selectionMode?.toLowerCase() as SelectionMode;

  const serializedOnChange = useSelectionEventCallback(onChange);
  const serializedOnSelectionChange =
    useSelectionEventCallback(onSelectionChange);

  return {
    selectionMode: selectionModeLc,
    onChange: onChange == null ? undefined : serializedOnChange,
    onSelectionChange:
      onSelectionChange == null ? undefined : serializedOnSelectionChange,
  };
}
