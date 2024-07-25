import React from 'react';
import {
  TextArea as DHCTextArea,
  TextAreaProps as DHCTextAreaProps,
} from '@deephaven/components';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';

const EMPTY_FUNCTION = () => undefined;

interface TextAreaProps extends DHCTextAreaProps {
  onChange?: (value: string) => Promise<void>;
}

export function TextArea(props: TextAreaProps): JSX.Element {
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
    <DHCTextArea
      value={value}
      onChange={onChange}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    />
  );
}

TextArea.displayName = 'TextArea';

export default TextArea;
