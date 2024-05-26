import React from 'react';
import {
  Tabs as DHCTabs,
  TabsProps as DHCTabsProps,
} from '@deephaven/components';

function Tabs(props: DHCTabsProps<React.ReactNode>): JSX.Element {
  const {
    UNSAFE_style: unsafeStyle,
    title,
    onSelectionChange,
    ...otherProps
  } = props;

  return (
    <DHCTabs
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
      title={title}
      onSelectionChange={onSelectionChange}
      UNSAFE_style={{ display: 'flex', flex: 1, ...unsafeStyle }}
    />
  );
}

Tabs.displayName = 'Tabs';

export default Tabs;