import React, { useCallback, useRef, useState } from 'react';
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
  const prevPropValue = useRef(propValue);
  const pendingUpdate = useRef(false);

  if (
    propValue !== prevPropValue.current &&
    propValue !== value &&
    !pendingUpdate.current
  ) {
    setValue(propValue ?? defaultValue);
  }

  prevPropValue.current = propValue; // Always up to date after the check and doesn't trigger a re-render if the prop matches the current value

  const debouncedOnChange = useDebouncedCallback(
    propOnChange,
    VALUE_CHANGE_DEBOUNCE
  );

  const onChange = useCallback(
    newValue => {
      pendingUpdate.current = true;
      setValue(newValue);
      debouncedOnChange(newValue);
      pendingUpdate.current = false;
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
