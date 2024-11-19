import React from 'react';
import {
  LabeledValue as DHCLabeledValue,
  LabeledValueProps as DHCLabeledValueProps,
  Text,
} from '@deephaven/components';
import {
  CalendarDate,
  CalendarDateTime,
  Time,
  ZonedDateTime,
} from '@internationalized/date';

export function LabeledValue(
  props: DHCLabeledValueProps<
    | number
    | Date
    | CalendarDate
    | CalendarDateTime
    | ZonedDateTime
    | Time
    | string[]
    | string
  >
): JSX.Element {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCLabeledValue {...props} />
  );
}
LabeledValue.displayName = 'LabeledValue';
export default LabeledValue;
