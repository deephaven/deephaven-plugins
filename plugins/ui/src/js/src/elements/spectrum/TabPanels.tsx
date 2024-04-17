import React from 'react';
import {
  TabPanels as SpectrumTabPanels,
  SpectrumTabPanelsProps,
} from '@adobe/react-spectrum';

function TabPanels(
  props: SpectrumTabPanelsProps<React.ReactNode>
): JSX.Element {
  const { UNSAFE_style: unsafeStyle, ...otherProps } = props;

  return (
    <SpectrumTabPanels
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...otherProps}
      UNSAFE_style={{ display: 'flex', ...unsafeStyle }}
    />
  );
}

TabPanels.displayName = 'TabPanels';

export default TabPanels;
