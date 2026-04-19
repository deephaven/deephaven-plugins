import React, { type PropsWithChildren } from 'react';
import { usePersistentState } from '@deephaven/dashboard';
import { ReactPanelContext } from './ReactPanelContext';
import { ReactPanelManagerContext } from './ReactPanelManager';
import PortalPanelManager from './PortalPanelManager';
import DashboardContent from './DashboardContent';
import usePanelManager from './usePanelManager';
import useWidgetStatus from './useWidgetStatus';
import { type WidgetData } from '../widget/WidgetTypes';
import { type ElementIdProps } from './LayoutUtils';

type NestedDashboardContentProps = PropsWithChildren<ElementIdProps>;

/**
 * Content rendered inside the nested dashboard's layout.
 * This component sets up the necessary context providers for nested panels.
 */
function NestedDashboardContent({
  children,
}: NestedDashboardContentProps): JSX.Element {
  const { descriptor: widget } = useWidgetStatus();
  const [widgetData, setWidgetData] = usePersistentState<
    WidgetData | undefined
  >(undefined, { type: 'NestedDashboardWidgetData', version: 1 });
  const panelManager = usePanelManager({
    widget,
    onDataChange: setWidgetData,
    initialData: widgetData,
  });

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
