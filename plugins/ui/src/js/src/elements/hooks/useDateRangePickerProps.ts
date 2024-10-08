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
  dateValuetoIsoString,
} from '../utils/DateTimeUtils';

export interface RangeValue<T> {
  start: T;
  end: T;
}

export type SerializedDateRangeValue = RangeValue<string> | null;

export type SerializedDateRangeValueCallback = (
  value: SerializedDateRangeValue
) => void;

export type DeserializedDateRangeValueCallback =
  | (() => void)
  | ((value: RangeValue<MappedDateValue<DateValue>> | null) => Promise<void>);

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
export function serializeDateRangeValue(
  value?: RangeValue<MappedDateValue<DateValue>>
): RangeValue<string> | null {
  if (value == null) {
    return null;
  }

  const start = dateValuetoIsoString(value.start);
  const end = dateValuetoIsoString(value.end);

  return { start, end };
}

/**
 * Get a callback function that can be passed to the onChange event handler
 * props of a Spectrum DateRangePicker.
 * @param callback Callback to be called with the serialized value
 * @returns A callback to be passed into the Spectrum component that transforms
 * the value and calls the provided callback
 */
export function useOnChangeDateRangeCallback(
  callback?: SerializedDateRangeValueCallback
): DeserializedDateRangeValueCallback {
  return useCallback(
    (value?: RangeValue<MappedDateValue<DateValue>>) => {
      if (callback == null) {
        return;
      }
      callback(serializeDateRangeValue(value));
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
    () => parseNullableDateRangeValue(timeZone, value),
    [timeZone, value]
  );
}

export function parseNullableDateRangeValue(
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
    granularity: upperCaseGranularity,
    ...otherProps
  }: SerializedDateRangePickerProps<TProps>,
  timeZone: string
): DeserializedDateRangePickerProps<TProps> {
  const serializedOnFocus = useFocusEventCallback(onFocus);
  const serializedOnBlur = useFocusEventCallback(onBlur);
  const serializedOnKeyDown = useKeyboardEventCallback(onKeyDown);
  const serializedOnKeyUp = useKeyboardEventCallback(onKeyUp);
  const onChange = useOnChangeDateRangeCallback(serializedOnChange);
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
    granularity: upperCaseGranularity?.toLowerCase() as Granularity,
    ...otherProps,
  };
}
