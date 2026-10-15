import React, { useContext, useEffect } from 'react';
import {
  LayoutManagerContext,
  usePanelId as useLayoutPanelId,
} from '@deephaven/dashboard';
import {
  type ElementIdProps,
  type DashboardElementProps,
  type LayoutOptions,
  normalizeDashboardChildren,
} from './LayoutUtils';
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
  const layoutManager = useContext(LayoutManagerContext);

  const contextPanelId = useLayoutPanelId();
  const reactPanelId = useReactPanelId();
  const isNested = contextPanelId != null || reactPanelId != null;

  // We need to make sure the headers are showing in the top-level dashboard if we're not nested and the showHeaders prop is set
  const { showHeaders = true } = otherProps;
  useEffect(() => {
    if (isNested) {
      return;
    }
    const hasHeaders = layoutManager?.config?.settings?.hasHeaders ?? true;
    if (showHeaders && !hasHeaders) {
      layoutManager?.enableHeaders();
    } else if (!showHeaders && hasHeaders) {
      layoutManager?.disableHeaders();
    }
  }, [isNested, layoutManager, showHeaders]);

  if (isNested) {
    // eslint-disable-next-line react/jsx-props-no-spreading
    return <NestedDashboard {...otherProps}>{children}</NestedDashboard>;
  }

  return (
    <DashboardContent>
      {Dashboard.getLayoutChildren(children, { isNested })}
    </DashboardContent>
  );
}

// A nested dashboard's panels belong to the panel manager in NestedDashboard
Dashboard.getLayoutChildren = (
  children: React.ReactNode,
  { isNested }: Pick<LayoutOptions, 'isNested'>
): React.ReactNode =>
  isNested ? undefined : normalizeDashboardChildren(children);

export default Dashboard;
