import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  DateField as DHCDateField,
  DateFieldProps as DHCDateFieldProps,
} from '@deephaven/components';
import { usePrevious } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { DateValue, toTimeZone, ZonedDateTime } from '@internationalized/date';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';
import {
  SerializedDatePickerProps,
  useDatePickerProps,
} from './hooks/useDatePickerProps'; // TODO refactor
import { isStringInstant } from './utils/DateTimeUtils';

const EMPTY_FUNCTION = () => undefined;

function isDateFieldInstant(
  props: SerializedDatePickerProps<DHCDateFieldProps<DateValue>>
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

export function DateField(
  props: SerializedDatePickerProps<DHCDateFieldProps<DateValue>>
): JSX.Element {
  const isDateFieldInstantValue = isDateFieldInstant(props);
  const settings = useSelector(getSettings<RootState>);
  const { timeZone } = settings;

  const {
    defaultValue = null,
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = useDatePickerProps(props, timeZone);

  const [value, onChange] = useDebouncedOnChange<DateValue | null>(
    propValue ?? defaultValue,
    propOnChange
  );

  // When the time zone changes, the serialized prop value will change, so we need to update the value state
  const prevTimeZone = usePrevious(timeZone);
  useEffect(() => {
    // The timezone is intially undefined, so we don't want to trigger a change in that case
    if (
      isDateFieldInstantValue &&
      prevTimeZone !== undefined &&
      timeZone !== prevTimeZone &&
      value instanceof ZonedDateTime
    ) {
      const newValue = toTimeZone(value, timeZone);
      onChange(newValue);
    }
  }, [isDateFieldInstantValue, value, onChange, timeZone, prevTimeZone]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCDateField value={value} onChange={onChange} {...otherProps} />
  );
}

DateField.displayName = 'DateField';

export default DateField;
