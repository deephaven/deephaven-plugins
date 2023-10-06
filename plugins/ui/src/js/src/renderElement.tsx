import React from 'react';
import { isElementNode, isExportedObject } from './ElementUtils';
import { isHTMLElementNode } from './HTMLElementUtils';
import HTMLElementView from './HTMLElementView';
import { isSpectrumElementNode } from './SpectrumElementUtils';
import SpectrumElementView from './SpectrumElementView';
import { isIconElementNode } from './IconElementUtils';
import IconElementView from './IconElementView';
import ObjectView from './ObjectView';

/**
 * Function to render an element that is part of a deephaven.ui document.
 * Handles nulls, arrays, elements, objects, and valid React elements. Throws for unknown elements.
 * @param element The element to render
 */
function renderElement(element: React.ReactNode): React.ReactNode {
  if (element == null) {
    return null;
  }
  if (Array.isArray(element)) {
    return <>{element.map((child, i) => renderElement(child))}</>;
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
    return renderElement(children);
  }

  if (isExportedObject(element)) {
    return <ObjectView object={element} />;
  }

  // Just try and return the element, assume it is renderable. If not, this will throw.
  return element;
}

export default renderElement;
