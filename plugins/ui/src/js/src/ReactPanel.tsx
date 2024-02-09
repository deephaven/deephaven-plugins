import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { useReactPanelManager } from './ReactPanelManager';
import { ReactPanelProps } from './layout/LayoutUtils';
import { useParentItem } from './layout/ParentItemContext';
import { ReactPanelContext } from './ReactPanelContext';

const log = Log.module('@deephaven/js-plugin-ui/ReactPanel');

/**
 * Adds and tracks a panel to the GoldenLayout. When the child element is updated, the contents of the panel will also be updated. When unmounted, the panel will be removed.
 */
function ReactPanel({ children, title }: ReactPanelProps) {
  const layoutManager = useLayoutManager();
  const panelManager = useReactPanelManager();
  const { metadata, onClose, onOpen } = panelManager;
  const panelId = useMemo(() => shortid(), []);
  const [element, setElement] = useState<HTMLElement>();
  const isPanelOpenRef = useRef(false);
  const openedMetadataRef = useRef<Record<string, unknown>>();
  const parent = useParentItem();

  log.debug2('Rendering panel', panelId);

  useEffect(
    () => () => {
      if (isPanelOpenRef.current) {
        log.debug('Closing panel', panelId);
        LayoutUtils.closeComponent(parent, { id: panelId });
        isPanelOpenRef.current = false;
        onClose(panelId);
      }
    },
    [parent, onClose, panelId]
  );

  const handlePanelClosed = useCallback(
    closedPanelId => {
      if (closedPanelId === panelId) {
        log.debug('Panel closed', panelId);
        isPanelOpenRef.current = false;
        onClose(panelId);
      }
    },
    [onClose, panelId]
  );

  useListener(layoutManager.eventHub, PanelEvent.CLOSED, handlePanelClosed);

  useEffect(() => {
    if (
      isPanelOpenRef.current === false ||
      openedMetadataRef.current !== metadata
    ) {
      const panelTitle =
        title ?? (typeof metadata?.name === 'string' ? metadata.name : '');
      const config = {
        type: 'react-component' as const,
        component: PortalPanel.displayName,
        props: {
          id: panelId,
          onClose: () => {
            isPanelOpenRef.current = false;
            setElement(undefined);
          },
          onOpen: setElement,
          metadata,
        },
        title: panelTitle,
        id: panelId,
      };

      LayoutUtils.openComponent({ root: parent, config });
      log.debug('Opened panel', panelId, config);
      isPanelOpenRef.current = true;
      openedMetadataRef.current = metadata;

      onOpen(panelId);
    }
  }, [parent, metadata, onOpen, panelId, title]);

  return element
    ? ReactDOM.createPortal(
        <ReactPanelContext.Provider value={panelId}>
          {children}
        </ReactPanelContext.Provider>,
        element
      )
    : null;
}

export default ReactPanel;
