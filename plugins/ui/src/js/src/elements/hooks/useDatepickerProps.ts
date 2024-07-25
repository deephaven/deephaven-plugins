import { useCallback, useMemo } from 'react';
import {
  DateValue,
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  parseDate,
  parseDateTime,
  parseZonedDateTime,
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

export interface SerializedDatePickerPropsInterface {
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

  /** The current value (controlled) */
  value?: string | null;

  /** The default value (uncontrolled) */
  defaultValue?: string | null;

  /** The minimum allowed date that a user may select */
  minValue?: string;

  /** The maximum allowed date that a user may select */
  maxValue?: string;

  /** A placeholder date that influences the format of the placeholder shown when no value is selected */
  placeholderValue?: string;

  /** Dates that are unavailable */
  unavailableValues?: string[] | null;
}

export interface DeserializedDatePickerPropsInterface {
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

  /** The current value (controlled) */
  value?: DateValue | null;

  /** The default value (uncontrolled) */
  defaultValue?: DateValue | null;

  /** The minimum allowed date that a user may select */
  minValue?: DateValue | null;

  /** The maximum allowed date that a user may select */
  maxValue?: DateValue | null;

  /** A placeholder date that influences the format of the placeholder shown when no value is selected */
  placeholderValue?: DateValue | null;

  /** Callback that is called for each date of the calendar. If it returns true, then the date is unavailable */
  isDateUnavailable?: (date: DateValue) => boolean;
}

export type SerializedDatePickerProps<TProps> = TProps &
  SerializedDatePickerPropsInterface;

export type DeserializedDatePickerProps<TProps> = Omit<
  TProps,
  keyof SerializedDatePickerPropsInterface
> &
  DeserializedDatePickerPropsInterface;

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
      if (callback == null) {
        return;
      }
      callback(serializeDateValue(value));
    },
    [callback]
  );
}

/**
 * Use memo to get a DateValue from a string.
 *
 * @param value the string date value
 * @returns DateValue or null
 */
export function useDateValueMemo(
  value?: string | null
): DateValue | null | undefined {
  return useMemo(() => parseDateValue(value), [value]);
}

/**
 * Parses a date value string into a DateValue.
 *
 * @param value the string date value
 * @returns DateValue or null
 */
export function parseDateValue(
  value?: string | null
): DateValue | null | undefined {
  if (value == null) {
    return value;
  }

  // Try to parse and ISO 8601 date string, e.g. "2021-02-03"
  try {
    return parseDate(value);
  } catch (ignore) {
    // ignore
  }

  // Try to parse an ISO 8601 date time string, e.g. "2021-03-03T04:05:06"
  try {
    return parseDateTime(value);
  } catch (ignore) {
    // ignore
  }

  // Try to parse an ISO 8601 zoned date time string, e.g. "2021-04-04T05:06:07[America/New_York]"
  try {
    return parseZonedDateTime(value);
  } catch (ignore) {
    // ignore
  }

  // Try to parse a non-ISO 8601 zoned date time string, e.g. "2021-04-04T05:06:07 America/New_York"
  const parts = value.split(' ');
  if (parts.length === 2) {
    const isoString = `${parts[0]}[${parts[1]}]`;
    try {
      return parseZonedDateTime(isoString);
    } catch (ignore) {
      // ignore
    }
  }

  throw new Error(`Invalid date value string: ${value}`);
}

/**
 * Get a callback function that can be passed to the isDateUnavailable prop of a Spectrum DatePicker.
 *
 * @param unavailableSet Set of unavailable date strings
 * @returns A callback to be passed into the Spectrum component that checks if the date is unavailable
 */
export function useIsDateUnavailableCallback(
  unavailableSet: Set<string>
): (date: DateValue) => boolean {
  return useCallback(
    (date: DateValue) => unavailableSet.has(date.toString()),
    [unavailableSet]
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
  value: serializedValue,
  defaultValue: serializedDefaultValue,
  minValue: serializedMinValue,
  maxValue: serializedMaxValue,
  placeholderValue: serializedPlaceholderValue,
  unavailableValues,
  ...otherProps
}: SerializedDatePickerProps<TProps>): DeserializedDatePickerProps<TProps> {
  const serializedOnFocus = useFocusEventCallback(onFocus);
  const serializedOnBlur = useFocusEventCallback(onBlur);
  const serializedOnKeyDown = useKeyboardEventCallback(onKeyDown);
  const serializedOnKeyUp = useKeyboardEventCallback(onKeyUp);
  const onChange = useOnChangeCallback(serializedOnChange);
  const deserializedValue = useDateValueMemo(serializedValue);
  const deserializedDefaultValue = useDateValueMemo(serializedDefaultValue);
  const deserializedMinValue = useDateValueMemo(serializedMinValue);
  const deserializedMaxValue = useDateValueMemo(serializedMaxValue);
  const deserializedPlaceholderValue = useDateValueMemo(
    serializedPlaceholderValue
  );
  const unavailableSet = useMemo(() => {
    if (unavailableValues == null) {
      return new Set<string>();
    }
    return new Set(unavailableValues);
  }, [unavailableValues]);
  const isDateUnavailable = useIsDateUnavailableCallback(unavailableSet);

  return {
    onFocus: serializedOnFocus,
    onBlur: serializedOnBlur,
    onKeyDown: serializedOnKeyDown,
    onKeyUp: serializedOnKeyUp,
    onChange: serializedOnChange == null ? undefined : onChange,
    value: deserializedValue,
    defaultValue: deserializedDefaultValue,
    minValue: deserializedMinValue,
    maxValue: deserializedMaxValue,
    placeholderValue: deserializedPlaceholderValue,
    isDateUnavailable,
    ...otherProps,
  };
}
