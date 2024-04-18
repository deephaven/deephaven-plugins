import React from 'react';
import {
  ActionButton as SpectrumActionButton,
  SpectrumActionButtonProps,
} from '@adobe/react-spectrum';
import { SerializedButtonEventProps, useButtonProps } from './useButtonProps';

function ActionButton(
  props: SpectrumActionButtonProps & SerializedButtonEventProps
): JSX.Element {
  const buttonProps = useButtonProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <SpectrumActionButton {...buttonProps} />;
}

export default ActionButton;
