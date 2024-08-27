import React, { useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  DateRangePicker as DHCDateRangePicker,
  DateRangePickerProps as DHCDateRangePickerProps,
} from '@deephaven/components';
import { useDebouncedCallback, usePrevious } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { DateValue, toTimeZone, ZonedDateTime } from '@internationalized/date';
import {
  SerializedDateRangePickerProps,
  useDateRangePickerProps,
} from './hooks/useDateRangePickerProps';

const VALUE_CHANGE_DEBOUNCE = 250;

const EMPTY_FUNCTION = () => undefined;

function isStringInstant(value?: string | null): boolean {
  return value != null && value.endsWith('Z');
}

function isDateRangePickerInstant(
  props: SerializedDateRangePickerProps<DHCDateRangePickerProps<DateValue>>
): boolean {
  const { value, defaultValue, placeholderValue } = props;
  if (value != null) {
    return isStringInstant(value.start);
  }
  if (defaultValue != null) {
    return isStringInstant(defaultValue.start);
  }
  return isStringInstant(placeholderValue);
}

export function DateRangePicker(
  props: SerializedDateRangePickerProps<DHCDateRangePickerProps<DateValue>>
): JSX.Element {
  const isDateRangePickerInstantValue = isDateRangePickerInstant(props);
  const settings = useSelector(getSettings<RootState>);
  const { timeZone } = settings;

  const {
    defaultValue = null,
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = useDateRangePickerProps(props, timeZone);

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
      isDateRangePickerInstantValue &&
      prevTimeZone !== undefined &&
      timeZone !== prevTimeZone &&
      value != null &&
      value.start instanceof ZonedDateTime &&
      value.end instanceof ZonedDateTime
    ) {
      const newStart = toTimeZone(value.start, timeZone);
      const newEnd = toTimeZone(value.end, timeZone);
      const newValue = { start: newStart, end: newEnd };
      setValue(newValue);
      debouncedOnChange(newValue);
    }
  }, [
    isDateRangePickerInstantValue,
    value,
    debouncedOnChange,
    timeZone,
    prevTimeZone,
  ]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCDateRangePicker value={value} onChange={onChange} {...otherProps} />
  );
}

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker;
