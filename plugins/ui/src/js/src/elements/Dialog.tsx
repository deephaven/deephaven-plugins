import React from 'react';
import {
  Dialog as DHCDialog,
  DialogProps as DHCDialogProps,
} from '@deephaven/components';
import useConditionalCallback from './hooks/useConditionalCallback';

export function Dialog(props: DHCDialogProps): JSX.Element {
  const { onDismiss: onDismissProp, ...otherProps } = props;
  const onDismiss = useConditionalCallback(
    onDismissProp != null,
    () => onDismissProp?.(),
    [onDismissProp]
  );
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCDialog onDismiss={onDismiss} {...otherProps} />;
}

Dialog.displayName = 'Dialog';

export default Dialog;
