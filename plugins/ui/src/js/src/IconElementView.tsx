import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getIcon, IconElementNode } from './IconElementUtils';

export type IconElementViewProps = {
  children?: React.ReactNode;
  node: IconElementNode;
};

export function IconElementView({
  children,
  node,
}: IconElementViewProps): JSX.Element | null {
  const { name, props } = node;
  const icon = getIcon(name);
  if (icon == null) {
    throw new Error(`Unknown icon ${name}`);
  }

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <FontAwesomeIcon icon={icon} {...props}>
      {children}
    </FontAwesomeIcon>
  );
}

export default IconElementView;
