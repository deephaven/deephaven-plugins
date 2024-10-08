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
import { RangeValue } from './hooks';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';

const EMPTY_FUNCTION = () => undefined;

export function RangeCalendar(
  props: SerializedRangeCalendarProps<DHCRangeCalendarProps<DateValue>>
): JSX.Element {
  const {
    defaultValue = null,
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = useRangeCalendarProps(props);

  const [value, onChange] = useDebouncedOnChange<RangeValue<DateValue> | null>(
    propValue ?? defaultValue,
    propOnChange
  );

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCRangeCalendar value={value} onChange={onChange} {...otherProps} />;
}

RangeCalendar.displayName = 'RangeCalendar';

export default RangeCalendar;
