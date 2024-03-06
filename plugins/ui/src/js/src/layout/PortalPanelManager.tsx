import React, { useCallback, useState } from 'react';
import { LayoutUtils, useLayoutManager } from '@deephaven/dashboard';
import {
  PortalPanelMap,
  PortalPanelManagerContext,
} from './PortalPanelManagerContext';
import {
  usePortalClosedListener,
  usePortalOpenedListener,
} from './PortalPanelEvent';

/**
 * Listens for PortalPanels being opened and closed, and maintains a map of currently open portal elements.
 * Sets this in the PortalPanelManagerContext for downstream consumption.
 */
function PortalPanelManager({
  children,
}: React.PropsWithChildren<unknown>): JSX.Element {
  const { eventHub } = useLayoutManager();
  const [portals, setPortals] = useState<PortalPanelMap>(new Map());

  const handlePortalOpened = useCallback(({ container, element }) => {
    setPortals(prevPortals => {
      const containerId = LayoutUtils.getIdFromContainer(container);
      if (containerId == null) {
        throw new Error('Invalid panel ID');
      }

      const panelId = Array.isArray(containerId) ? containerId[0] : containerId;
      const newPortals = new Map(prevPortals);
      newPortals.set(panelId, element);
      return newPortals;
    });
  }, []);

  const handlePortalClosed = useCallback(({ container }) => {
    setPortals(prevPortals => {
      const containerId = LayoutUtils.getIdFromContainer(container);
      if (containerId == null) {
        throw new Error('Invalid panel ID');
      }

      const panelId = Array.isArray(containerId) ? containerId[0] : containerId;
      const newPortals = new Map(prevPortals);
      newPortals.delete(panelId);
      return newPortals;
    });
  }, []);

  usePortalOpenedListener(eventHub, handlePortalOpened);
  usePortalClosedListener(eventHub, handlePortalClosed);

  return (
    <PortalPanelManagerContext.Provider value={portals}>
      {children}
    </PortalPanelManagerContext.Provider>
  );
}

export default PortalPanelManager;
