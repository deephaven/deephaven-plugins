import React from 'react';
import {
  RangeCalendar as DHCRangeCalendar,
  RangeCalendarProps as DHCRangeCalendarProps,
} from '@deephaven/components';
import { DateValue } from '@internationalized/date';
import {
  SerializedRangeCalendarProps,
  useRangeCalendarProps,
} from './hooks/useRangeCalendarProps';

export function RangeCalendar(
  props: SerializedRangeCalendarProps<DHCRangeCalendarProps<DateValue>>
): JSX.Element {
  const rangeCalendarProps = useRangeCalendarProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCRangeCalendar {...rangeCalendarProps} />;
}

RangeCalendar.displayName = 'RangeCalendar';

export default RangeCalendar;
