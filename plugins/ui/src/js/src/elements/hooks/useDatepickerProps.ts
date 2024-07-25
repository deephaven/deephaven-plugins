import { useCallback } from 'react';
import {
  CalendarDate,
  CalendarDateTime,
  DateValue,
  ZonedDateTime,
} from '@internationalized/date';
import {
  DeserializedFocusEventCallback,
  SerializedFocusEventCallback,
  useFocusEventCallback,
} from './useFocusEventCallback';
import {
  DeserializedKeyboardEventCallback,
  SerializedKeyboardEventCallback,
  useKeyboardEventCallback,
} from './useKeyboardEventCallback';

type MappedDateValue<T> = T extends ZonedDateTime
  ? ZonedDateTime
  : T extends CalendarDateTime
  ? CalendarDateTime
  : T extends CalendarDate
  ? CalendarDate
  : never;

export type SerializedDateValue = string | null;

export type SerializedDateValueCallback = (value: SerializedDateValue) => void;

export type DeserializedDateValueCallback = (
  value: MappedDateValue<DateValue>
) => void;

export interface SerializedDatePickerEventProps {
  /** Handler that is called when the element receives focus. */
  onFocus?: SerializedFocusEventCallback;

  /** Handler that is called when the element loses focus. */
  onBlur?: SerializedFocusEventCallback;

  /** Handler that is called when a key is pressed */
  onKeyDown?: SerializedKeyboardEventCallback;

  /** Handler that is called when a key is released */
  onKeyUp?: SerializedKeyboardEventCallback;

  /** Handler that is called when the value changes */
  onChange?: SerializedDateValueCallback;
}

export interface DeserializedDatePickerEventProps {
  /** Handler that is called when the element receives focus. */
  onFocus?: DeserializedFocusEventCallback;

  /** Handler that is called when the element loses focus. */
  onBlur?: DeserializedFocusEventCallback;

  /** Handler that is called when a key is pressed */
  onKeyDown?: DeserializedKeyboardEventCallback;

  /** Handler that is called when a key is released */
  onKeyUp?: DeserializedKeyboardEventCallback;

  /** Handler that is called when the value changes */
  onChange?: DeserializedDateValueCallback;
}

export type SerializedDatePickerProps<TProps> = TProps &
  SerializedDatePickerEventProps;

export type DeserializedDatePickerProps<TProps> = Omit<
  TProps,
  keyof SerializedDatePickerEventProps
> &
  DeserializedDatePickerEventProps;

/**
 * Uses the toString representiation of the DateValue as the serialized value.
 * @param value DateValue to serialize
 * @returns Serialized DateValue
 */
export function serializeDateValue(
  value: MappedDateValue<DateValue>
): SerializedDateValue {
  if (value == null) {
    return null;
  }

  return value.toString();
}

/**
 * Get a callback function that can be passed to the onChange event handler
 * props of a Spectrum DatePicker.
 * @param callback Callback to be called with the serialized value
 * @returns A callback to be passed into the Spectrum component that transforms
 * the value and calls the provided callback
 */
export function useOnChangeCallback(
  callback?: SerializedDateValueCallback
): (value: MappedDateValue<DateValue>) => void {
  return useCallback(
    (value: MappedDateValue<DateValue>) => {
      callback?.(serializeDateValue(value));
    },
    [callback]
  );
}

/**
 * Wrap DatePicker props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useDatePickerProps<TProps>({
  onFocus,
  onBlur,
  onKeyDown,
  onKeyUp,
  onChange: serializedOnChange,
  ...otherProps
}: SerializedDatePickerProps<TProps>): DeserializedDatePickerProps<TProps> {
  const serializedOnFocus = useFocusEventCallback(onFocus);
  const serializedOnBlur = useFocusEventCallback(onBlur);
  const serializedOnKeyDown = useKeyboardEventCallback(onKeyDown);
  const serializedOnKeyUp = useKeyboardEventCallback(onKeyUp);
  const onChange = useOnChangeCallback(serializedOnChange);

  return {
    onFocus: serializedOnFocus,
    onBlur: serializedOnBlur,
    onKeyDown: serializedOnKeyDown,
    onKeyUp: serializedOnKeyUp,
    onChange: serializedOnChange == null ? undefined : onChange,
    ...otherProps,
  };
}
