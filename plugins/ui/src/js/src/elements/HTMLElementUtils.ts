import { ReactHTML } from 'react';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';

export const HTML_ELEMENT_NAME_PREFIX = 'deephaven.ui.html.';

export type HTMLElementType =
  `${typeof HTML_ELEMENT_NAME_PREFIX}${keyof ReactHTML}`;

/**
 * Describes an HTML element that can be rendered in the UI.
 * The tag used for the HTML element is the name of the element without the prefix.
 * For example, `deephaven.ui.html.div` would be rendered as `<div>`.
 * The props are passed directly to the HTML element as attributes.
 */
export type HTMLElementNode = ElementNode<HTMLElementType>;

export function isHTMLElementNode(obj: unknown): obj is HTMLElementNode {
  return (
    isElementNode(obj) &&
    (obj as HTMLElementNode)[ELEMENT_KEY].startsWith(HTML_ELEMENT_NAME_PREFIX)
  );
}

/**
 * Get the HTML tag name for the element
 * @param name Name of the element
 * @returns The HTML tag name for the element
 */
export function getHTMLTag(name: HTMLElementType): keyof ReactHTML {
  return name.substring(HTML_ELEMENT_NAME_PREFIX.length) as keyof ReactHTML;
}
