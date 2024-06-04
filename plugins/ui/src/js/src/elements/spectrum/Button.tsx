import React from 'react';
import { SpectrumButton, SpectrumButtonProps } from '@deephaven/components';
import { SerializedButtonEventProps, useButtonProps } from './useButtonProps';

function Button(
  props: SpectrumButtonProps & SerializedButtonEventProps
): JSX.Element {
  const buttonProps = useButtonProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <SpectrumButton {...buttonProps} />;
}

Button.displayName = 'Button';

export default Button;
