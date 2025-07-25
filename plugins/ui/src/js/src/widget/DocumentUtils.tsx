import React from 'react';
import { WidgetDescriptor } from '@deephaven/dashboard';
import ReactPanel from '../layout/ReactPanel';
import { MixedPanelsError, NoChildrenError } from '../errors';
import Dashboard from '../layout/Dashboard';

/**
 * Convert the children passed as the Document root to a valid root node, or throw if it's an invalid root configuration.
 * For example, you cannot mix a Panel with another type of element. In that case, it will throw.
 * If the root does not have a Panel or Dashboard layout specified, it will automatically wrap the children in a panel.
 *
 *
 * @param children Root children of the document.
 * @param widget Descriptor of the widget used to create this document. Used for titling panels if necessary.
 * @returns The children, wrapped in a panel if necessary.
 */
export function getRootChildren(
  children: React.ReactNode,
  widget: WidgetDescriptor
): React.ReactNode {
  if (children == null) {
    return null;
  }

  const childrenArray = Array.isArray(children) ? children : [children];
  if (childrenArray.length === 0) {
    throw new NoChildrenError('No children to render');
  }

  const panelCount = childrenArray.filter(
    child => child?.type === ReactPanel
  ).length;

  const dashboardCount = childrenArray.filter(
    child => child?.type === Dashboard
  ).length;

  const nonLayoutCount = childrenArray.length - panelCount - dashboardCount;

  if (nonLayoutCount > 0 && nonLayoutCount !== childrenArray.length) {
    throw new MixedPanelsError('Cannot mix layout and non-layout elements');
  }

  if (panelCount > 0 && dashboardCount > 0) {
    throw new MixedPanelsError('Cannot mix Panel and Dashboard elements');
  }

  if (nonLayoutCount === childrenArray.length || dashboardCount > 0) {
    // Just wrap it in a panel
    return (
      <ReactPanel title={widget.name ?? widget.id ?? widget.type}>
        {children}
      </ReactPanel>
    );
  }

  // It's already got layout defined, just return it
  return children;
}

export default { getRootChildren };
