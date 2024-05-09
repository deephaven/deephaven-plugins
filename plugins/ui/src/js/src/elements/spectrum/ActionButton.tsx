import React from 'react';
import {
  ActionButton as DHCActionButton,
  ActionButtonProps as DHCActionButtonProps,
} from '@deephaven/components';
import { SerializedButtonEventProps, useButtonProps } from './useButtonProps';

function ActionButton(
  props: DHCActionButtonProps & SerializedButtonEventProps
): JSX.Element {
  const buttonProps = useButtonProps(props);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCActionButton {...buttonProps} />;
}

export default ActionButton;
