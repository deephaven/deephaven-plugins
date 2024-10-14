import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  TimeField as DHCTimeField,
  TimeFieldProps as DHCTimeFieldProps,
} from '@deephaven/components';
import { usePrevious } from '@deephaven/react-hooks';
import { getSettings, RootState } from '@deephaven/redux';
import { toTimeZone, ZonedDateTime } from '@internationalized/date';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';
import {
  SerializedTimeComponentProps,
  useTimeComponentProps,
} from './hooks/useTimeComponentProps';
import { TimeValue, isStringInstant } from './utils/DateTimeUtils';

const EMPTY_FUNCTION = () => undefined;

function isTimeFieldInstant(
  props: SerializedTimeComponentProps<DHCTimeFieldProps<TimeValue>>
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

export function TimeField(
  props: SerializedTimeComponentProps<DHCTimeFieldProps<TimeValue>>
): JSX.Element {
  const isTimeFieldInstantValue = isTimeFieldInstant(props);
  const settings = useSelector(getSettings<RootState>);
  const { timeZone } = settings;

  const {
    defaultValue = null,
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = useTimeComponentProps(props, timeZone);

  const [value, onChange] = useDebouncedOnChange<TimeValue | null>(
    propValue ?? defaultValue,
    propOnChange
  );

  // When the time zone changes, the serialized prop value will change, so we need to update the value state
  const prevTimeZone = usePrevious(timeZone);
  useEffect(() => {
    // The timezone is intially undefined, so we don't want to trigger a change in that case
    if (
      isTimeFieldInstantValue &&
      prevTimeZone !== undefined &&
      timeZone !== prevTimeZone &&
      value instanceof ZonedDateTime
    ) {
      const newValue = toTimeZone(value, timeZone);
      onChange?.(newValue);
    }
  }, [isTimeFieldInstantValue, value, onChange, timeZone, prevTimeZone]);

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCTimeField value={value} onChange={onChange} {...otherProps} />
  );
}

TimeField.displayName = 'TimeField';

export default TimeField;
