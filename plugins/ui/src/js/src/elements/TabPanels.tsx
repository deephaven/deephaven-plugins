import React from 'react';
import {
  TabPanels as DHCTabPanels,
  TabPanelsProps as DHCTabPanelsProps,
} from '@deephaven/components';

export function TabPanels(props: DHCTabPanelsProps<object>): JSX.Element {
  const { UNSAFE_style: unsafeStyle, ...otherProps } = props;

  return (
    <DHCTabPanels
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
      UNSAFE_style={{ display: 'flex', ...unsafeStyle }}
      keepMounted
    />
  );
}

TabPanels.displayName = 'TabPanels';

export default TabPanels;
