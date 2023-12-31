import React, { useEffect, useRef } from 'react';
import { DashboardPanelProps } from '@deephaven/dashboard';
import { Panel } from '@deephaven/dashboard-core-plugins';

export interface PortalPanelProps extends DashboardPanelProps {
  /** Listener for when the portal panel is unmounted/closed */
  onClose: () => void;

  /** Listener for when the portal panel is opened and ready */
  onOpen: (element: HTMLElement) => void;
}

/**
 * Adds and tracks a panel to the GoldenLayout.
 * Takes an HTMLElement that can be used as a Portal in another component.
 */
function PortalPanel({
  glContainer,
  glEventHub,
  onClose,
  onOpen,
}: PortalPanelProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { current } = ref;
    if (current == null) {
      return;
    }
    onOpen(current);

    return () => {
      onClose();
    };
  }, [onClose, onOpen]);

  return (
    <Panel glContainer={glContainer} glEventHub={glEventHub}>
      <div className="ui-portal-panel" ref={ref} />
    </Panel>
  );
}

PortalPanel.displayName = '@deephaven/js-plugin-ui/PortalPanel';

export default PortalPanel;
