import React from 'react';
import {
  Button as SpectrumButton,
  SpectrumButtonProps,
} from '@adobe/react-spectrum';
import { SerializedButtonEventProps, useButtonProps } from './useButtonProps';

function Button(props: SpectrumButtonProps & SerializedButtonEventProps) {
  const buttonProps = useButtonProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <SpectrumButton {...buttonProps} />;
}

Button.displayName = 'Button';

export default Button;
