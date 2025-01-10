import React from 'react';
import {
  SpectrumMenu as DHCMenu,
  SpectrumMenuProps as DHCMenuProps,
} from '@deephaven/components';
import { useMenuProps, SerializedMenuProps } from './hooks/useMenuProps';

export function Menu(
  props: SerializedMenuProps<DHCMenuProps<object>>
): JSX.Element {
  const menuProps = useMenuProps(props);
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <DHCMenu {...menuProps} />;
}

export default Menu;
