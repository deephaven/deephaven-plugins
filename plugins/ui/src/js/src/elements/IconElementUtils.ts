import * as icons from '@deephaven/icons';
import { ELEMENT_KEY, ElementNode, isElementNode } from './ElementUtils';

export const ICON_ELEMENT_TYPE_PREFIX = 'deephaven.ui.icons.';

export type IconElementName =
  `${typeof ICON_ELEMENT_TYPE_PREFIX}${keyof typeof icons}`;

/**
 * Describes an icon element that can be rendered in the UI.
 * The name of the icon is the name of the element without the prefix.
 * For example, `deephaven.ui.icons.vsBell` will render the icon named `vsBell`.
 * The props are passed directly to the icon component.
 */
export type IconElementNode = ElementNode<IconElementName>;

export function isIconElementNode(obj: unknown): obj is IconElementNode {
  return (
    isElementNode(obj) &&
    (obj as IconElementNode)[ELEMENT_KEY].startsWith(ICON_ELEMENT_TYPE_PREFIX)
  );
}

export function getIcon(name: IconElementName): icons.IconDefinition {
  return icons[
    name.substring(ICON_ELEMENT_TYPE_PREFIX.length) as keyof typeof icons
  ] as icons.IconDefinition;
}
