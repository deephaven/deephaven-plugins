import React from 'react';
import {
  ActionButton as DHCActionButton,
  ActionButtonProps as DHCActionButtonProps,
} from '@deephaven/components';
import { useButtonProps } from './useButtonProps';
import { SerializedButtonEventProps } from '../SerializedPropTypes';

function ActionButton(
  props: SerializedButtonEventProps<DHCActionButtonProps>
): JSX.Element {
  const buttonProps = useButtonProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCActionButton {...buttonProps} />;
}

export default ActionButton;
