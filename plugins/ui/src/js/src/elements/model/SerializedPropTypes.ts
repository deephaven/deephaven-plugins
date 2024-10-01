import React from 'react';
import { SerializedFocusEventCallback } from '../hooks/useFocusEventCallback';
import { SerializedKeyboardEventCallback } from '../hooks/useKeyboardEventCallback';
import { SerializedPressEventCallback } from '../hooks/usePressEventCallback';

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

export type SerializedInputElementProps<T> = Omit<
  T,
  'defaultValue' | 'value' | 'onChange'
> & {
  /** The default value of the input */
  defaultValue?: string;

  /** The value of the input */
  value?: string;

  /** Handler that is called when the input value changes */
  onChange?: (value: string) => Promise<void>;
};

export type SerializedButtonEventProps<T> = SerializedFocusEventProps<
  SerializedKeyboardEventProps<SerializedPressEventProps<T>>
> & { children: React.ReactNode };

export type SerializedTextInputEventProps<T> = SerializedFocusEventProps<
  SerializedKeyboardEventProps<SerializedInputElementProps<T>>
>;
