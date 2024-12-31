import React from 'react';
import {
  SpectrumMenu as DHCMenu,
  SpectrumMenuProps as DHCMenuProps,
} from '@deephaven/components';
// import useConditionalCallback from './hooks/useConditionalCallback';

export function Menu(props: DHCMenuProps<object>): JSX.Element {
  console.log('Menu', props);
  console.trace();
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCMenu {...props} />;
}

Menu.displayName = 'Menu';

export default Menu;
