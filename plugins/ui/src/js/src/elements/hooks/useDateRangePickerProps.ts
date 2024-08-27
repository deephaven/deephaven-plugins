import { useCallback, useMemo } from 'react';
import {
  DateValue,
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  parseDate,
  parseDateTime,
  parseZonedDateTime,
  toTimeZone,
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

export interface RangeValue<T> {
  start: T;
  end: T;
}

type MappedDateValue<T> = T extends ZonedDateTime
  ? ZonedDateTime
  : T extends CalendarDateTime
  ? CalendarDateTime
  : T extends CalendarDate
  ? CalendarDate
  : never;

type Granularity = 'day' | 'hour' | 'minute' | 'second';

export type SerializedDateRangeValue = RangeValue<string> | null;

export type SerializedDateRangeValueCallback = (
  value: SerializedDateRangeValue
) => void;

export type DeserializedDateRangeValueCallback = (
  value: RangeValue<MappedDateValue<DateValue>>
) => void;

export interface SerializedDateRangePickerPropsInterface {
  /** Handler that is called when the element receives focus. */
  onFocus?: SerializedFocusEventCallback;

  /** Handler that is called when the element loses focus. */
  onBlur?: SerializedFocusEventCallback;

  /** Handler that is called when a key is pressed */
  onKeyDown?: SerializedKeyboardEventCallback;

  /** Handler that is called when a key is released */
  onKeyUp?: SerializedKeyboardEventCallback;

  /** Handler that is called when the value changes */
  onChange?: SerializedDateRangeValueCallback;

  /** The current value (controlled) */
  value?: RangeValue<string> | null;

  /** The default value (uncontrolled) */
  defaultValue?: RangeValue<string> | null;

  /** The minimum allowed date that a user may select */
  minValue?: string;

  /** The maximum allowed date that a user may select */
  maxValue?: string;

  /** A placeholder date that influences the format of the placeholder shown when no value is selected */
  placeholderValue?: string;

  /** Dates that are unavailable */
  unavailableValues?: string[] | null;

  /** Determines the smallest unit that is displayed in the date picker. */
  granularity?: Granularity;
}

export interface DeserializedDateRangePickerPropsInterface {
  /** Handler that is called when the element receives focus. */
  onFocus?: DeserializedFocusEventCallback;

  /** Handler that is called when the element loses focus. */
  onBlur?: DeserializedFocusEventCallback;

  /** Handler that is called when a key is pressed */
  onKeyDown?: DeserializedKeyboardEventCallback;

  /** Handler that is called when a key is released */
  onKeyUp?: DeserializedKeyboardEventCallback;

  /** Handler that is called when the value changes */
  onChange?: DeserializedDateRangeValueCallback;

  /** The current value (controlled) */
  value?: RangeValue<DateValue> | null;

  /** The default value (uncontrolled) */
  defaultValue?: RangeValue<DateValue> | null;

  /** The minimum allowed date that a user may select */
  minValue?: DateValue;

  /** The maximum allowed date that a user may select */
  maxValue?: DateValue;

  /** A placeholder date that influences the format of the placeholder shown when no value is selected */
  placeholderValue?: DateValue;

  /** Callback that is called for each date of the calendar. If it returns true, then the date is unavailable */
  isDateUnavailable?: (date: DateValue) => boolean;

  /** Determines the smallest unit that is displayed in the date picker. */
  granularity?: Granularity;
}

export type SerializedDateRangePickerProps<TProps> = TProps &
  SerializedDateRangePickerPropsInterface;

export type DeserializedDateRangePickerProps<TProps> = Omit<
  TProps,
  keyof SerializedDateRangePickerPropsInterface
> &
  DeserializedDateRangePickerPropsInterface;

/**
 * Uses the toString representation of the DateValue as the serialized value.
 * @param value RangeValue Date to serialize
 * @returns Serialized RangeValue Date
 */
export function serializeDateValue(
  value: RangeValue<MappedDateValue<DateValue>>
): RangeValue<string> | null {
  if (value == null) {
    return null;
  }

  const start = value.start.toString();
  const end = value.end.toString();

  return { start, end };
}

/**
 * Get a callback function that can be passed to the onChange event handler
 * props of a Spectrum DateRangePicker.
 * @param callback Callback to be called with the serialized value
 * @returns A callback to be passed into the Spectrum component that transforms
 * the value and calls the provided callback
 */
export function useOnChangeCallback(
  callback?: SerializedDateRangeValueCallback
): (value: RangeValue<MappedDateValue<DateValue>>) => void {
  return useCallback(
    (value: RangeValue<MappedDateValue<DateValue>>) => {
      if (callback == null) {
        return;
      }
      callback(serializeDateValue(value));
    },
    [callback]
  );
}

/**
 * Use memo to get a RangeValue Date from a nullable string.
 *
 * @param value the RangeValue string date value
 * @returns RangeValue Date or null
 */
export function useDateRangeValueMemo(
  timeZone: string,
  value?: RangeValue<string> | null
): RangeValue<DateValue> | null | undefined {
  return useMemo(
    () => parseNullableDateValue(timeZone, value),
    [timeZone, value]
  );
}

export function parseNullableDateValue(
  timeZone: string,
  value?: RangeValue<string> | null
): RangeValue<DateValue> | null | undefined {
  if (value == null) {
    return value;
  }

  const start = parseDateValue(timeZone, value.start);
  const end = parseDateValue(timeZone, value.end);

  if (start === undefined || end === undefined) {
    return undefined;
  }

  return { start, end };
}

/**
 * Use memo to get a DateValue from a string.
 *
 * @param value the string date value
 * @returns DateValue
 */
export function useDateValueMemo(
  timeZone: string,
  value?: string
): DateValue | undefined {
  return useMemo(() => parseDateValue(timeZone, value), [timeZone, value]);
}

/**
 * Parses a date value string into a DateValue.
 *
 * @param value the string date value
 * @returns DateValue
 */
export function parseDateValue(
  timeZone: string,
  value?: string
): DateValue | undefined {
  if (value === undefined) {
    return value;
  }

  // Try to parse and ISO 8601 date string, e.g. "2021-02-03"
  try {
    return parseDate(value);
  } catch (ignore) {
    // ignore
  }

  // Note that the Python API will never send a string like this. This is here for correctness.
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

  // This is an edge case. The Python API will parse these to an Instant,
  // but the user may explicitly create a ZonedDateTime with a UTC offset.
  // Try to parse an ZonedDateTime "2021-04-04T05:06:07Z[UTC]"
  if (value.endsWith('Z[UTC]')) {
    try {
      return parseZonedDateTime(value.replace('Z', ''));
    } catch (ignore) {
      // ignore
    }
  }

  // Try to parse an Instant "2021-04-04T05:06:07Z"
  if (value.endsWith('Z')) {
    try {
      return toTimeZone(
        parseZonedDateTime(`${value.slice(0, -1)}[UTC]`),
        timeZone
      );
    } catch (ignore) {
      // ignore
    }
  }

  throw new Error(`Invalid date value string: ${value}`);
}

/**
 * Get a callback function that can be passed to the isDateUnavailable prop of a Spectrum DateRangePicker.
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
 * Wrap DateRangePicker props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useDateRangePickerProps<TProps>(
  {
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
    granularity: upperCaseGranularity,
    ...otherProps
  }: SerializedDateRangePickerProps<TProps>,
  timeZone: string
): DeserializedDateRangePickerProps<TProps> {
  const serializedOnFocus = useFocusEventCallback(onFocus);
  const serializedOnBlur = useFocusEventCallback(onBlur);
  const serializedOnKeyDown = useKeyboardEventCallback(onKeyDown);
  const serializedOnKeyUp = useKeyboardEventCallback(onKeyUp);
  const onChange = useOnChangeCallback(serializedOnChange);
  const deserializedValue = useDateRangeValueMemo(timeZone, serializedValue);
  const deserializedDefaultValue = useDateRangeValueMemo(
    timeZone,
    serializedDefaultValue
  );
  const deserializedMinValue = useDateValueMemo(timeZone, serializedMinValue);
  const deserializedMaxValue = useDateValueMemo(timeZone, serializedMaxValue);
  const deserializedPlaceholderValue = useDateValueMemo(
    timeZone,
    serializedPlaceholderValue
  );
  // TODO (issue #698) currently unavailableValues is commented out in Python
  // The problem is that the dates need to match down to the second (or millisecond)
  // using this approach. We should restrict them to LocalDate then convert
  // the input to this function to a CalendarDate to check for availability.
  const unavailableSet = useMemo(() => {
    if (unavailableValues == null) {
      return new Set<string>();
    }
    const set = new Set<string>();
    unavailableValues.forEach(value => {
      const valueForTZ = parseDateValue(timeZone, value)?.toString();
      if (valueForTZ != null) {
        set.add(valueForTZ);
      }
    });
    return set;
  }, [unavailableValues, timeZone]);
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
    granularity: upperCaseGranularity?.toLowerCase() as Granularity,
    ...otherProps,
  };
}
