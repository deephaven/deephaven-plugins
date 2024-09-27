import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  DatePicker as DHCDatePicker,
  DatePickerProps as DHCDatePickerProps,
} from '@deephaven/components';
import { usePrevious } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { DateValue, toTimeZone, ZonedDateTime } from '@internationalized/date';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';
import {
  SerializedDateComponentProps,
  useDateComponentProps,
} from './hooks/useDateComponentProps';
import { isStringInstant } from './utils/DateTimeUtils';

const EMPTY_FUNCTION = () => undefined;

function isDatePickerInstant(
  props: SerializedDateComponentProps<DHCDatePickerProps<DateValue>>
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
  props: SerializedDateComponentProps<DHCDatePickerProps<DateValue>>
): JSX.Element {
  const isDatePickerInstantValue = isDatePickerInstant(props);
  const settings = useSelector(getSettings<RootState>);
  const { timeZone } = settings;

  const {
    defaultValue = null,
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = useDateComponentProps(props, timeZone);

  const [value, onChange] = useDebouncedOnChange<DateValue | null>(
    propValue ?? defaultValue,
    propOnChange
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
      onChange?.(newValue);
    }
  }, [isDatePickerInstantValue, value, onChange, timeZone, prevTimeZone]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCDatePicker value={value} onChange={onChange} {...otherProps} />
  );
}

DatePicker.displayName = 'DatePicker';

export default DatePicker;
