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

  /** Triggered when this panel is opened */
  onOpen?: () => void;

  /** Triggered when this panel is closed */
  onClose?: () => void;
}

/**
 * Adds and tracks a panel to the GoldenLayout. When the child element is updated, the contents of the panel will also be updated. When unmounted, the panel will be removed.
 */
function ReactPanel({ children, onClose, onOpen, title }: ReactPanelProps) {
  const layout = useLayout();
  const panelId = useMemo(() => shortid(), []);
  const [element, setElement] = useState<HTMLElement>();
  const panelOpenRef = useRef(false);

  log.debug('Rendering panel', panelId);

  useEffect(
    () => () => {
      if (panelOpenRef.current) {
        LayoutUtils.closeComponent(layout.root, { id: panelId });
        panelOpenRef.current = false;
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
    if (panelOpenRef.current === false) {
      const config = {
        type: 'react-component' as const,
        component: PortalPanel.displayName,
        props: {
          id: panelId,
          onClose: () => {
            panelOpenRef.current = false;
            setElement(undefined);
          },
          onOpen: setElement,
        },
        title,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config });
      log.debug('Opened panel', panelId, config);
      panelOpenRef.current = true;

      onOpen?.();
    }
  }, [children, layout, onOpen, panelId, title]);

  return element ? ReactDOM.createPortal(children, element) : null;
}

export default ReactPanel;
