import React, { useCallback, useState } from 'react';
import {
  SpectrumTextFieldProps,
  TextField as SpectrumTextField,
} from '@adobe/react-spectrum';
import { useDebouncedCallback } from '@deephaven/react-hooks';

const VALUE_CHANGE_DEBOUNCE = 250;

const EMPTY_FUNCTION = () => undefined;

function TextField(props: SpectrumTextFieldProps) {
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

  const onChange = useCallback(
    newValue => {
      setValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <SpectrumTextField value={value} onChange={onChange} {...otherProps} />
  );
}

TextField.displayName = 'TextField';

export default TextField;
