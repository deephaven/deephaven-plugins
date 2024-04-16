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

/**
 * Wrap Picker props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function usePickerProps<T>(
  props: SerializedPickerEventProps & T
): T & SerializedPickerEventProps {
  const { onFocus, onBlur, onKeyDown, onKeyUp, ...otherProps } = props;

  const serializedOnFocus = useFocusEventCallback(onFocus);
  const serializedOnBlur = useFocusEventCallback(onBlur);
  const serializedOnKeyDown = useKeyboardEventCallback(onKeyDown);
  const serializedOnKeyUp = useKeyboardEventCallback(onKeyUp);

  return {
    onFocus: serializedOnFocus,
    onBlur: serializedOnBlur,
    onKeyDown: serializedOnKeyDown,
    onKeyUp: serializedOnKeyUp,
    ...otherProps,
  } as T & SerializedPickerEventProps;
}
