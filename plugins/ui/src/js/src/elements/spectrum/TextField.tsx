import React, { useCallback, useEffect, useState } from 'react';
import {
  TextField as DHCTextField,
  TextFieldProps as DHCTextFieldProps,
} from '@deephaven/components';
import { useDebouncedCallback } from '@deephaven/react-hooks';

const VALUE_CHANGE_DEBOUNCE = 250;

const EMPTY_FUNCTION = () => undefined;

function TextField(props: DHCTextFieldProps): JSX.Element {
  const {
    defaultValue = '',
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = props;

  const [value, setValue] = useState(propValue ?? defaultValue);

  const debouncedOnChange = useDebouncedCallback(
    propOnChange,
    VALUE_CHANGE_DEBOUNCE
  );

  // update state when propValue changes
  useEffect(() => {
    setValue(propValue ?? defaultValue);
  }, [propValue, defaultValue]);

  const onChange = useCallback(
    newValue => {
      setValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCTextField value={value} onChange={onChange} {...otherProps} />
  );
}

TextField.displayName = 'TextField';

export default TextField;
