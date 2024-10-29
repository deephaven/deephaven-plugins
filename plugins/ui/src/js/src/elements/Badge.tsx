import React from 'react';
import {
  Badge as DHCBadge,
  BadgeProps as DHCBadgeProps,
} from '@deephaven/components';

export function Badge(props: DHCBadgeProps): JSX.Element {
  const { variant } = props;
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCBadge {...props} variant={variant} />
  );
}

Badge.displayName = 'Badge';

export default Badge;
