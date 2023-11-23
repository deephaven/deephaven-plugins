import React from 'react';
import { WidgetDefinition } from '@deephaven/dashboard';
import ReactPanel from './ReactPanel';
import { MixedPanelsError, NoChildrenError } from './errors';

/**
 * Convert the children passed as the Document root to a valid root node, or throw if it's an invalid root configuration.
 * For example, you cannot mix a Panel with another type of element. In that case, it will throw.
 * If the root does not have a Panel or Dashboard layout specified, it will automatically wrap the children in a panel.
 *
 *
 * @param children Root children of the document.
 */
export function getRootChildren(
  children: React.ReactNode,
  definition: WidgetDefinition
): React.ReactNode {
  if (children == null) {
    return null;
  }

  const childrenArray = Array.isArray(children) ? children : [children];
  const childPanelCount = childrenArray.filter(
    child => child?.type === ReactPanel
  ).length;

  if (childrenArray.length === 0) {
    throw new NoChildrenError('No children to render');
  }
  if (childPanelCount !== 0 && childPanelCount !== childrenArray.length) {
    throw new MixedPanelsError('Cannot mix panel and non-panel elements');
  }

  if (childPanelCount === 0) {
    // Just wrap it in a panel
    return (
      <ReactPanel
        key="root"
        title={definition.title ?? definition.id ?? definition.type}
      >
        {children}
      </ReactPanel>
    );
  }

  // It's already got panels defined, just return it
  return children;
}

export default { getRootChildren };
