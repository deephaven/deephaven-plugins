import { ElementNode } from './UIElement';

export const HTML_ELEMENT_TYPE =
  'deephaven.ui.elements.HTMLElement.HTMLElement';

export type HTMLTypeProps = {
  tag: keyof JSX.IntrinsicElements;
  attributes: Record<string, string>;
};

export type HTMLElementNode = ElementNode & {
  name: typeof HTML_ELEMENT_TYPE;
  props: HTMLTypeProps;
};

export function isHTMLElementNode(obj: unknown): obj is HTMLElementNode {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    (obj as HTMLElementNode).name === HTML_ELEMENT_TYPE
  );
}
