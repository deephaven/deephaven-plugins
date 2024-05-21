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

/**
 * Converts serialized selection props to props that can be passed to DHC
 * components.
 * @param selectionMode selection mode (may be uppercase)
 * @param onChange serialized selection change event handler
 * @param onSelectionChange serialized selection change event handler
 * @returns selection props
 */
export function useSelectionProps({
  selectionMode: selectionModeMaybeUppercase,
  onChange: serializedOnChange,
  onSelectionChange: serializedOnSelectionChange,
}: SerializedSelectionProps): SelectionProps {
  const selectionModeLc =
    selectionModeMaybeUppercase?.toLowerCase() as SelectionMode;

  const onChange = useSelectionEventCallback(serializedOnChange);
  const onSelectionChange = useSelectionEventCallback(
    serializedOnSelectionChange
  );

  return {
    selectionMode: selectionModeLc,
    onChange: serializedOnChange == null ? undefined : onChange,
    onSelectionChange:
      serializedOnSelectionChange == null ? undefined : onSelectionChange,
  };
}
