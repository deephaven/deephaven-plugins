import React, { useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  DatePicker as DHCDatePicker,
  DatePickerProps as DHCDatePickerProps,
} from '@deephaven/components';
import { useDebouncedCallback, usePrevious } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { DateValue } from '@internationalized/date';
import {
  SerializedDatePickerProps,
  useDatePickerProps,
} from './hooks/useDatepickerProps';

const VALUE_CHANGE_DEBOUNCE = 250;

const EMPTY_FUNCTION = () => undefined;

export function DatePicker(
  props: SerializedDatePickerProps<DHCDatePickerProps<DateValue>>
): JSX.Element {
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
    if (prevTimeZone !== undefined && timeZone !== prevTimeZone) {
      setValue(propValue ?? defaultValue);
      debouncedOnChange(propValue);
    }
  }, [propValue, debouncedOnChange, defaultValue, timeZone, prevTimeZone]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCDatePicker value={value} onChange={onChange} {...otherProps} />
  );
}

DatePicker.displayName = 'DatePicker';

export default DatePicker;
