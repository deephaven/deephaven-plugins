import React, { useCallback, useState } from 'react';
import {
  TextField as DHCTextField,
  TextFieldProps as DHCTextFieldProps,
} from '@deephaven/components';
import { useDebouncedCallback, usePrevious } from '@deephaven/react-hooks';

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
  const prevPropValue = usePrevious(propValue);

  if (
    propValue !== prevPropValue &&
    propValue !== value &&
    propValue !== undefined
  ) {
    setValue(propValue);
  }

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
    <DHCTextField value={value} onChange={onChange} {...otherProps} />
  );
}

TextField.displayName = 'TextField';

export default TextField;
