import React from 'react';
import { HTMLElementNode, getHTMLTag } from './HTMLElementUtils';

export type HTMLElementViewProps = {
  children?: React.ReactNode;
  node: HTMLElementNode;
};

export function HTMLElementView({
  children,
  node,
}: HTMLElementViewProps): JSX.Element | null {
  const { name, props } = node;
  const tag = getHTMLTag(name);
  if (tag == null) {
    throw new Error(`Unknown HTML tag ${name}`);
  }
  return React.createElement(tag, props, children);
}

export default HTMLElementView;
