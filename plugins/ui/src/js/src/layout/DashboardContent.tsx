import React, { useContext, useEffect } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import { normalizeDashboardChildren } from './LayoutUtils';
import { ParentItemContext } from './ParentItemContext';
import { emitDocumentRendered } from './PortalPanelEvent';
import { ReactPanelManagerContext } from './ReactPanelManager';
import { getWidgetId } from './usePanelManager';
import { useWidgetStatus } from './useWidgetStatus';

interface DashboardContentProps {
  children: React.ReactNode;
}

/**
 * Content rendered for a top-level dashboard.
 * Uses the existing layout manager's root.
 */
function DashboardContent({ children }: DashboardContentProps): JSX.Element {
  const normalizedChildren = normalizeDashboardChildren(children);
  const { eventHub } = useLayoutManager();
  const status = useWidgetStatus();
  const widgetId = getWidgetId(status.descriptor);
  const panelManager = useContext(ReactPanelManagerContext);

  // Child panels open in effects that run before this one, so the open ids are complete
  // here; portal contents aren't, since portals are only claimed on a later render.
  useEffect(() => {
    if (status.status !== 'ready' || panelManager == null) {
      return;
    }
    panelManager.onDocumentRendered();
    emitDocumentRendered(eventHub, {
      widgetId,
      panelIds: panelManager.getOpenPanelIds(),
    });
  }, [eventHub, panelManager, status.status, widgetId, normalizedChildren]);

  return (
    // Reset the root so that any children fetching the parent item will default to the layoutManager's root.
    <ParentItemContext.Provider value={null}>
      {normalizedChildren}
    </ParentItemContext.Provider>
  );
}

export default DashboardContent;
