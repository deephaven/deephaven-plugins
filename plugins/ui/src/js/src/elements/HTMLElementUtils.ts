import { ReactHTML } from 'react';
import { ELEMENT_PREFIX, ElementPrefix } from './ElementConstants';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';

/**
 * Describes an HTML element that can be rendered in the UI.
 * The tag used for the HTML element is the name of the element without the prefix.
 * For example, `deephaven.ui.html.div` would be rendered as `<div>`.
 * The props are passed directly to the HTML element as attributes.
 */
export type HTMLElementNode = ElementNode<ElementPrefix['html']>;

export function isHTMLElementNode(obj: unknown): obj is HTMLElementNode {
  return (
    isElementNode(obj) &&
    (obj as HTMLElementNode)[ELEMENT_KEY].startsWith(ELEMENT_PREFIX.html)
  );
}

/**
 * Get the HTML tag name for the element
 * @param name Name of the element
 * @returns The HTML tag name for the element
 */
export function getHTMLTag(name: ElementPrefix['html']): keyof ReactHTML {
  return name.substring(ELEMENT_PREFIX.html.length) as keyof ReactHTML;
}
