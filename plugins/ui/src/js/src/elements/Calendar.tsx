import React from 'react';
import {
  Calendar as DHCCalendar,
  CalendarProps as DHCCalendarProps,
} from '@deephaven/components';
import { DateValue } from '@internationalized/date';
import {
  SerializedCalendarProps,
  useCalendarProps,
} from './hooks/useCalendarProps';

export function Calendar(
  props: SerializedCalendarProps<DHCCalendarProps<DateValue>>
): JSX.Element {
  const calendarProps = useCalendarProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCCalendar {...calendarProps} />;
}

Calendar.displayName = 'Calendar';

export default Calendar;
