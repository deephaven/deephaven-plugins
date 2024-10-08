import { useCallback, useMemo } from 'react';
import { CalendarDate, DateValue } from '@internationalized/date';
import { SerializedDateValueCallback } from './useDateComponentProps';
import { parseCalendarValue } from '../utils/DateTimeUtils';
import { DeserializedCalendarCallback } from './useCalendarProps';
import {
  RangeValue,
  SerializedDateRangeValueCallback,
  DeserializedDateRangeValueCallback,
  useOnChangeDateRangeCallback,
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
 * Use memo to get a Range of Calendar DateValue from a nullable string.
 *
 * @param value the string date value
 * @returns Range of DateValue or null
 */
export function useNullableRangeCalendarValueMemo(
  value?: RangeValue<string> | null
): RangeValue<DateValue> | null | undefined {
  return useMemo(() => parseNullableRangeCalendarValue(value), [value]);
}

export function parseNullableRangeCalendarValue(
  value?: RangeValue<string> | null
): RangeValue<DateValue> | null | undefined {
  if (value == null) {
    return value;
  }

  const start = parseCalendarValue(value.start);
  const end = parseCalendarValue(value.end);

  if (start === undefined || end === undefined) {
    return undefined;
  }

  return { start, end };
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
  const onChange = useOnChangeDateRangeCallback(serializedOnChange);
  const onFocusChange = useOnFocusedChangeCallback(serializedOnFocusChange);
  const deserializedValue = useNullableRangeCalendarValueMemo(serializedValue);
  const deserializedDefaultValue = useNullableRangeCalendarValueMemo(
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
