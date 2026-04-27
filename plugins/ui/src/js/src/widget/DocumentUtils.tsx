import React from 'react';
import { type WidgetDescriptor } from '@deephaven/dashboard';
import { type UriVariableDescriptor } from '@deephaven/jsapi-bootstrap';
import ReactPanel from '../layout/ReactPanel';
import { MixedPanelsError, NoChildrenError } from '../errors';
import Dashboard from '../layout/Dashboard';
import DefaultPanelContent from './DefaultPanelContent';

/**
 * Convert the children passed as the Document root to a valid root node, or throw if it's an invalid root configuration.
 * For example, you cannot mix a Panel with another type of element. In that case, it will throw.
 * If the root does not have a Panel or Dashboard layout specified, it will automatically wrap the children in a panel.
 *
 *
 * @param children Root children of the document.
 * @param widget Descriptor of the widget used to create this document. Used for titling panels if necessary.
 * @param isNested Whether this document is nested inside a panel.
 * @returns The children, wrapped in a panel if necessary.
 */
export function getRootChildren(
  children: React.ReactNode,
  widget: WidgetDescriptor | UriVariableDescriptor,
  isNested = false
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

  if (panelCount > 0 && isNested) {
    // Wrap it in a dashboard so it can be rendered properly
    return <Dashboard>{children}</Dashboard>;
  }

  if (nonLayoutCount === childrenArray.length) {
    // Bare (non-layout) children. The widget is hosted by an outer panel
    // (e.g. the core WidgetPanel) which doesn't provide padding or react to
    // the widget's loading/error state. Wrap with DefaultPanelContent to
    // supply those behaviors.
    return <DefaultPanelContent>{children}</DefaultPanelContent>;
  }

  // It's already got layout defined, just return it
  return children;
}

export default { getRootChildren };
