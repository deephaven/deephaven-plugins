import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';

export const HTML_ELEMENT_NAME_PREFIX = 'deephaven.ui.html.';

export type HTMLElementType =
  `${typeof HTML_ELEMENT_NAME_PREFIX}${keyof JSX.IntrinsicElements}`;

export type HTMLElementNode = ElementNode & {
  [ELEMENT_KEY]: HTMLElementType;
};

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
export function getHTMLTag(name: HTMLElementType): keyof JSX.IntrinsicElements {
  return name.substring(
    HTML_ELEMENT_NAME_PREFIX.length
  ) as keyof JSX.IntrinsicElements;
}
