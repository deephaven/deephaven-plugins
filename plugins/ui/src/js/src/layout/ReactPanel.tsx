import React, { useCallback, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  LayoutUtils,
  PanelEvent,
  useLayoutManager,
  useListener,
} from '@deephaven/dashboard';
import Log from '@deephaven/log';
import PortalPanel from './PortalPanel';
import { ReactPanelControl, useReactPanel } from './ReactPanelManager';
import { ReactPanelProps } from './LayoutUtils';
import { useParentItem } from './ParentItemContext';
import { ReactPanelContext } from './ReactPanelContext';
import { usePortalPanelManager } from './PortalPanelManagerContext';

const log = Log.module('@deephaven/js-plugin-ui/ReactPanel');

/**
 * Adds and tracks a panel to the GoldenLayout. When the child element is updated, the contents of the panel will also be updated. When unmounted, the panel will be removed.
 */
function ReactPanel({ children, title }: ReactPanelProps) {
  const layoutManager = useLayoutManager();
  const { metadata, onClose, onOpen, panelId } = useReactPanel();
  const portalManager = usePortalPanelManager();
  const portal = portalManager.get(panelId);

  // If there is already a portal that exists, then we're rehydrating from a dehydrated state
  // Initialize the `isPanelOpenRef` and `openedWidgetRef` accordingly on initialization
  const isPanelOpenRef = useRef(portal != null);
  const openedMetadataRef = useRef<ReactPanelControl['metadata'] | null>(
    portal != null ? metadata : null
  );
  const parent = useParentItem();
  const { eventHub } = layoutManager;

  log.debug2('Rendering panel', panelId);

  useEffect(
    () => () => {
      if (isPanelOpenRef.current) {
        log.debug('Closing panel', panelId);
        LayoutUtils.closeComponent(parent, { id: panelId });
        isPanelOpenRef.current = false;
        onClose();
      }
    },
    [parent, onClose, panelId]
  );

  const handlePanelClosed = useCallback(
    closedPanelId => {
      if (closedPanelId === panelId) {
        log.debug('Panel closed', panelId);
        isPanelOpenRef.current = false;
        onClose();
      }
    },
    [onClose, panelId]
  );

  useListener(eventHub, PanelEvent.CLOSED, handlePanelClosed);

  useEffect(
    /** Opens a panel in the layout if necessary. Triggered when the panel metadata changes or the panel has not been opened yet. */
    function openIfNecessary() {
      if (isPanelOpenRef.current === false) {
        const existingStack = LayoutUtils.getStackForConfig(parent, {
          id: panelId,
        });
        if (existingStack != null) {
          log.debug2('Panel already exists, just re-using');
          isPanelOpenRef.current = true;
          return;
        }
      }

      if (
        isPanelOpenRef.current === false ||
        openedMetadataRef.current !== metadata
      ) {
        const panelTitle = title ?? metadata?.name ?? '';
        const config = {
          type: 'react-component' as const,
          component: PortalPanel.displayName,
          props: {},
          title: panelTitle,
          id: panelId,
        };

        LayoutUtils.openComponent({ root: parent, config });
        log.debug('Opened panel', panelId, config);
        isPanelOpenRef.current = true;
        openedMetadataRef.current = metadata;

        onOpen();
      }
    },
    [parent, metadata, onOpen, panelId, title]
  );

  return portal
    ? ReactDOM.createPortal(
        <ReactPanelContext.Provider value={panelId}>
          {children}
        </ReactPanelContext.Provider>,
        portal
      )
    : null;
}

export default ReactPanel;
