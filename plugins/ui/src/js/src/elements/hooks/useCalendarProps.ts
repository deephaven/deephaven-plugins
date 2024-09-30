import { useCallback } from 'react';
import { CalendarDate, DateValue } from '@internationalized/date';
import useDateValueMemo from './useDateValueMemo';
import {
  SerializedDateValueCallback,
  DeserializedDateValueCallback,
  useOnChangeDateCallback,
  useNullableDateValueMemo,
} from './useDateComponentProps';

export type DeserializedCalendarCallback =
  | (() => void)
  | ((value: CalendarDate) => Promise<void>);

export interface SerializedCalendarPropsInterface {
  /** Handler that is called when the value changes */
  onChange?: SerializedDateValueCallback;

  /** Handler that is called when the focused date changes. */
  onFocusChange?: SerializedDateValueCallback;

  /** The current value (controlled) */
  value?: string | null;

  /** The default value (uncontrolled) */
  defaultValue?: string | null;

  /** The minimum allowed date that a user may select */
  minValue?: string;

  /** The maximum allowed date that a user may select */
  maxValue?: string;

  /** Controls the currently focused date within the calendar. */
  focusedValue?: string;

  /** The date that is focused when the calendar first mounts (uncountrolled). */
  defaultFocusedValue?: string;
}

export interface DeserializedCalendarPropsInterface {
  /** Handler that is called when the value changes */
  onChange?: DeserializedDateValueCallback;

  /** Handler that is called when the focused date changes. */
  onFocusChange?: DeserializedCalendarCallback;

  /** The current value (controlled) */
  value?: DateValue | null;

  /** The default value (uncontrolled) */
  defaultValue?: DateValue | null;

  /** The minimum allowed date that a user may select */
  minValue?: DateValue;

  /** The maximum allowed date that a user may select */
  maxValue?: DateValue;

  /** Controls the currently focused date within the calendar. */
  focusedValue?: DateValue;

  /** The date that is focused when the calendar first mounts (uncountrolled). */
  defaultFocusedValue?: DateValue;
}

export type SerializedCalendarProps<TProps> = TProps &
  SerializedCalendarPropsInterface;

export type DeserializedCalendarProps<TProps> = Omit<
  TProps,
  keyof SerializedCalendarPropsInterface
> &
  DeserializedCalendarPropsInterface;

/**
 * Get a callback function that can be passed to the onChange event handler
 * props of a Spectrum Date component.
 * @param callback Callback to be called with the serialized value
 * @returns A callback to be passed into the Spectrum component that transforms
 * the value and calls the provided callback
 */
export function useOnFocusedChangeCallback(
  callback?: SerializedDateValueCallback
): DeserializedCalendarCallback {
  return useCallback(
    (value?: CalendarDate) => {
      if (callback == null) {
        return;
      }
      callback(value == null ? null : value.toString());
    },
    [callback]
  );
}

/**
 * Wrap Date component props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useCalendarProps<TProps>(
  {
    onChange: serializedOnChange,
    onFocusChange: serializedOnFocusChange,
    value: serializedValue,
    defaultValue: serializedDefaultValue,
    minValue: serializedMinValue,
    maxValue: serializedMaxValue,
    focusedValue: serializedFocusedValue,
    defaultFocusedValue: serializedDefaultFocusedValue,
    ...otherProps
  }: SerializedCalendarProps<TProps>,
  timeZone: string
): DeserializedCalendarProps<TProps> {
  const onChange = useOnChangeDateCallback(serializedOnChange);
  const onFocusChange = useOnFocusedChangeCallback(serializedOnFocusChange);
  const deserializedValue = useNullableDateValueMemo(timeZone, serializedValue);
  const deserializedDefaultValue = useNullableDateValueMemo(
    timeZone,
    serializedDefaultValue
  );
  const deserializedMinValue = useDateValueMemo(timeZone, serializedMinValue);
  const deserializedMaxValue = useDateValueMemo(timeZone, serializedMaxValue);
  const deserializedFocusedValue = useDateValueMemo(
    timeZone,
    serializedFocusedValue
  );
  const deserializedDefaultFocusedValue = useDateValueMemo(
    timeZone,
    serializedDefaultFocusedValue
  );

  return {
    onChange: serializedOnChange == null ? undefined : onChange,
    onFocusChange: serializedOnFocusChange == null ? undefined : onFocusChange,
    value: deserializedValue,
    defaultValue: deserializedDefaultValue,
    minValue: deserializedMinValue,
    maxValue: deserializedMaxValue,
    focusedValue: deserializedFocusedValue,
    defaultFocusedValue: deserializedDefaultFocusedValue,
    ...otherProps,
  };
}
