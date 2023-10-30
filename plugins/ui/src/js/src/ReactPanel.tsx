import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import shortid from 'shortid';
import { LayoutUtils, PanelEvent, useListener } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import PortalPanel from './PortalPanel';
import useLayout from './useLayout';

const log = Log.module('@deephaven/js-plugin-ui/ReactPanel');

export interface ReactPanelProps {
  /** What to render in the panel */
  children: React.ReactNode;

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
}

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
  const layout = useLayout();
  const panelId = useMemo(() => shortid(), []);
  const [element, setElement] = useState<HTMLElement>();
  const isPanelOpenRef = useRef(false);
  const openedMetadataRef = useRef();

  log.debug('Rendering panel', panelId);

  useEffect(
    () => () => {
      if (isPanelOpenRef.current) {
        log.debug('Closing panel', panelId);
        LayoutUtils.closeComponent(layout.root, { id: panelId });
        isPanelOpenRef.current = false;
        onClose?.();
      }
    },
    [layout, onClose, panelId]
  );

  const handlePanelClosed = useCallback(
    closedPanelId => {
      if (closedPanelId === panelId) {
        log.debug('Panel closed', panelId);
        onClose?.();
      }
    },
    [onClose, panelId]
  );

  useListener(layout.eventHub, PanelEvent.CLOSED, handlePanelClosed);

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

      const { root } = layout;
      LayoutUtils.openComponent({ root, config });
      log.debug('Opened panel', panelId, config);
      isPanelOpenRef.current = true;

      onOpen?.();
    }
  }, [children, layout, metadata, onOpen, panelId, title]);

  return element ? ReactDOM.createPortal(children, element) : null;
}

export default ReactPanel;
