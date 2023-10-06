import React from 'react';
import { HTMLElementNode, getHTMLTag } from './HTMLElementUtils';
import { ELEMENT_KEY } from './ElementUtils';
import renderElement from './renderElement';

export type HTMLElementViewProps = {
  element: HTMLElementNode;
};

export function HTMLElementView({
  element,
}: HTMLElementViewProps): JSX.Element | null {
  const { [ELEMENT_KEY]: name, props = {} } = element;
  const tag = getHTMLTag(name);
  if (tag == null) {
    throw new Error(`Unknown HTML tag ${name}`);
  }
  // eslint-disable-next-line react/prop-types
  const { children, ...otherProps } = props;
  return React.createElement(tag, otherProps, renderElement(children));
}

export default HTMLElementView;
