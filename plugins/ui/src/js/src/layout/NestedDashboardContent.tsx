import React, { useMemo } from 'react';
import { useLayoutManager } from '@deephaven/dashboard';
import { nanoid } from 'nanoid';
import { normalizeDashboardChildren } from './LayoutUtils';
import { ReactPanelContext } from './ReactPanelContext';
import {
  ReactPanelManager,
  ReactPanelManagerContext,
} from './ReactPanelManager';
import { ParentItemContext } from './ParentItemContext';
import PortalPanelManager from './PortalPanelManager';
import DashboardContent from './DashboardContent';

interface NestedDashboardContentProps {
  children: React.ReactNode;
}

/**
 * Content rendered inside the nested dashboard's layout.
 * This component sets up the necessary context providers for nested panels.
 */
function NestedDashboardContent({
  children,
}: NestedDashboardContentProps): JSX.Element {
  const panelManager: ReactPanelManager = useMemo(() => {
    // Track panel IDs that have been generated for rehydration purposes
    const panelIdCounter = { current: 0 };
    // Store data for each panel
    const panelDataMap = new Map<string, unknown[]>();

    return {
      metadata: undefined,
      onOpen: (panelId: string) => {
        // Called when a panel is opened in this nested dashboard
      },
      onClose: (panelId: string) => {
        // Called when a panel is closed in this nested dashboard
        panelDataMap.delete(panelId);
      },
      onDataChange: (panelId: string, data: unknown[]) => {
        panelDataMap.set(panelId, data);
      },
      getInitialData: (panelId: string) => panelDataMap.get(panelId) ?? [],
      getPanelId: () => {
        panelIdCounter.current += 1;
        return `nested-panel-${nanoid()}`;
      },
    };
  }, []);

  return (
    <PortalPanelManager>
      <ReactPanelManagerContext.Provider value={panelManager}>
        {/* Reset ReactPanelContext so nested panels don't throw NestedPanelError */}
        <ReactPanelContext.Provider value={null}>
          <DashboardContent>{children}</DashboardContent>
        </ReactPanelContext.Provider>
      </ReactPanelManagerContext.Provider>
    </PortalPanelManager>
  );
}

export default NestedDashboardContent;
