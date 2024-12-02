import React from 'react';
import {
  LogicButton as DHCLogicButton,
  LogicButtonProps as DHCLogicButtonProps,
} from '@deephaven/components';
import { useButtonProps } from './hooks/useButtonProps';
import { SerializedButtonEventProps } from './model/SerializedPropTypes';

export function LogicButton(
  props: SerializedButtonEventProps<DHCLogicButtonProps>
): JSX.Element {
  const buttonProps = useButtonProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCLogicButton {...buttonProps} />;
}

export default LogicButton;
