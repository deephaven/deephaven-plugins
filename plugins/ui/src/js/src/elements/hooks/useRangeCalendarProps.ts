import { useCallback, useMemo } from 'react';
import { CalendarDate, DateValue } from '@internationalized/date';
import {
  SerializedDateValueCallback,
  DeserializedDateValueCallback, // TODO does onChange take range?
  useOnChangeDateCallback,
} from './useDateComponentProps';
import {
  parseCalendarValue,
  parseNullableCalendarValue,
} from '../utils/DateTimeUtils';
import { DeserializedCalendarCallback } from './useCalendarProps';
import {
  RangeValue,
  SerializedDateRangeValueCallback,
  DeserializedDateRangeValueCallback,
} from './useDateRangePickerProps';

export interface SerializedRangeCalendarPropsInterface {
  /** Handler that is called when the value changes */
  onChange?: SerializedDateRangeValueCallback;

  /** Handler that is called when the focused date changes. */
  onFocusChange?: SerializedDateValueCallback;

  /** The current value (controlled) */
  value?: RangeValue<string> | null;

  /** The default value (uncontrolled) */
  defaultValue?: RangeValue<string> | null;

  /** The minimum allowed date that a user may select */
  minValue?: string;

  /** The maximum allowed date that a user may select */
  maxValue?: string;

  /** Controls the currently focused date within the calendar. */
  focusedValue?: string;

  /** The date that is focused when the calendar first mounts (uncountrolled). */
  defaultFocusedValue?: string;
}

export interface DeserializedRangeCalendarPropsInterface {
  /** Handler that is called when the value changes */
  onChange?: DeserializedDateRangeValueCallback;

  /** Handler that is called when the focused date changes. */
  onFocusChange?: DeserializedCalendarCallback;

  /** The current value (controlled) */
  value?: RangeValue<DateValue> | null;

  /** The default value (uncontrolled) */
  defaultValue?: RangeValue<DateValue> | null;

  /** The minimum allowed date that a user may select */
  minValue?: DateValue;

  /** The maximum allowed date that a user may select */
  maxValue?: DateValue;

  /** Controls the currently focused date within the calendar. */
  focusedValue?: DateValue;

  /** The date that is focused when the calendar first mounts (uncountrolled). */
  defaultFocusedValue?: DateValue;
}

export type SerializedRangeCalendarProps<TProps> = TProps &
  SerializedRangeCalendarPropsInterface;

export type DeserializedRangeCalendarProps<TProps> = Omit<
  TProps,
  keyof SerializedRangeCalendarPropsInterface
> &
  DeserializedRangeCalendarPropsInterface;

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
 * Use memo to get a Calendar DateValue from a string.
 *
 * @param value the string date value
 * @returns DateValue
 */
export default function useCalendarValueMemo(
  value?: string
): DateValue | undefined {
  return useMemo(() => parseCalendarValue(value), [value]);
}

/**
 * Use memo to get a Calendar DateValue from a nullable string.
 *
 * @param value the string date value
 * @returns DateValue or null
 */
export function useNullableCalendarValueMemo(
  value?: string | null
): DateValue | null | undefined {
  return useMemo(() => parseNullableCalendarValue(value), [value]);
}

/**
 * Wrap Date component props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useRangeCalendarProps<TProps>({
  onChange: serializedOnChange,
  onFocusChange: serializedOnFocusChange,
  value: serializedValue,
  defaultValue: serializedDefaultValue,
  minValue: serializedMinValue,
  maxValue: serializedMaxValue,
  focusedValue: serializedFocusedValue,
  defaultFocusedValue: serializedDefaultFocusedValue,
  ...otherProps
}: SerializedRangeCalendarProps<TProps>): DeserializedRangeCalendarProps<TProps> {
  const onChange = useOnChangeDateCallback(serializedOnChange);
  const onFocusChange = useOnFocusedChangeCallback(serializedOnFocusChange);
  const deserializedValue = useNullableCalendarValueMemo(serializedValue);
  const deserializedDefaultValue = useNullableCalendarValueMemo(
    serializedDefaultValue
  );
  const deserializedMinValue = useCalendarValueMemo(serializedMinValue);
  const deserializedMaxValue = useCalendarValueMemo(serializedMaxValue);
  const deserializedFocusedValue = useCalendarValueMemo(serializedFocusedValue);
  const deserializedDefaultFocusedValue = useCalendarValueMemo(
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
