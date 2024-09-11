import { useCallback, useMemo } from 'react';
import { DateValue } from '@internationalized/date';
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
import useDateValueMemo from './useDateValueMemo';
import {
  MappedDateValue,
  Granularity,
  parseDateValue,
  parseNullableDateValue,
} from '../utils/DateTimeUtils';

export type SerializedDateValue = string | null;

export type SerializedDateValueCallback = (value: SerializedDateValue) => void;

export type DeserializedDateValueCallback =
  | (() => void)
  | ((value: MappedDateValue<DateValue> | null) => Promise<void>);

export interface SerializedDateComponentPropsInterface {
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

  /** Determines the smallest unit that is displayed in the date component. */
  granularity?: Granularity;
}

export interface DeserializedDateComponentPropsInterface {
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
  minValue?: DateValue;

  /** The maximum allowed date that a user may select */
  maxValue?: DateValue;

  /** A placeholder date that influences the format of the placeholder shown when no value is selected */
  placeholderValue?: DateValue;

  /** Callback that is called for each date of the calendar. If it returns true, then the date is unavailable */
  isDateUnavailable?: (date: DateValue) => boolean;

  /** Determines the smallest unit that is displayed in the date component. */
  granularity?: Granularity;
}

export type SerializedDateComponentProps<TProps> = TProps &
  SerializedDateComponentPropsInterface;

export type DeserializedDateComponentProps<TProps> = Omit<
  TProps,
  keyof SerializedDateComponentPropsInterface
> &
  DeserializedDateComponentPropsInterface;

/**
 * Uses the toString representation of the DateValue as the serialized value.
 * @param value DateValue to serialize
 * @returns Serialized DateValue
 */
export function serializeDateValue(
  value?: MappedDateValue<DateValue>
): SerializedDateValue {
  if (value == null) {
    return null;
  }

  return value.toString();
}

/**
 * Get a callback function that can be passed to the onChange event handler
 * props of a Spectrum Date component.
 * @param callback Callback to be called with the serialized value
 * @returns A callback to be passed into the Spectrum component that transforms
 * the value and calls the provided callback
 */
export function useOnChangeDateCallback(
  callback?: SerializedDateValueCallback
): DeserializedDateValueCallback {
  return useCallback(
    (value?: MappedDateValue<DateValue>) => {
      if (callback == null) {
        return;
      }
      callback(serializeDateValue(value));
    },
    [callback]
  );
}

/**
 * Use memo to get a DateValue from a nullable string.
 *
 * @param value the string date value
 * @returns DateValue or null
 */
export function useNullableDateValueMemo(
  timeZone: string,
  value?: string | null
): DateValue | null | undefined {
  return useMemo(
    () => parseNullableDateValue(timeZone, value),
    [timeZone, value]
  );
}

/**
 * Get a callback function that can be passed to the isDateUnavailable prop of a Spectrum Date component.
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
 * Wrap Date component props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useDateComponentProps<TProps>(
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
  }: SerializedDateComponentProps<TProps>,
  timeZone: string
): DeserializedDateComponentProps<TProps> {
  const serializedOnFocus = useFocusEventCallback(onFocus);
  const serializedOnBlur = useFocusEventCallback(onBlur);
  const serializedOnKeyDown = useKeyboardEventCallback(onKeyDown);
  const serializedOnKeyUp = useKeyboardEventCallback(onKeyUp);
  const onChange = useOnChangeDateCallback(serializedOnChange);
  const deserializedValue = useNullableDateValueMemo(timeZone, serializedValue);
  const deserializedDefaultValue = useNullableDateValueMemo(
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
