import React from 'react';
import {
  Flex as DHCFlex,
  FlexProps as DHCFlexProps,
} from '@deephaven/components';

import classNames from 'classnames';

export function Flex({
  UNSAFE_className,
  ...restProps
}: DHCFlexProps): JSX.Element {
  return (
    <DHCFlex
      UNSAFE_className={classNames('dh-flex', UNSAFE_className)}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...restProps}
    />
  );
}

export default Flex;
