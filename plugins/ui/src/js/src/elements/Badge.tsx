import React from 'react';
import {
  Badge as DHCBadge,
  BadgeProps as DHCBadgeProps,
} from '@deephaven/components';
import { wrapTextChildren } from './utils';

export function Badge(props: DHCBadgeProps): JSX.Element {
  const { children } = props;
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCBadge {...props}>{wrapTextChildren(children)}</DHCBadge>
  );
}
Badge.displayName = 'Badge';
export default Badge;
