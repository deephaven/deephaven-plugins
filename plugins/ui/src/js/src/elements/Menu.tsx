import React from 'react';
import {
  SpectrumMenu as DHCMenu,
  SpectrumMenuProps as DHCMenuProps,
} from '@deephaven/components';
import { useMenuProps, SerializedMenuProps } from './hooks/useMenuProps';
// import useConditionalCallback from './hooks/useConditionalCallback';

export function Menu(
  props: SerializedMenuProps<DHCMenuProps<object>>
): JSX.Element {
  console.log('Menu', props);
  const menuProps = useMenuProps(props);
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCMenu {...menuProps} />;
}

Menu.displayName = 'Menu';

export default Menu;
