import React, { useCallback, useState } from 'react';
import {
  TextField as DHCTextField,
  TextFieldProps as DHCTextFieldProps,
} from '@deephaven/components';
import Log from '@deephaven/log';
import { useDebouncedCallback, usePrevious } from '@deephaven/react-hooks';

const log = Log.module('@deephaven/js-plugin-ui/TextField');

const VALUE_CHANGE_DEBOUNCE = 250;

const EMPTY_FUNCTION = () => undefined;

interface TextFieldProps extends DHCTextFieldProps {
  onChange?: (value: string) => Promise<void>;
}

function TextField(props: TextFieldProps): JSX.Element {
  const {
    defaultValue = '',
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
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
    async (newValue: string) => {
      try {
        await propOnChange(newValue);
      } catch (e) {
        log.warn('Error returned from onChange', e);
      }
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
      setPending(true);
      debouncedOnChange(newValue);
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
