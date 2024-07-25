import React, { useCallback, useState } from 'react';
import {
  DatePicker as DHCDatePicker,
  DatePickerProps as DHCDatePickerProps,
} from '@deephaven/components';
import { useDebouncedCallback } from '@deephaven/react-hooks';
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
  const {
    defaultValue = null,
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = useDatePickerProps(props);

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

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCDatePicker value={value} onChange={onChange} {...otherProps} />
  );
}

DatePicker.displayName = 'DatePicker';

export default DatePicker;
