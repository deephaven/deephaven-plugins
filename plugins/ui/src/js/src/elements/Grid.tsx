import React from 'react';
import {
  Grid as DHCGrid,
  GridProps as DHCGridProps,
} from '@deephaven/components';

import classNames from 'classnames';

export function Grid({
  UNSAFE_className,
  ...restProps
}: DHCGridProps): JSX.Element {
  return (
    <DHCGrid
      UNSAFE_className={classNames('dh-grid', UNSAFE_className)}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...restProps}
    />
  );
}

export default Grid;
