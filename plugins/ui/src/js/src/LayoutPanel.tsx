import { useEffect, useMemo, useState } from 'react';
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

  /** Title of the panel */
  title: string;
}

/**
 * Adds and tracks a panel to the GoldenLayout. When the child element is updated, the contents of the panel will also be updated. When unmounted, the panel will be removed.
 */
function LayoutPanel({ children, layout, title }: LayoutPanelProps) {
  const panelId = useMemo(() => shortid(), []);
  const element = useMemo(() => document.createElement('div'), []);
  const [isPanelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const config = {
      type: 'react-component' as const,
      component: PortalPanel.displayName,
      props: {
        id: panelId,
        element,
      },
      title,
      id: panelId,
    };

    const { root } = layout;
    console.log('MJB openComponent');
    LayoutUtils.openComponent({ root, config });
    setPanelOpen(true);
    // TODO: Need to listen for the panel to close, and then setPanelOpen(false) ... but how? Should it notify the widget handler to remove the panel? How do you get it back?
    return () => {
      console.log('MJB closeComponent');
      LayoutUtils.closeComponent(layout.root, { id: panelId });
    };
  }, [element, layout, panelId, title]);

  console.log('MJB LayoutPanel rendering portal');
  return isPanelOpen ? ReactDOM.createPortal(children, element) : null;
}

export default LayoutPanel;
