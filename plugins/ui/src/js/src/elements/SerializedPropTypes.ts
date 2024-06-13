import { SerializedFocusEventCallback } from './spectrum/useFocusEventCallback';
import { SerializedKeyboardEventCallback } from './spectrum/useKeyboardEventCallback';
import { SerializedPressEventCallback } from './spectrum/usePressEventCallback';

export type SerializedFocusEventProps<T> = Omit<T, 'onFocus' | 'onBlur'> & {
  /** Handler that is called when the element receives focus. */
  onFocus?: SerializedFocusEventCallback;

  /** Handler that is called when the element loses focus. */
  onBlur?: SerializedFocusEventCallback;
};

export type SerializedKeyboardEventProps<T> = Omit<
  T,
  'onKeyDown' | 'onKeyUp'
> & {
  /** Handler that is called when a key is pressed */
  onKeyDown?: SerializedKeyboardEventCallback;

  /** Handler that is called when a key is released */
  onKeyUp?: SerializedKeyboardEventCallback;
};

export type SerializedPressEventProps<T> = Omit<
  T,
  'onPress' | 'onPressStart' | 'onPressEnd' | 'onPressUp'
> & {
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
};

export type SerializedButtonEventProps<T> = SerializedFocusEventProps<
  SerializedKeyboardEventProps<SerializedPressEventProps<T>>
>;
