import React from 'react';
import {
  InlineAlert as DHCInlineAlert,
  InlineAlertProps as DHCInlineAlertProps,
} from '@deephaven/components';
import { wrapTextChildren } from './utils';

export function InlineAlert(props: DHCInlineAlertProps): JSX.Element {
  const { children } = props;
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCInlineAlert {...props}>{wrapTextChildren(children)}</DHCInlineAlert>
  );
}
InlineAlert.displayName = 'InlineAlert';
export default InlineAlert;
