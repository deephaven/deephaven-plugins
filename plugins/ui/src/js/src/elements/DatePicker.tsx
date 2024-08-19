import React, { useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  DatePicker as DHCDatePicker,
  DatePickerProps as DHCDatePickerProps,
} from '@deephaven/components';
import { useDebouncedCallback, usePrevious } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { DateValue, toTimeZone, ZonedDateTime } from '@internationalized/date';
import {
  SerializedDatePickerProps,
  useDatePickerProps,
} from './hooks/useDatepickerProps';

const VALUE_CHANGE_DEBOUNCE = 250;

const EMPTY_FUNCTION = () => undefined;

function isStringInstant(value?: string | null): boolean {
  return value != null && value.endsWith('Z');
}

function isDatePickerInstant(
  props: SerializedDatePickerProps<DHCDatePickerProps<DateValue>>
): boolean {
  const { value, defaultValue, placeholderValue } = props;
  if (value != null) {
    return isStringInstant(value);
  }
  if (defaultValue != null) {
    return isStringInstant(defaultValue);
  }
  return isStringInstant(placeholderValue);
}

export function DatePicker(
  props: SerializedDatePickerProps<DHCDatePickerProps<DateValue>>
): JSX.Element {
  const isDatePickerInstantValue = isDatePickerInstant(props);
  const settings = useSelector(getSettings<RootState>);
  const { timeZone } = settings;

  const {
    defaultValue = null,
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = useDatePickerProps(props, timeZone);

  const [value, setValue] = useState(propValue ?? defaultValue);

  const debouncedOnChange = useDebouncedCallback(
    propOnChange,
    VALUE_CHANGE_DEBOUNCE
  );

  const onChange = useCallback(
    newValue => {
      setValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );

  // When the time zone changes, the serialized prop value will change, so we need to update the value state
  const prevTimeZone = usePrevious(timeZone);
  useEffect(() => {
    // The timezone is intially undefined, so we don't want to trigger a change in that case
    if (
      isDatePickerInstantValue &&
      prevTimeZone !== undefined &&
      timeZone !== prevTimeZone &&
      value instanceof ZonedDateTime
    ) {
      const newValue = toTimeZone(value, timeZone);
      setValue(toTimeZone(value, timeZone));
      debouncedOnChange(newValue);
    }
  }, [
    isDatePickerInstantValue,
    value,
    debouncedOnChange,
    timeZone,
    prevTimeZone,
  ]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCDatePicker value={value} onChange={onChange} {...otherProps} />
  );
}

DatePicker.displayName = 'DatePicker';

export default DatePicker;
