import React from 'react';
import { Icon } from '@adobe/react-spectrum';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getIcon, IconElementNode } from './IconElementUtils';
import { ELEMENT_KEY } from './ElementUtils';

export type IconElementViewProps = {
  element: IconElementNode;
};

export function IconElementView({
  element,
}: IconElementViewProps): JSX.Element | null {
  const { [ELEMENT_KEY]: name, props = {} } = element;
  const icon = getIcon(name);
  if (icon == null) {
    throw new Error(`Unknown icon ${name}`);
  }

  return (
    <Icon>
      {/* eslint-disable-next-line react/jsx-props-no-spreading */}
      <FontAwesomeIcon icon={icon} {...props} />
    </Icon>
  );
}

export default IconElementView;
