import { useCallback, Key } from 'react';

export type Selection = 'all' | Set<Key>;

type SerializedSelection = 'all' | [Key];

type SerializedOnSelectionChangeCallback = (keys: SerializedSelection) => void;

type DeserializedOnSelectionChangeCallback = (keys: Selection) => void;

export interface SerializedMenuEventProps {
  onSelectionChange?: SerializedOnSelectionChangeCallback;
}

export interface DeserializedMenuEventProps {
  onSelectionChange?: DeserializedOnSelectionChangeCallback;
}

export type SerializedMenuProps<TProps> = TProps & SerializedMenuEventProps;

export type DeserializedMenuProps<TProps> = Omit<
  TProps,
  keyof SerializedMenuEventProps
> &
  DeserializedMenuEventProps;

/**
 * Get a callback function that can be passed to the onSelectionChange event handler
 * props of a Spectrum Menu component.
 * @param callback Callback to be called with the serialized value
 * @returns A callback to be passed into the Spectrum component that transforms
 * the value and calls the provided callback
 */
export function useOnSelectionChange(
  callback?: SerializedOnSelectionChangeCallback
): DeserializedOnSelectionChangeCallback {
  return useCallback(
    (value: Selection) => {
      if (callback == null) {
        return;
      }
      if (value === 'all') {
        callback(value);
        return;
      }
      // TODO fix this
      callback([...value] as SerializedSelection);
    },
    [callback]
  );
}

/**
 * Wrap Menu props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useMenuProps<TProps>({
  onSelectionChange,
  ...otherProps
}: SerializedMenuProps<TProps>): DeserializedMenuProps<TProps> {
  const serializedOnSelectionChange = useOnSelectionChange(onSelectionChange);

  return {
    onSelectionChange: serializedOnSelectionChange,
    ...otherProps,
  };
}
