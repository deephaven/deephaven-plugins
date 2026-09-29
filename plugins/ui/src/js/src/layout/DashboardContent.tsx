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
  const onDocumentRendered = useContext(ReactPanelManagerContext)
    ?.onDocumentRendered;

  // Once the document is done loading, all of its panels have rendered into their
  // portals. Signal so any PortalPanel restored from a saved layout that this document
  // no longer fills (fewer panels than were saved) can evict itself instead of showing blank.
  // Child panels open in their own effects, which run before this one.
  useEffect(() => {
    if (status.status === 'ready') {
      onDocumentRendered?.();
      emitDocumentRendered(eventHub, { widgetId });
    }
  }, [
    eventHub,
    status.status,
    widgetId,
    normalizedChildren,
    onDocumentRendered,
  ]);

  return (
    // Reset the root so that any children fetching the parent item will default to the layoutManager's root.
    <ParentItemContext.Provider value={null}>
      {normalizedChildren}
    </ParentItemContext.Provider>
  );
}

export default DashboardContent;
