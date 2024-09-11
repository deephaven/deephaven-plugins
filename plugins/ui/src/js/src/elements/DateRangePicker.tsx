import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  DateRangePicker as DHCDateRangePicker,
  DateRangePickerProps as DHCDateRangePickerProps,
} from '@deephaven/components';
import { usePrevious } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { DateValue, toTimeZone, ZonedDateTime } from '@internationalized/date';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';
import {
  RangeValue,
  SerializedDateRangePickerProps,
  useDateRangePickerProps,
} from './hooks/useDateRangePickerProps';
import { isStringInstant } from './utils/DateTimeUtils';

const EMPTY_FUNCTION = () => undefined;

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

  const [value, onChange] = useDebouncedOnChange<RangeValue<DateValue> | null>(
    propValue ?? defaultValue,
    propOnChange
  );

  // When the time zone changes, the serialized prop value will change, so we need to update the value state
  const prevTimeZone = usePrevious(timeZone);
  // The timezone is intially undefined, so we don't want to trigger a change in that case
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
      onChange(newValue);
    }
  }, [isDateRangePickerInstantValue, value, onChange, timeZone, prevTimeZone]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCDateRangePicker value={value} onChange={onChange} {...otherProps} />
  );
}

DateRangePicker.displayName = 'DateRangePicker';

export default DateRangePicker;
