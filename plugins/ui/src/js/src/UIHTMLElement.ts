import { ElementNode } from './UIElement';

export const HTML_ELEMENT_TYPE_PREFIX = 'deephaven.ui.html.';

export type HTMLElementNode = ElementNode & {
  name: `${typeof HTML_ELEMENT_TYPE_PREFIX}.${keyof JSX.IntrinsicElements}`;
};

export function isHTMLElementNode(obj: unknown): obj is HTMLElementNode {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    (obj as HTMLElementNode).name.startsWith(HTML_ELEMENT_TYPE_PREFIX)
  );
}

/**
 * Get the HTML tag name for the element
 * @param name Name of the element
 * @returns The HTML tag name for the element
 */
export function getHTMLTag(name: string): keyof JSX.IntrinsicElements {
  return name.substring(
    HTML_ELEMENT_TYPE_PREFIX.length
  ) as keyof JSX.IntrinsicElements;
}
