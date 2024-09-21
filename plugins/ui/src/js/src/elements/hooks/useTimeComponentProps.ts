import { useCallback, useMemo } from 'react';
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
import useTimeValueMemo from './useTimeValueMemo';
import {
  TimeValue,
  TimeGranularity,
  MappedTimeValue,
  parseNullableTimeValue,
} from '../utils/DateTimeUtils';

export type SerializedTimeValue = string | null;

export type SerializedTimeValueCallback = (value: SerializedTimeValue) => void;

export type DeserializedTimeValueCallback =
  | (() => void)
  | ((value: MappedTimeValue<TimeValue> | null) => Promise<void>);

export interface SerializedTimeComponentPropsInterface {
  /** Handler that is called when the element receives focus. */
  onFocus?: SerializedFocusEventCallback;

  /** Handler that is called when the element loses focus. */
  onBlur?: SerializedFocusEventCallback;

  /** Handler that is called when a key is pressed */
  onKeyDown?: SerializedKeyboardEventCallback;

  /** Handler that is called when a key is released */
  onKeyUp?: SerializedKeyboardEventCallback;

  /** Handler that is called when the value changes */
  onChange?: SerializedTimeValueCallback;

  /** The current value (controlled) */
  value?: string | null;

  /** The default value (uncontrolled) */
  defaultValue?: string | null;

  /** The minimum allowed time that a user may select */
  minValue?: string;

  /** The maximum allowed time that a user may select */
  maxValue?: string;

  /** A placeholder time that influences the format of the placeholder shown when no value is selected */
  placeholderValue?: string;

  /** Determines the smallest unit that is displayed in the time component. */
  granularity?: TimeGranularity;
}

export interface DeserializedTimeComponentPropsInterface {
  /** Handler that is called when the element receives focus. */
  onFocus?: DeserializedFocusEventCallback;

  /** Handler that is called when the element loses focus. */
  onBlur?: DeserializedFocusEventCallback;

  /** Handler that is called when a key is pressed */
  onKeyDown?: DeserializedKeyboardEventCallback;

  /** Handler that is called when a key is released */
  onKeyUp?: DeserializedKeyboardEventCallback;

  /** Handler that is called when the value changes */
  onChange?: DeserializedTimeValueCallback;

  /** The current value (controlled) */
  value?: TimeValue | null;

  /** The default value (uncontrolled) */
  defaultValue?: TimeValue | null;

  /** The minimum allowed time that a user may select */
  minValue?: TimeValue;

  /** The maximum allowed time that a user may select */
  maxValue?: TimeValue;

  /** A placeholder time that influences the format of the placeholder shown when no value is selected */
  placeholderValue?: TimeValue;

  /** Determines the smallest unit that is displayed in the time component. */
  granularity?: TimeGranularity;
}

export type SerializedTimeComponentProps<TProps> = TProps &
  SerializedTimeComponentPropsInterface;

export type DeserializedTimeComponentProps<TProps> = Omit<
  TProps,
  keyof SerializedTimeComponentPropsInterface
> &
  DeserializedTimeComponentPropsInterface;

/**
 * Uses the toString representation of the TimeValue as the serialized value.
 * @param value TimeValue to serialize
 * @returns Serialized TimeValue
 */
export function serializeTimeValue(
  value?: MappedTimeValue<TimeValue>
): SerializedTimeValue {
  if (value == null) {
    return null;
  }

  return value.toString();
}

/**
 * Get a callback function that can be passed to the onChange event handler
 * props of a Spectrum Time component.
 * @param callback Callback to be called with the serialized value
 * @returns A callback to be passed into the Spectrum component that transforms
 * the value and calls the provided callback
 */
export function useOnChangeTimeCallback(
  callback?: SerializedTimeValueCallback
): DeserializedTimeValueCallback {
  return useCallback(
    (value?: MappedTimeValue<TimeValue>) => {
      if (callback == null) {
        return;
      }
      callback(serializeTimeValue(value));
    },
    [callback]
  );
}

/**
 * Use memo to get a TimeValue from a nullable string.
 *
 * @param value the string time value
 * @returns TimeValue or null
 */
export function useNullableTimeValueMemo(
  timeZone: string,
  value?: string | null
): TimeValue | null | undefined {
  return useMemo(
    () => parseNullableTimeValue(timeZone, value),
    [timeZone, value]
  );
}

/**
 * Wrap Time component props with the appropriate serialized event callbacks.
 * @param props Props to wrap
 * @returns Wrapped props
 */
export function useTimeComponentProps<TProps>(
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
    granularity: upperCaseTimeGranularity,
    ...otherProps
  }: SerializedTimeComponentProps<TProps>,
  timeZone: string
): DeserializedTimeComponentProps<TProps> {
  const serializedOnFocus = useFocusEventCallback(onFocus);
  const serializedOnBlur = useFocusEventCallback(onBlur);
  const serializedOnKeyDown = useKeyboardEventCallback(onKeyDown);
  const serializedOnKeyUp = useKeyboardEventCallback(onKeyUp);
  const onChange = useOnChangeTimeCallback(serializedOnChange);
  const deserializedValue = useNullableTimeValueMemo(timeZone, serializedValue);
  const deserializedDefaultValue = useNullableTimeValueMemo(
    timeZone,
    serializedDefaultValue
  );
  const deserializedMinValue = useTimeValueMemo(timeZone, serializedMinValue);
  const deserializedMaxValue = useTimeValueMemo(timeZone, serializedMaxValue);
  const deserializedPlaceholderValue = useTimeValueMemo(
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
    granularity: upperCaseTimeGranularity?.toLowerCase() as TimeGranularity,
    ...otherProps,
  };
}
