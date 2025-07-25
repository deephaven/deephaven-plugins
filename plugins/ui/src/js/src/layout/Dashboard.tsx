import React, { useCallback, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  Dashboard as DHCDashboard,
  LayoutManagerContext,
} from '@deephaven/dashboard';
import GoldenLayout from '@deephaven/golden-layout';
import { useDashboardPlugins } from '@deephaven/plugin';
import Log from '@deephaven/log';
import {
  normalizeDashboardChildren,
  type DashboardElementProps,
} from './LayoutUtils';
import { ParentItemContext, useParentItem } from './ParentItemContext';
import ReactPanel from './ReactPanel';
import { ReactPanelContext, usePanelId } from './ReactPanelContext';
import useWidgetStatus from './useWidgetStatus';
import { ReactPanelManagerContext } from './ReactPanelManager';
import PortalPanelManager from './PortalPanelManager';

const log = Log.module('@deephaven/js-plugin-ui/DocumentHandler');

function Dashboard({ children }: DashboardElementProps): JSX.Element | null {
  const [childLayout, setChildLayout] = useState<GoldenLayout>();
  // const parent = useParentItem();
  const plugins = useDashboardPlugins();

  const normalizedChildren = normalizeDashboardChildren(children);
  console.log('xxx doing a dashboard with layout', childLayout);

  const panelIdIndex = useRef(0);
  // panelIds that are currently opened within this document. This list is tracked by the `onOpen`/`onClose` call on the `ReactPanelManager` from a child component.
  // Note that the initial widget data provided will be the `panelIds` for this document to use; this array is what is actually opened currently.
  const panelIds = useRef<string[]>([]);

  // Flag to signal the panel counts have changed in the last render
  // We may need to check if we need to close this widget if all panels are closed
  const [isPanelsDirty, setPanelsDirty] = useState(false);

  const handleOpen = useCallback(
    (panelId: string) => {
      if (panelIds.current.includes(panelId)) {
        throw new Error('Duplicate panel opens received');
      }

      panelIds.current.push(panelId);
      log.debug('Panel opened, open count', panelIds.current.length);

      setPanelsDirty(true);
    },
    [panelIds]
  );

  const handleClose = useCallback(
    (panelId: string) => {
      const panelIndex = panelIds.current.indexOf(panelId);
      if (panelIndex === -1) {
        throw new Error('Panel close received for unknown panel');
      }

      panelIds.current.splice(panelIndex, 1);
      log.debug('Panel closed, open count', panelIds.current.length);

      setPanelsDirty(true);
    },
    [panelIds]
  );

  const getPanelId = useCallback(() => {
    // On rehydration, yield known IDs first
    // If there are no more known IDs, generate a new one.
    // This can happen if the document hasn't been opened before, or if it's rehydrated and a new panel is added.
    // Note that if the order of panels changes, the worst case scenario is that panels appear in the wrong location in the layout.
    const panelId = nanoid();
    panelIdIndex.current += 1;
    return panelId;
  }, []);

  const widgetStatus = useWidgetStatus();
  const panelManager = useMemo(
    () => ({
      metadata: widgetStatus.descriptor,
      onOpen: handleOpen,
      onClose: handleClose,
      onDataChange: () => log.debug('xxx Panel data changed'),
      getPanelId,
      getInitialData: () => [],
    }),
    [
      widgetStatus,
      getPanelId,
      handleClose,
      handleOpen,
      // handleDataChange,
      // getInitialData,
    ]
  );
  const [isLayoutInitialized, setLayoutInitialized] = useState(false);

  return (
    // <>
    <>
      {/* <ReactPanelManagerContext.Provider value={panelManager}> */}
      <DHCDashboard
        onGoldenLayoutChange={setChildLayout}
        onLayoutInitialized={() => setLayoutInitialized(true)}
      >
        {plugins}
        <PortalPanelManager>
          <ReactPanelManagerContext.Provider value={panelManager}>
            <ParentItemContext.Provider value={null}>
              <ReactPanelContext.Provider value={null}>
                {isLayoutInitialized && normalizedChildren}
              </ReactPanelContext.Provider>
            </ParentItemContext.Provider>
          </ReactPanelManagerContext.Provider>
        </PortalPanelManager>
      </DHCDashboard>
      {/* </ReactPanelManagerContext.Provider> */}
      {/* Resetting the panel ID so the children don't get confused */}
      {/* <ReactPanelContext.Provider value={null}>
        <ReactPanelManagerContext.Provider value={panelManager}>
          {childLayout != null && (
            <LayoutManagerContext.Provider value={childLayout}>
              <ParentItemContext.Provider value={childLayout.root}>
                {normalizedChildren}
              </ParentItemContext.Provider>
            </LayoutManagerContext.Provider>
          )}
        </ReactPanelManagerContext.Provider>
      </ReactPanelContext.Provider> */}
    </>
    // </>
  );
  // <ParentItemContext.Provider value={parent}>
  //       {normalizedChildren}
  //     </ParentItemContext.Provider>
  // </DashboardLayout>
}

export default Dashboard;
