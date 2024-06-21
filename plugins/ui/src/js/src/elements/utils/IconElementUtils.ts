import * as icons from '@deephaven/icons';
import { ELEMENT_PREFIX, ElementPrefix } from '../model/ElementConstants';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';

/**
 * Describes an icon element that can be rendered in the UI.
 * The name of the icon is the name of the element without the prefix.
 * For example, `deephaven.ui.icons.vsBell` will render the icon named `vsBell`.
 * The props are passed directly to the icon component.
 */
export type IconElementNode = ElementNode<ElementPrefix['icon']>;

export function isIconElementNode(obj: unknown): obj is IconElementNode {
  return (
    isElementNode(obj) &&
    (obj as IconElementNode)[ELEMENT_KEY].startsWith(ELEMENT_PREFIX.icon)
  );
}

export function getIcon(name: ElementPrefix['icon']): icons.IconDefinition {
  return icons[
    name.substring(ELEMENT_PREFIX.icon.length) as keyof typeof icons
  ] as icons.IconDefinition;
}
