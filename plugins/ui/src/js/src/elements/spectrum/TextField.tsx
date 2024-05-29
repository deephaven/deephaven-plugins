import React, { useCallback, useState } from 'react';
import {
  TextField as DHCTextField,
  TextFieldProps as DHCTextFieldProps,
} from '@deephaven/components';
import { useDebouncedCallback, usePrevious } from '@deephaven/react-hooks';

const VALUE_CHANGE_DEBOUNCE = 250;

interface TextFieldProps extends DHCTextFieldProps {
  onChange: (value: string) => Promise<void>;
}

function TextField(props: TextFieldProps): JSX.Element {
  const {
    defaultValue = '',
    value: propValue,
    onChange: propOnChange,
    ...otherProps
  } = props;

  const [value, setValue] = useState(propValue ?? defaultValue);
  const [pending, setPending] = useState(false);
  const prevPropValue = usePrevious(propValue);

  if (
    propValue !== prevPropValue &&
    propValue !== value &&
    propValue !== undefined &&
    !pending
  ) {
    setValue(propValue);
  }

  const propDebouncedOnChange = useCallback(
    (newValue: string) => {
      propOnChange(newValue);
      setPending(false);
    },
    [propOnChange]
  );

  const debouncedOnChange = useDebouncedCallback(
    propDebouncedOnChange,
    VALUE_CHANGE_DEBOUNCE
  );

  const onChange = useCallback(
    (newValue: string) => {
      debouncedOnChange(newValue);
      setPending(true);
      setValue(newValue);
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
