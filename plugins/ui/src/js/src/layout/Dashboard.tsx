import React from 'react';
import { ElementIdProps, type DashboardElementProps } from './LayoutUtils';
import { usePanelId } from './ReactPanelContext';
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
  __dhId,
}: DashboardElementProps & ElementIdProps): JSX.Element | null {
  const contextPanelId = usePanelId();
  const isNested = contextPanelId != null;
  if (isNested) {
    return <NestedDashboard __dhId={__dhId}>{children}</NestedDashboard>;
  }

  return <DashboardContent>{children}</DashboardContent>;
}

export default Dashboard;
