import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Calendar as DHCCalendar,
  CalendarProps as DHCCalendarProps,
} from '@deephaven/components';
import { usePrevious } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import {
  CalendarDate,
  DateValue,
  toTimeZone,
  ZonedDateTime,
} from '@internationalized/date';
import {
  SerializedCalendarProps,
  useCalendarProps,
} from './hooks/useCalendarProps';
import { isStringInstant } from './utils/DateTimeUtils';

const EMPTY_FUNCTION = () => undefined;

function isCalendarInstant(
  props: SerializedCalendarProps<DHCCalendarProps<DateValue>>
): boolean {
  const { value, defaultValue, focusedValue, defaultFocusedValue } = props;
  if (value != null) {
    return isStringInstant(value);
  }
  if (defaultValue != null) {
    return isStringInstant(defaultValue);
  }
  if (focusedValue != null) {
    return isStringInstant(focusedValue);
  }
  return isStringInstant(defaultFocusedValue);
}

export function Calendar(
  props: SerializedCalendarProps<DHCCalendarProps<DateValue>>
): JSX.Element {
  const isCalendarInstantValue = isCalendarInstant(props);
  const settings = useSelector(getSettings<RootState>);
  const { timeZone } = settings;

  const {
    // defaultValue = null,
    // value: propValue,
    // onChange: propOnChange = EMPTY_FUNCTION,
    // defaultFocusedValue = null,
    // focusedValue: propFocusedValue,
    // onFocusChange: propOnFocusChange = EMPTY_FUNCTION,
    ...otherProps
  } = useCalendarProps(props, timeZone);

  // TODO if this works then clean this up

  // TODO do not need debouce
  // const [value, onChange] = useState<DateValue | null>(
  //   propValue ?? defaultValue,
  //   propOnChange
  // );

  // // TODO change to calendar values? Or let handler take DateValue?
  // // This should be a datevalue and propOnFocusChange should take in a datevalue and return a calendar?
  // // No, make it just support calendar date in python
  // const [focusedValue, onFocusChange] = useState<DateValue | null>(
  //   propFocusedValue ?? defaultFocusedValue,
  //   propOnFocusChange
  // );

  // // When the time zone changes, the serialized prop value will change, so we need to update the value state
  // const prevTimeZone = usePrevious(timeZone);
  // useEffect(() => {
  //   // The timezone is intially undefined, so we don't want to trigger a change in that case
  //   if (
  //     isCalendarInstantValue &&
  //     prevTimeZone !== undefined &&
  //     timeZone !== prevTimeZone &&
  //     value instanceof ZonedDateTime
  //   ) {
  //     const newValue = toTimeZone(value, timeZone);
  //     onChange?.(newValue);
  //   }
  // }, [isCalendarInstantValue, value, onChange, timeZone, prevTimeZone]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCCalendar {...otherProps} />
    // <DHCCalendar value={value} onChange={onChange} {...otherProps} />
  );
}

Calendar.displayName = 'Calendar';

export default Calendar;
