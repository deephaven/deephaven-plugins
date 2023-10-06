import React from 'react';
import { isElementNode, isExportedObject } from './ElementUtils';
import { isHTMLElementNode } from './HTMLElementUtils';
import HTMLElementView from './HTMLElementView';
import { isSpectrumElementNode } from './SpectrumElementUtils';
import SpectrumElementView from './SpectrumElementView';
import { isIconElementNode } from './IconElementUtils';
import IconElementView from './IconElementView';
import ObjectView from './ObjectView';

export type ElementViewProps = {
  /** The element to render. */
  element: React.ReactNode;
};

/**
 * Take an object from within a document and attempt to render it.
 * If it's an `ElementNode`, then render it as an element and any special handling that may require.
 * If it's an `ExportedObject`, then render it as an object, and/or let a plugin handle it.
 */
export function ElementView({ element }: ElementViewProps): JSX.Element | null {
  if (element == null) {
    return null;
  }
  if (Array.isArray(element)) {
    return (
      <>
        {element.map((child, i) => (
          // eslint-disable-next-line react/no-array-index-key
          <ElementView element={child} key={i} />
        ))}
      </>
    );
  }
  if (isElementNode(element)) {
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
    return <ElementView element={children} />;
  }

  if (isExportedObject(element)) {
    return <ObjectView object={element} />;
  }

  // Just try and return the element, assume it is renderable. If not, this will throw.
  return element as JSX.Element;
}

export default ElementView;
