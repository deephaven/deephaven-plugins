import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import shortid from 'shortid';
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
 * Will trigger an `onOpen` when the portal is opened, and `onClose` when closed.
 * Note that because the `PortalPanel` will be saved with the GoldenLayout config, it's possible there is already a panel that exists with the same ID.
 * In that case, the existing panel will be re-used.
 */
function ReactPanel({ children, title }: ReactPanelProps): JSX.Element | null {
  const layoutManager = useLayoutManager();
  const { metadata, onClose, onOpen, panelId } = useReactPanel();
  const portalManager = usePortalPanelManager();
  const portal = portalManager.get(panelId);

  // Tracks whether the panel is open and that we have emitted the onOpen event
  const isPanelOpenRef = useRef(false);
  // If there is already a portal that exists, then we're rehydrating from a dehydrated state
  // Initialize the `openedWidgetRef` accordingly on initialization
  const openedMetadataRef = useRef<ReactPanelControl['metadata']>(
    portal == null ? undefined : metadata
  );

  // We want to regenerate the key every time the metadata changes, so that the portal is re-rendered
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const contentKey = useMemo(() => shortid.generate(), [metadata]);

  const parent = useParentItem();
  const { eventHub } = layoutManager;

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
      if (closedPanelId === panelId && isPanelOpenRef.current) {
        log.debug('Panel closed', panelId);
        isPanelOpenRef.current = false;
        onClose();
      }
    },
    [onClose, panelId]
  );

  useListener(eventHub, PanelEvent.CLOSED, handlePanelClosed);

  useEffect(
    /**
     * Opens a panel in the layout if necessary. There are a few cases this is triggered:
     * 1. Panel has not been opened yet: we need to open the panel in this case.
     * 2. Panel metadata changes: we need to update the panel with the new metadata, show the panel in its current stack,
     *    and refresh the content with new state.
     * 3. Widget is being re-hydrated: we need to check if the panel ID is already open, and then use that existing portal.
     *    We don't need to focus in this case, as this is when a whole dashboard is being re-hydrated - not when the user is
     *    opening this widget in particular.
     */
    function openIfNecessary() {
      const itemConfig = { id: panelId };
      const existingStack = LayoutUtils.getStackForConfig(parent, itemConfig);
      if (existingStack == null) {
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
      } else if (openedMetadataRef.current !== metadata) {
        const contentItem = LayoutUtils.getContentItemInStack(
          existingStack,
          itemConfig
        );
        if (contentItem != null) {
          existingStack.setActiveContentItem(contentItem);
        }
      }

      openedMetadataRef.current = metadata;
      if (!isPanelOpenRef.current) {
        // We don't need to send an opened signal again
        isPanelOpenRef.current = true;
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
        portal,
        contentKey
      )
    : null;
}

export default ReactPanel;
