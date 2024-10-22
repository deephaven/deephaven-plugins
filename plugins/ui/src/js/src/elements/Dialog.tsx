import React, { useCallback } from 'react';
import {
  Dialog as DHCDialog,
  DialogProps as DHCDialogProps,
} from '@deephaven/components';

export function Dialog(props: DHCDialogProps): JSX.Element {
  const { onDismiss: onDismissProp, ...otherProps } = props;
  const onDismissCallback = useCallback(
    () => onDismissProp?.(),
    [onDismissProp]
  );
  const onDismiss = onDismissProp != null ? onDismissCallback : undefined;
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCDialog onDismiss={onDismiss} {...otherProps} />;
}

Dialog.displayName = 'Dialog';

export default Dialog;
