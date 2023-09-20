import { RenderedNode, isRenderedNode } from './ElementUtils';

export const HTML_ELEMENT_TYPE_PREFIX = 'deephaven.ui.html.';

export type HTMLElementName =
  `${typeof HTML_ELEMENT_TYPE_PREFIX}${keyof JSX.IntrinsicElements}`;

export type HTMLElementNode = RenderedNode & {
  name: HTMLElementName;
};

export function isHTMLElementNode(obj: unknown): obj is HTMLElementNode {
  return (
    isRenderedNode(obj) &&
    (obj as HTMLElementNode).name.startsWith(HTML_ELEMENT_TYPE_PREFIX)
  );
}

/**
 * Get the HTML tag name for the element
 * @param name Name of the element
 * @returns The HTML tag name for the element
 */
export function getHTMLTag(name: HTMLElementName): keyof JSX.IntrinsicElements {
  return name.substring(
    HTML_ELEMENT_TYPE_PREFIX.length
  ) as keyof JSX.IntrinsicElements;
}
