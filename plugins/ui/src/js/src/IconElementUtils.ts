import * as icons from '@deephaven/icons';
import { RenderedNode, isRenderedNode } from './ElementUtils';

export const ICON_ELEMENT_TYPE_PREFIX = 'deephaven.ui.icons.';

export type IconElementName =
  `${typeof ICON_ELEMENT_TYPE_PREFIX}${keyof typeof icons}`;

export type IconElementNode = RenderedNode & {
  name: IconElementName;
};

export function isIconElementNode(obj: unknown): obj is IconElementNode {
  return (
    isRenderedNode(obj) &&
    (obj as IconElementNode).name.startsWith(ICON_ELEMENT_TYPE_PREFIX)
  );
}

export function getIcon(name: IconElementName): icons.IconDefinition {
  return icons[
    name.substring(ICON_ELEMENT_TYPE_PREFIX.length) as keyof typeof icons
  ] as icons.IconDefinition;
}
