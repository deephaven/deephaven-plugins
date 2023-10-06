import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';

export const PANEL_ELEMENT_NAME = 'deephaven.ui.components.Panel';

export type PanelElementType = typeof PANEL_ELEMENT_NAME;

/**
 * Describes a panel element that can be rendered in the UI.
 */
export type PanelElementNode = ElementNode & {
  [ELEMENT_KEY]: PanelElementType;
  props: {
    title?: string;
  };
};

/**
 * Check if an object is a PanelElementNode
 * @param obj Object to check
 * @returns True if the object is a PanelElementNode
 */
export function isPanelElementNode(obj: unknown): obj is PanelElementNode {
  return (
    isElementNode(obj) &&
    (obj as ElementNode)[ELEMENT_KEY] === PANEL_ELEMENT_NAME
  );
}
