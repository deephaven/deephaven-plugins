import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const log = Log.module('@deephaven/js-plugin-ui/ReactPanel');

export type ReactPanelProps = React.PropsWithChildren<{
  /** Title of the panel */
  title: string;

  /**
   * Metadata to pass to the panel.
   * Updating the metadata will cause the panel to be re-opened, or replaced if it is closed.
   * Can also be used for rehydration.
   */
  metadata?: Record<string, unknown>;

  /** Triggered when this panel is opened */
  onOpen?: () => void;

  /** Triggered when this panel is closed */
  onClose?: () => void;
}>;

/**
 * Adds and tracks a panel to the GoldenLayout. When the child element is updated, the contents of the panel will also be updated. When unmounted, the panel will be removed.
 */
function ReactPanel({
  children,
  metadata,
  onClose,
  onOpen,
  title,
}: ReactPanelProps) {
  const layoutManager = useLayoutManager();
  const panelId = useMemo(() => shortid(), []);
  const [element, setElement] = useState<HTMLElement>();
  const isPanelOpenRef = useRef(false);
  const openedMetadataRef = useRef<Record<string, unknown>>();

  log.debug2('Rendering panel', panelId);

  useEffect(
    () => () => {
      if (isPanelOpenRef.current) {
        log.debug('Closing panel', panelId);
        LayoutUtils.closeComponent(layoutManager.root, { id: panelId });
        isPanelOpenRef.current = false;
        onClose?.();
      }
    },
    [layoutManager, onClose, panelId]
  );

  const handlePanelClosed = useCallback(
    closedPanelId => {
      if (closedPanelId === panelId) {
        log.debug('Panel closed', panelId);
        isPanelOpenRef.current = false;
        onClose?.();
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
        title,
        id: panelId,
      };

      const { root } = layoutManager;
      LayoutUtils.openComponent({ root, config });
      log.debug('Opened panel', panelId, config);
      isPanelOpenRef.current = true;
      openedMetadataRef.current = metadata;

      onOpen?.();
    }
  }, [layoutManager, metadata, onOpen, panelId, title]);

  return element ? ReactDOM.createPortal(children, element) : null;
}

export default ReactPanel;
