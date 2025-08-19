import React, { useEffect, useRef } from 'react';
import { DashboardPanelProps } from '@deephaven/dashboard';
import { CorePanel } from '@deephaven/dashboard-core-plugins';
import { emitPortalClosed, emitPortalOpened } from './PortalPanelEvent';
import PortalPanelTooltip from './PortalPanelTooltip';

/**
 * Adds and tracks a panel to the GoldenLayout.
 * Takes an HTMLElement that can be used as a Portal in another component.
 */
function PortalPanel({
  glContainer,
  glEventHub,
  metadata,
}: DashboardPanelProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { current } = ref;
    if (current == null) {
      return;
    }
    emitPortalOpened(glEventHub, { container: glContainer, element: current });

    return () => {
      emitPortalClosed(glEventHub, { container: glContainer });
    };
  }, [glContainer, glEventHub]);

  return (
    <CorePanel
      glContainer={glContainer}
      glEventHub={glEventHub}
      renderTabTooltip={() => (
        <PortalPanelTooltip
          name={glContainer.getConfig().variableName}
          metadata={metadata}
        />
      )}
    >
      <div className="ui-portal-panel" ref={ref} />
    </CorePanel>
  );
}

PortalPanel.displayName = '@deephaven/js-plugin-ui/PortalPanel';

export default PortalPanel;
