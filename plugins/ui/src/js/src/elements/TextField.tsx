import React from 'react';
import {
  TextField as DHCTextField,
  TextFieldProps as DHCTextFieldProps,
} from '@deephaven/components';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';

const EMPTY_FUNCTION = () => undefined;

interface TextFieldProps extends DHCTextFieldProps {
  onChange?: (value: string) => Promise<void>;
}

export function TextField(props: TextFieldProps): JSX.Element {
  const {
    defaultValue = '',
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    ...otherProps
  } = props;

  const [value, onChange] = useDebouncedOnChange<string>(
    propValue,
    defaultValue,
    propOnChange
  );

  return (
    <DHCTextField
      value={value}
      onChange={onChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    />
  );
}

TextField.displayName = 'TextField';

export default TextField;
