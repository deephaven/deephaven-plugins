import React from 'react';
import { DashboardPanelProps } from '@deephaven/dashboard';
import { WidgetPanelTooltip } from '@deephaven/dashboard-core-plugins';

type PortalPanelTooltipProps = {
  name: string;
  metadata: DashboardPanelProps['metadata'];
};

/**
 * Renders a tooltip for a portal panel in the dashboard.
 */
function PortalPanelTooltip({
  name,
  metadata,
}: PortalPanelTooltipProps): JSX.Element {
  const panelDescriptor = {
    ...metadata,
    type: 'Component',
    name,
  };

  return <WidgetPanelTooltip descriptor={panelDescriptor} />;
}

PortalPanelTooltip.displayName = '@deephaven/js-plugin-ui/PortalPanelTooltip';

export default PortalPanelTooltip;
