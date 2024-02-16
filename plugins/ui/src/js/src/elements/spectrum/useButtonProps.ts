import {
  SerializedPressEventCallback,
  usePressEventCallback,
} from './usePressEventCallback';
import {
  SerializedFocusEventCallback,
  useFocusEventCallback,
} from './useFocusEventCallback';
import {
  SerializedKeyboardEventCallback,
  useKeyboardEventCallback,
} from './useKeyboardEventCallback';
import { mapSpectrumProps } from './mapSpectrumProps';

export type SerializedButtonEventProps = {
  /** Handler that is called when the press is released over the target. */
  onPress?: SerializedPressEventCallback;

  /** Handler that is called when a press interaction starts. */
  onPressStart?: SerializedPressEventCallback;
  /**
   * Handler that is called when a press interaction ends, either
   * over the target or when the pointer leaves the target.
   */
  onPressEnd?: SerializedPressEventCallback;

  /**
   * Handler that is called when a press is released over the target, regardless of
   * whether it started on the target or not.
   */
  onPressUp?: SerializedPressEventCallback;

  /** Handler that is called when the element receives focus. */
  onFocus?: SerializedFocusEventCallback;

  /** Handler that is called when the element loses focus. */
  onBlur?: SerializedFocusEventCallback;

  /** Handler that is called when a key is pressed */
  onKeyDown?: SerializedKeyboardEventCallback;

  /** Handler that is called when a key is released */
  onKeyUp?: SerializedKeyboardEventCallback;
};

export function useButtonProps<T>(props: SerializedButtonEventProps & T) {
  const {
    onPress: propOnPress,
    onPressStart: propsOnPressStart,
    onPressEnd: propsOnPressEnd,
    onPressUp: propsOnPressUp,
    onFocus: propOnFocus,
    onBlur: propOnBlur,
    onKeyDown: propOnKeyDown,
    onKeyUp: propOnKeyUp,
    ...otherProps
  } = props;

  const onPress = usePressEventCallback(propOnPress);
  const onPressStart = usePressEventCallback(propsOnPressStart);
  const onPressEnd = usePressEventCallback(propsOnPressEnd);
  const onPressUp = usePressEventCallback(propsOnPressUp);
  const onFocus = useFocusEventCallback(propOnFocus);
  const onBlur = useFocusEventCallback(propOnBlur);
  const onKeyDown = useKeyboardEventCallback(propOnKeyDown);
  const onKeyUp = useKeyboardEventCallback(propOnKeyUp);

  return {
    onPress,
    onPressStart,
    onPressEnd,
    onPressUp,
    onFocus,
    onBlur,
    onKeyDown,
    onKeyUp,
    ...mapSpectrumProps(otherProps),
  };
}
