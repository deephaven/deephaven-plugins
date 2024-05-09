import { PickerProps as DHPickerProps } from '@deephaven/components';
import { PickerProps as DHPickerJSApiProps } from '@deephaven/jsapi-components';
import { ReactElement } from 'react';
import { ObjectViewProps } from './ObjectView';
import {
  SerializedFocusEventCallback,
  useFocusEventCallback,
} from './spectrum/useFocusEventCallback';
import {
  SerializedKeyboardEventCallback,
  useKeyboardEventCallback,
} from './spectrum/useKeyboardEventCallback';

export interface SerializedPickerEventProps {
  /** Handler that is called when the element receives focus. */
  onFocus?: SerializedFocusEventCallback;

  /** Handler that is called when the element loses focus. */
  onBlur?: SerializedFocusEventCallback;

  /** Handler that is called when a key is pressed */
  onKeyDown?: SerializedKeyboardEventCallback;

  /** Handler that is called when a key is released */
  onKeyUp?: SerializedKeyboardEventCallback;
}

type WrappedDHPickerJSApiProps = Omit<DHPickerJSApiProps, 'table'> & {
  children: ReactElement<ObjectViewProps>;
};

export type SerializedPickerProps = (
  | DHPickerProps
  | WrappedDHPickerJSApiProps
) &
  SerializedPickerEventProps;

/**
 * Wrap Picker props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function usePickerProps({
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  ...otherProps
}: SerializedPickerProps): DHPickerProps | WrappedDHPickerJSApiProps {
  const serializedOnFocus = useFocusEventCallback(onFocus);
  const serializedOnBlur = useFocusEventCallback(onBlur);
  const serializedOnKeyDown = useKeyboardEventCallback(onKeyDown);
  const serializedOnKeyUp = useKeyboardEventCallback(onKeyUp);

  return {
    onFocus: serializedOnFocus,
    onBlur: serializedOnBlur,
    onKeyDown: serializedOnKeyDown,
    onKeyUp: serializedOnKeyUp,
    // The @deephaven/components `Picker` has its own normalization logic that
    // handles primitive children types (string, number, boolean). It also
    // handles nested children inside of `Item` and `Section` components, so
    // we are intentionally not wrapping `otherProps` in `mapSpectrumProps`
    ...otherProps,
  };
}
