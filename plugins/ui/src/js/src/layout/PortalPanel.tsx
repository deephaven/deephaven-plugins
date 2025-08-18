import React, { useEffect, useRef } from 'react';
import {
  DashboardPanelProps,
  useDashboardPluginData,
} from '@deephaven/dashboard';
import { Panel, WidgetPanelTooltip } from '@deephaven/dashboard-core-plugins';
import { emitPortalClosed, emitPortalOpened } from './PortalPanelEvent';

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

  const panelDescriptor = {
    ...metadata,
    type: 'Component',
    name: glContainer.getConfig().title ?? '',
  };

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
    <Panel
      glContainer={glContainer}
      glEventHub={glEventHub}
      renderTabTooltip={() => (
        <WidgetPanelTooltip descriptor={panelDescriptor} />
      )}
    >
      <div className="ui-portal-panel" ref={ref} />
    </Panel>
  );
}

PortalPanel.displayName = '@deephaven/js-plugin-ui/PortalPanel';

export default PortalPanel;
