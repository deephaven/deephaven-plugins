import React from 'react';
import {
  TextArea as DHCTextArea,
  TextAreaProps as DHCTextAreaProps,
  Icon,
} from '@deephaven/components';
import { EMPTY_FUNCTION } from '@deephaven/utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useDebouncedOnChange from './hooks/useDebouncedOnChange';
import { getIcon } from './utils/IconElementUtils';

// const EMPTY_FUNCTION = () => undefined;

interface TextAreaProps extends DHCTextAreaProps {
  onChange?: (value: string) => Promise<void>;
}

export function TextArea(props: TextAreaProps): JSX.Element {
  const {
    defaultValue = '',
    value: propValue,
    onChange: propOnChange = EMPTY_FUNCTION,
    icon: propIcon,
    ...otherProps
  } = props;

  const [value, onChange] = useDebouncedOnChange<string>(
    propValue ?? defaultValue,
    propOnChange
  );

  const icon =
    typeof propIcon === 'string' ? (
      <Icon>
        <FontAwesomeIcon icon={getIcon(`deephaven.ui.icons.${propIcon}`)} />
      </Icon>
    ) : (
      propIcon
    );

  return (
    <DHCTextArea
      value={value}
      onChange={onChange}
      icon={icon}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
    />
  );
}

TextArea.displayName = 'TextArea';

export default TextArea;
