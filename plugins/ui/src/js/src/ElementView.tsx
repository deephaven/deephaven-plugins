import React, { ReactNode } from 'react';
import {
  ElementNode,
  isObjectNode,
  isPrimitiveNode,
  isRenderedNode,
  UIElement,
} from './ElementUtils';
import ObjectView from './ObjectView';
import { isHTMLElementNode } from './HTMLElementUtils';
import HTMLElementView from './HTMLElementView';
import { isSpectrumElementNode } from './SpectrumElementUtils';
import SpectrumElementView from './SpectrumElementView';
import { isIconElementNode } from './IconElementUtils';
import IconElementView from './IconElementView';

export type ElementViewProps = {
  element: UIElement;
};

export function ElementView({ element }: ElementViewProps): JSX.Element | null {
  const { root, objects } = element;

  if (isRenderedNode(root)) {
    const { children: elementChildren } = root;
    let children: ReactNode = null;
    if (elementChildren != null) {
      if (Array.isArray(elementChildren)) {
        children = elementChildren.map((child, index) => {
          const childElement = { root: child, objects };
          // eslint-disable-next-line react/no-array-index-key
          return <ElementView key={index} element={childElement} />;
        });
      } else {
        const childElement: UIElement = { root: elementChildren, objects };
        children = <ElementView element={childElement} />;
      }
    }
    if (isHTMLElementNode(root)) {
      return <HTMLElementView node={root}>{children}</HTMLElementView>;
    }
    if (isSpectrumElementNode(root)) {
      return <SpectrumElementView node={root}>{children}</SpectrumElementView>;
    }
    if (isIconElementNode(root)) {
      return <IconElementView node={root}>{children}</IconElementView>;
    }

    // No special rendering for this node, just render the children
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{children}</>;
  }
  if (isObjectNode(root)) {
    const object = objects[root.object_id];
    return <ObjectView object={object} />;
  }
  if (isPrimitiveNode(root)) {
    // eslint-disable-next-line react/jsx-no-useless-fragment
    return <>{root}</>;
  }
  throw new Error(`Unknown root type ${root}`);
}

export default ElementView;
