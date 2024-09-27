import React from 'react';
import {
  ToggleButton as DHCToggleButton,
  ToggleButtonProps as DHCToggleButtonProps,
} from '@deephaven/components';
import { useButtonProps } from './hooks/useButtonProps';
import { SerializedButtonEventProps } from './model/SerializedPropTypes';

export function ToggleButton(
  props: SerializedButtonEventProps<DHCToggleButtonProps>
): JSX.Element {
  const buttonProps = useButtonProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCToggleButton {...buttonProps} />;
}

export default ToggleButton;
