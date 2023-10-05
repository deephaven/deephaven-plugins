import React from 'react';
import { ElementNode } from './ElementUtils';
import { isHTMLElementNode } from './HTMLElementUtils';
import HTMLElementView from './HTMLElementView';
import { isSpectrumElementNode } from './SpectrumElementUtils';
import SpectrumElementView from './SpectrumElementView';
import { isIconElementNode } from './IconElementUtils';
import IconElementView from './IconElementView';
import renderElementChildren from './renderElementChildren';

export type ElementViewProps = {
  element: ElementNode;
};

export function ElementView({ element }: ElementViewProps): JSX.Element | null {
  if (isHTMLElementNode(element)) {
    return <HTMLElementView element={element} />;
  }
  if (isSpectrumElementNode(element)) {
    return <SpectrumElementView element={element} />;
  }
  if (isIconElementNode(element)) {
    return <IconElementView element={element} />;
  }

  // No special rendering for this node, just render the children
  const { props } = element;
  if (props == null) {
    return null;
  }
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  return renderElementChildren(children);
}

export default ElementView;
