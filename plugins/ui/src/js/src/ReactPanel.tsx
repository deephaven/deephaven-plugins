import { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import shortid from 'shortid';
import { LayoutUtils, PanelEvent } from '@deephaven/dashboard';
import Log from '@deephaven/log';
import PortalPanel from './PortalPanel';
import useLayout from './useLayout';

const log = Log.module('@deephaven/js-plugin-ui/ReactPanel');

export interface ReactPanelProps {
  /** What to render in the panel */
  children: React.ReactNode;

  /** Title of the panel */
  title: string;
}

/**
 * Adds and tracks a panel to the GoldenLayout. When the child element is updated, the contents of the panel will also be updated. When unmounted, the panel will be removed.
 */
function ReactPanel({ children, title }: ReactPanelProps) {
  const layout = useLayout();
  const panelId = useMemo(() => shortid(), []);
  const [element, setElement] = useState<HTMLElement>();
  const panelOpenRef = useRef(false);

  log.debug('Rendering panel', panelId);

  useEffect(() => {
    const { eventHub } = layout;

    function handlePanelClosed(closedPanelId: string): void {
      if (closedPanelId === panelId) {
        panelOpenRef.current = false;
        setElement(undefined);
      }
    }

    eventHub.on(PanelEvent.CLOSED, handlePanelClosed);
    return () => {
      eventHub.off(PanelEvent.CLOSED, handlePanelClosed);
      if (panelOpenRef.current) {
        LayoutUtils.closeComponent(layout.root, { id: panelId });
        panelOpenRef.current = false;
      }
    };
  }, [layout, panelId]);

  useEffect(() => {
    if (panelOpenRef.current === false) {
      const newElement = document.createElement('div');
      const config = {
        type: 'react-component' as const,
        component: PortalPanel.displayName,
        props: {
          id: panelId,
          element: newElement,
        },
        title,
        id: panelId,
      };

      const { root } = layout;
      LayoutUtils.openComponent({ root, config });
      log.debug('Opened panel', panelId, config);
      panelOpenRef.current = true;
      setElement(newElement);
    }
  }, [children, layout, panelId, title]);

  return element ? ReactDOM.createPortal(children, element) : null;
}

export default ReactPanel;
