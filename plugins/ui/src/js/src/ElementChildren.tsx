import React from 'react';
import renderElementChildren from './renderElementChildren';

export interface ElementChildrenProps {
  children: React.ReactNode;
}

/**
 * Function to render children of an element
 */
function ElementChildren({
  children,
}: ElementChildrenProps): JSX.Element | null {
  return renderElementChildren(children);
}

ElementChildren.displayName = 'ElementChildren';

export default ElementChildren;
