import { useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import shortid from 'shortid';
import {
  DashboardPluginComponentProps,
  LayoutUtils,
} from '@deephaven/dashboard';
import PortalPanel from './PortalPanel';

export interface LayoutPanelProps {
  /** What to render in the panel */
  children: React.ReactNode;

  /** Layout to add the panel to */
  layout: DashboardPluginComponentProps['layout'];
}

/**
 * Adds and tracks a panel to the GoldenLayout. When the child element is updated, the contents of the panel will also be updated. When unmounted, the panel will be removed.
 */
function LayoutPanel({ children, layout }: LayoutPanelProps) {
  const panelId = useMemo(() => shortid(), []);
  const element = useMemo(() => document.createElement('div'), []);

  useEffect(() => {
    const config = {
      type: 'react-component' as const,
      component: PortalPanel.displayName,
      props: {
        id: panelId,
        element,
      },
      title: 'Portal Panel',
      id: panelId,
    };

    const { root } = layout;
    LayoutUtils.openComponent({ root, config });
    return () => {
      LayoutUtils.closeComponent(layout.root, { id: panelId });
    };
  }, [element, layout, panelId]);

  return ReactDOM.createPortal(children, element);
}

export default LayoutPanel;
