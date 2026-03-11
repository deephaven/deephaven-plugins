import React from 'react';
import { usePanelId as useLayoutPanelId } from '@deephaven/dashboard';
import { ElementIdProps, type DashboardElementProps } from './LayoutUtils';
import { usePanelId as useReactPanelId } from './ReactPanelContext';
import NestedDashboard from './NestedDashboard';
import DashboardContent from './DashboardContent';

/**
 * Dashboard component that can work at top-level or nested inside a panel.
 *
 * When top-level: Uses the existing layout manager's root (current behavior)
 * When nested: Delegates to NestedDashboard which creates its own GoldenLayout
 */
function Dashboard({
  children,
  ...otherProps
}: DashboardElementProps & ElementIdProps): JSX.Element | null {
  const contextPanelId = useLayoutPanelId();
  const reactPanelId = useReactPanelId();
  const isNested = contextPanelId != null || reactPanelId != null;
  if (isNested) {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <NestedDashboard {...otherProps}>{children}</NestedDashboard>;
  }

  return <DashboardContent>{children}</DashboardContent>;
}

export default Dashboard;
