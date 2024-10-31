import React from 'react';
import {
  Link as DHCLink,
  LinkProps as DHCLinkProps,
} from '@deephaven/components';

export function Link(props: DHCLinkProps): JSX.Element {
  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <DHCLink {...props} />
  );
}

Link.displayName = 'Link';

export default Link;
